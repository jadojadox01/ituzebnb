import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { checkTransactionStatus } from "@/lib/intouchpay";
import {
  applyIntouchPaymentUpdate,
  findPaymentTransaction,
  logPayment,
} from "@/lib/paymentTransactions";
import { PAYMENT_EVENTS, writePaymentLog } from "@/lib/paymentLogs";
import { logIntouchFailure } from "@/lib/logger";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

export async function POST(request) {
  try {
    const ip = getClientIp(request);
    const limit = rateLimit(`payment-status:${ip}`, { limit: 20, windowMs: 60_000 });
    if (!limit.allowed) {
      return NextResponse.json({ error: "Too many status checks." }, { status: 429 });
    }

    const authUser = await requireAuth();
    const body = await request.json();

    const requestTransactionId =
      body.requestTransactionId ||
      body.requesttransactionid ||
      body.request_transaction_id;

    const transactionId = body.transactionId || body.transactionid;

    if (!requestTransactionId && !transactionId) {
      return NextResponse.json(
        { error: "requestTransactionId or transactionId is required." },
        { status: 400 }
      );
    }

    let transaction = await findPaymentTransaction({
      requestTransactionId,
      intouchTransactionId: transactionId,
    });

    if (transaction) {
      const booking = await prisma.booking.findUnique({
        where: { booking_id: transaction.order_id },
      });
      if (booking && booking.user_id !== authUser.id && authUser.role !== "admin") {
        return NextResponse.json({ error: "Forbidden." }, { status: 403 });
      }
    }

    const intouchResult = await checkTransactionStatus({
      requesttransactionid: requestTransactionId,
      transactionid: transactionId,
    });

    if (transaction) {
      transaction = await applyIntouchPaymentUpdate(transaction, intouchResult);
      await writePaymentLog({
        paymentTransactionId: transaction.id,
        event: PAYMENT_EVENTS.STATUS_CHECK,
        responsePayload: intouchResult,
        status: transaction.status,
      });
    }

    logPayment("status:checked", {
      requestTransactionId,
      transactionId,
      status: transaction?.status || intouchResult?.status,
    });

    return NextResponse.json({
      success: true,
      transaction,
      intouch: intouchResult,
    });
  } catch (error) {
    logIntouchFailure({
      endpoint: "/api/payment/intouchpay/status",
      error,
    });

    if (error.code === "INTOUCH_NOT_CONFIGURED" || error.code === "ENV_NOT_CONFIGURED") {
      return NextResponse.json(
        { error: error.message, missing: error.missing },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: error.message, intouch: error.intouch || null },
      { status: error.status || 500 }
    );
  }
}
