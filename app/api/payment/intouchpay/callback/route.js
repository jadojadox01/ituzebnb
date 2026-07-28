import { mapIntouchStatus } from "@/lib/intouchpay";
import {
  buildIntouchCallbackAck,
  buildIntouchCallbackBody,
  parseIntouchCallbackRequest,
  resolveCallbackRequestId,
} from "@/lib/intouchpayCallback";
import {
  applyIntouchPaymentUpdate,
  findPaymentTransaction,
  logPayment,
} from "@/lib/paymentTransactions";
import { PAYMENT_EVENTS, writePaymentLog } from "@/lib/paymentLogs";
import { logError } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function ack(requestTransactionId, logPayload = null) {
  const requestId =
    resolveCallbackRequestId(logPayload?.payload || {}, logPayload?.raw || {}, requestTransactionId);

  if (logPayload) {
    logPayment("callback:ack", {
      request_id: requestId,
      body: buildIntouchCallbackBody(requestId),
      httpStatus: 200,
    });
  }

  return buildIntouchCallbackAck(requestId);
}

/** IntouchPay may probe the callback URL — return the required JSON shape. */
export async function GET() {
  return ack("healthcheck");
}

export async function POST(request) {
  let parsed = { raw: {}, payload: {}, requestTransactionId: "", intouchTransactionId: "" };

  try {
    parsed = await parseIntouchCallbackRequest(request);
    const { raw, payload, requestTransactionId, intouchTransactionId } = parsed;

    await writePaymentLog({
      event: PAYMENT_EVENTS.CALLBACK_RECEIVED,
      requestPayload: payload?.requesttransactionid ? payload : raw,
      status: mapIntouchStatus(payload),
      errorMessage: !requestTransactionId && !intouchTransactionId ? "Missing transaction reference" : "",
    });

    if (!requestTransactionId && !intouchTransactionId) {
      logPayment("callback:invalid", { raw });
      return ack("", parsed);
    }

    logPayment("callback:received", {
      requestTransactionId,
      intouchTransactionId,
      status: payload.status,
      responseCode: payload.responsecode || payload.responseCode,
    });

    const transaction = await findPaymentTransaction({
      requestTransactionId,
      intouchTransactionId,
    });

    if (!transaction) {
      logPayment("callback:orphan", { requestTransactionId, intouchTransactionId });
      return ack(requestTransactionId, parsed);
    }

    const updated = await applyIntouchPaymentUpdate(transaction, payload);

    await writePaymentLog({
      paymentTransactionId: updated.id,
      event: PAYMENT_EVENTS.CALLBACK_PROCESSED,
      requestPayload: payload,
      responsePayload: {
        status: updated.status,
        ack: JSON.parse(buildIntouchCallbackBody(requestTransactionId || updated.request_transaction_id)),
      },
      status: updated.status,
    });

    logPayment("callback:processed", {
      orderId: updated.order_id,
      requestTransactionId: updated.request_transaction_id,
      status: updated.status,
    });

    return ack(requestTransactionId || updated.request_transaction_id, parsed);
  } catch (error) {
    logError("callback:error", error, { parsed });
    await writePaymentLog({
      event: PAYMENT_EVENTS.CALLBACK_RECEIVED,
      requestPayload: parsed.raw || {},
      status: "ERROR",
      errorMessage: error.message,
    });

    return ack(parsed.requestTransactionId, parsed);
  }
}
