import prisma from "@/lib/prisma";
import { releaseRoom, reserveRoom } from "@/lib/roomAvailability";
import {
  isPaymentFailure,
  isPaymentSuccess,
  isTerminalPaymentStatus,
  mapIntouchStatus,
  providerLabel,
} from "@/lib/intouchpay";
import {
  sendPaymentFailedEmail,
  sendPaymentSuccessEmail,
} from "@/lib/email";
import { createInvoiceAttachment } from "@/lib/invoiceService";
import { PAYMENT_EVENTS, writePaymentLog } from "@/lib/paymentLogs";
import { logIntouchFailure } from "@/lib/logger";

function normalizeStoredStatus(mapped) {
  if (mapped === "SUCCESSFUL") return "SUCCESS";
  return mapped;
}

export async function findPaymentTransaction({ requestTransactionId, intouchTransactionId }) {
  if (requestTransactionId) {
    const byRequest = await prisma.paymentTransaction.findUnique({
      where: { request_transaction_id: requestTransactionId },
    });
    if (byRequest) return byRequest;
  }

  if (intouchTransactionId) {
    return prisma.paymentTransaction.findFirst({
      where: { intouch_transaction_id: intouchTransactionId },
      orderBy: { created_at: "desc" },
    });
  }

  return null;
}

export async function findPendingTransactionForOrder(orderId) {
  return prisma.paymentTransaction.findFirst({
    where: { order_id: orderId, status: "PENDING" },
    orderBy: { created_at: "desc" },
  });
}

export async function createPaymentTransaction({
  orderId,
  requestTransactionId,
  amount,
  phoneNumber,
  message = "",
}) {
  return prisma.paymentTransaction.create({
    data: {
      order_id: orderId,
      request_transaction_id: requestTransactionId,
      amount,
      phone_number: phoneNumber,
      status: "PENDING",
      message,
    },
  });
}

async function notifyCustomer(transaction, booking, outcome) {
  if (!booking?.user) return;

  if (outcome === "SUCCESS") {
    const fresh = await prisma.booking.findUnique({
      where: { id: booking.id },
      include: {
        user: { select: { name: true, email: true, phone: true } },
        room: { select: { title: true, room_type: true } },
      },
    });

    const pdfAttachment = fresh ? await createInvoiceAttachment(fresh) : null;

    await sendPaymentSuccessEmail({
      to: booking.user.email,
      customerName: booking.user.name,
      orderId: transaction.order_id,
      amount: transaction.amount,
      transactionId: transaction.intouch_transaction_id,
      orderStatus: "awaiting approval",
      roomTitle: fresh?.room?.title || booking.room?.title || "",
      checkIn: fresh?.check_in || booking.check_in,
      checkOut: fresh?.check_out || booking.check_out,
      pdfAttachment,
    });
    return;
  }

  if (outcome === "FAILED" || outcome === "CANCELLED") {
    await sendPaymentFailedEmail({
      to: booking.user.email,
      customerName: booking.user.name,
      orderId: transaction.order_id,
      amount: transaction.amount,
      reason: transaction.message,
    });
  }
}

export async function applyIntouchPaymentUpdate(transaction, payload, options = {}) {
  const mappedStatus = normalizeStoredStatus(mapIntouchStatus(payload));

  if (isTerminalPaymentStatus(transaction.status) && !options.force) {
    await writePaymentLog({
      paymentTransactionId: transaction.id,
      event: PAYMENT_EVENTS.DUPLICATE_CALLBACK,
      requestPayload: payload,
      status: transaction.status,
    });
    return transaction;
  }

  const provider = providerLabel(payload?.provider);
  const responseCode = String(payload?.responsecode || payload?.responseCode || "");
  const message =
    payload?.statusdesc ||
    payload?.message ||
    payload?.StatusDesc ||
    transaction.message ||
    "";

  const intouchTransactionId =
    payload?.transactionid ||
    payload?.transactionId ||
    transaction.intouch_transaction_id ||
    "";

  const updated = await prisma.paymentTransaction.update({
    where: { id: transaction.id },
    data: {
      status: mappedStatus,
      intouch_transaction_id: intouchTransactionId,
      provider,
      response_code: responseCode,
      message,
    },
  });

  const booking = await syncBookingFromTransaction(updated, payload);

  if (mappedStatus === "SUCCESS") {
    await writePaymentLog({
      paymentTransactionId: updated.id,
      event: PAYMENT_EVENTS.SUCCESS,
      responsePayload: payload,
      status: mappedStatus,
    });
    await notifyCustomer(updated, booking, "SUCCESS");
  } else if (mappedStatus === "FAILED" || mappedStatus === "CANCELLED") {
    await writePaymentLog({
      paymentTransactionId: updated.id,
      event: mappedStatus === "CANCELLED" ? PAYMENT_EVENTS.CANCELLED : PAYMENT_EVENTS.FAILED,
      responsePayload: payload,
      status: mappedStatus,
      errorMessage: message,
    });
    await notifyCustomer(updated, booking, mappedStatus);
  }

  return updated;
}

export async function syncBookingFromTransaction(transaction, payload = {}) {
  const booking = await prisma.booking.findUnique({
    where: { booking_id: transaction.order_id },
    include: {
      user: { select: { name: true, email: true } },
      room: { select: { title: true } },
    },
  });

  if (!booking) return null;

  const paymentDetails = {
    request_transaction_id: transaction.request_transaction_id,
    transaction_id: transaction.intouch_transaction_id,
    provider: transaction.provider,
    status: transaction.status,
    response_code: transaction.response_code,
    message: transaction.message,
    callback: payload,
    updated_at: new Date().toISOString(),
  };

  if (transaction.status === "SUCCESS" || isPaymentSuccess(payload)) {
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        payment_status: "paid",
        payment_method: "intouchpay",
        // Stay pending until admin confirms → invoice shows PAID / AWAITING APPROVAL
        status: booking.status === "cancelled" ? "pending" : booking.status === "confirmed" || booking.status === "completed"
          ? booking.status
          : "pending",
        payment_details: JSON.stringify(paymentDetails),
      },
    });
    await prisma.room.update({
      where: { id: booking.room_id },
      data: { status: "booked" },
    });
    return booking;
  }

  if (transaction.status === "FAILED" || transaction.status === "CANCELLED" || isPaymentFailure(payload)) {
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        payment_status: "failed",
        payment_method: "intouchpay",
        status: transaction.status === "CANCELLED" ? "cancelled" : booking.status,
        payment_details: JSON.stringify(paymentDetails),
      },
    });
    await releaseRoom(booking.room_id);
    return booking;
  }

  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      payment_status: "pending",
      payment_method: "intouchpay",
      payment_details: JSON.stringify(paymentDetails),
    },
  });

  await reserveRoom(booking.room_id);
  return booking;
}

import { logPaymentEvent } from "@/lib/logger";

export function logPayment(event, data) {
  logPaymentEvent(event, data);
}
