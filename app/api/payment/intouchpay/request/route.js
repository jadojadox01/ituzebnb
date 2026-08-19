import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { assertBookingAmount } from "@/lib/bookingAmount";
import {
  generateRequestTransactionId,
  normalizeRwandaPhone,
  requestPayment,
} from "@/lib/intouchpay";
import {
  applyIntouchPaymentUpdate,
  createPaymentTransaction,
  getActivePendingTransactionForOrder,
  logPayment,
  markPaymentTransactionFailed,
} from "@/lib/paymentTransactions";
import { PAYMENT_EVENTS, writePaymentLog } from "@/lib/paymentLogs";
import { logIntouchFailure } from "@/lib/logger";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { reserveRoom } from "@/lib/roomAvailability";

export async function POST(request) {
  let bookingRoomId = null;
  let transactionId = null;

  try {
    const ip = getClientIp(request);
    const limit = rateLimit(`payment-request:${ip}`, { limit: 8, windowMs: 60_000 });
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Too many payment requests. Please wait and try again." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(limit.retryAfterMs / 1000)) } }
      );
    }

    const authUser = await requireAuth();
    const body = await request.json();
    const orderId = body.orderId || body.booking_id;
    const phone = body.phone || body.mobilephone || body.phoneNumber;

    if (!orderId || !phone) {
      return NextResponse.json(
        { error: "orderId and phone are required." },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { booking_id: orderId },
      include: { room: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    bookingRoomId = booking.room_id;

    if (booking.user_id !== authUser.id) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    if (booking.payment_status === "paid") {
      return NextResponse.json({ error: "Order is already paid." }, { status: 400 });
    }

    const normalizedPhone = normalizeRwandaPhone(phone);
    const paymentAmount = assertBookingAmount(booking, body.amount ?? booking.total_amount);

    const pending = await getActivePendingTransactionForOrder(orderId);
    if (pending) {
      return NextResponse.json({
        success: true,
        alreadyPending: true,
        message: "Confirm the MoMo prompt on your phone. If it expired, wait a moment and try again.",
        transaction: pending,
        orderId,
      });
    }

    const requestTransactionId = generateRequestTransactionId(orderId);
    const transaction = await createPaymentTransaction({
      orderId,
      requestTransactionId,
      amount: paymentAmount,
      phoneNumber: normalizedPhone,
    });
    transactionId = transaction.id;

    await writePaymentLog({
      paymentTransactionId: transaction.id,
      event: PAYMENT_EVENTS.REQUEST_SENT,
      requestPayload: { orderId, amount: paymentAmount, phone: normalizedPhone },
      status: "PENDING",
    });

    logPayment("request:start", {
      orderId,
      requestTransactionId,
      amount: paymentAmount,
      userId: authUser.id,
    });

    const intouchResult = await requestPayment({
      amount: paymentAmount,
      mobilephone: normalizedPhone,
      requesttransactionid: requestTransactionId,
    });

    const updatedTransaction = await applyIntouchPaymentUpdate(transaction, intouchResult);

    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        total_amount: paymentAmount,
        payment_method: "intouchpay",
        payment_status: updatedTransaction.status === "SUCCESS" ? "paid" : "pending",
      },
    });

    if (updatedTransaction.status !== "FAILED" && updatedTransaction.status !== "CANCELLED") {
      await reserveRoom(booking.room_id);
    }

    await writePaymentLog({
      paymentTransactionId: updatedTransaction.id,
      event: PAYMENT_EVENTS.REQUEST_SUCCESS,
      responsePayload: intouchResult,
      status: updatedTransaction.status,
    });

    return NextResponse.json({
      success: true,
      message: "Payment request sent. Waiting for confirmation.",
      transaction: updatedTransaction,
      payment: intouchResult,
      orderId,
    });
  } catch (error) {
    logIntouchFailure({
      endpoint: "/api/payment/intouchpay/request",
      error,
      transactionId,
      orderId: null,
    });

    if (transactionId) {
      await markPaymentTransactionFailed(transactionId, error.message);
      await writePaymentLog({
        paymentTransactionId: transactionId,
        event: PAYMENT_EVENTS.REQUEST_FAILED,
        responsePayload: error.intouch || null,
        status: "FAILED",
        errorMessage: error.message,
      });
    }

    if (error.code === "INTOUCH_NOT_CONFIGURED" || error.code === "ENV_NOT_CONFIGURED") {
      return NextResponse.json(
        { error: error.message, missing: error.missing },
        { status: 503 }
      );
    }

    if (error.code === "AMOUNT_MISMATCH") {
      return NextResponse.json(
        { error: error.message, expected: error.expected, received: error.received },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message, intouch: error.intouch || null },
      { status: error.status || 500 }
    );
  }
}
