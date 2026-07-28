import prisma from "@/lib/prisma";
import { maskPayload } from "@/lib/mask";
import { logPaymentEvent } from "@/lib/logger";

export const PAYMENT_EVENTS = {
  REQUEST_SENT: "PAYMENT_REQUEST_SENT",
  REQUEST_SUCCESS: "PAYMENT_REQUEST_SUCCESS",
  REQUEST_FAILED: "PAYMENT_REQUEST_FAILED",
  CALLBACK_RECEIVED: "PAYMENT_CALLBACK_RECEIVED",
  CALLBACK_PROCESSED: "PAYMENT_CALLBACK_PROCESSED",
  SUCCESS: "PAYMENT_SUCCESS",
  FAILED: "PAYMENT_FAILED",
  CANCELLED: "PAYMENT_CANCELLED",
  STATUS_CHECK: "PAYMENT_STATUS_CHECK",
  DUPLICATE_CALLBACK: "PAYMENT_DUPLICATE_CALLBACK",
};

export async function writePaymentLog({
  paymentTransactionId = null,
  event,
  requestPayload = null,
  responsePayload = null,
  status = "",
  errorMessage = "",
}) {
  try {
    const row = await prisma.paymentLog.create({
      data: {
        payment_transaction_id: paymentTransactionId,
        event,
        request_payload: requestPayload ? JSON.stringify(maskPayload(requestPayload)) : "",
        response_payload: responsePayload ? JSON.stringify(maskPayload(responsePayload)) : "",
        status,
        error_message: errorMessage,
      },
    });
    logPaymentEvent(event, {
      paymentTransactionId,
      status,
      errorMessage,
    });
    return row;
  } catch (error) {
    logPaymentEvent("PAYMENT_LOG_WRITE_FAILED", {
      event,
      error: error.message,
    });
    return null;
  }
}
