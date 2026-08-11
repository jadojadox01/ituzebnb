import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth, requireAdmin } from "@/lib/auth";
import { reserveRoom } from "@/lib/roomAvailability";
import { isRoomAvailableForDates, calculatePricing, getTaxRate } from "@/lib/availabilityService";
import {
  sendBookingApprovedEmail,
  sendBookingReceivedEmail,
  sendBookingRejectedEmail,
  sendNewBookingAdminEmail,
  sendPaymentSuccessEmail,
} from "@/lib/email";
import { createInvoiceAttachment, getBookingForInvoice } from "@/lib/invoiceService";
import { sanitizeEmail, sanitizePhone, sanitizeText, isValidDateOnly, clampInt } from "@/lib/sanitizeInput";
import { v4 as uuidv4 } from "uuid";

function errorStatus(error) {
  const msg = String(error?.message || "");
  if (msg.includes("Unauthorized")) return 401;
  if (msg.includes("Forbidden")) return 403;
  return 500;
}

export async function GET() {
  try {
    const authUser = await requireAuth();
    let bookings;

    if (authUser.role === "admin") {
      bookings = await prisma.booking.findMany({
        orderBy: { created_at: "desc" },
        include: {
          user: { select: { name: true, email: true, phone: true } },
          room: { select: { id: true, title: true, room_type: true, images: true } },
        },
      });
    } else {
      bookings = await prisma.booking.findMany({
        where: { user_id: authUser.id },
        orderBy: { created_at: "desc" },
        include: {
          room: { select: { id: true, title: true, room_type: true, images: true } },
        },
      });
    }

    return NextResponse.json({ bookings });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: errorStatus(error) });
  }
}

export async function POST(request) {
  try {
    const authUser = await requireAuth();
    const data = await request.json();

    const roomId = parseInt(data.room_id, 10);
    const checkIn = String(data.check_in || "").slice(0, 10);
    const checkOut = String(data.check_out || "").slice(0, 10);

    if (!Number.isFinite(roomId) || !isValidDateOnly(checkIn) || !isValidDateOnly(checkOut) || checkOut <= checkIn) {
      return NextResponse.json({ error: "Invalid booking dates" }, { status: 400 });
    }

    const availability = await isRoomAvailableForDates(roomId, checkIn, checkOut);
    if (!availability.available) {
      const messages = {
        booked: "This room is not available for the selected dates",
        blocked: "These dates are blocked for this room",
        unavailable: "Room is not available",
        not_found: "Room not found",
      };
      return NextResponse.json(
        { error: messages[availability.reason] || "Room not available" },
        { status: 400 }
      );
    }

    const room = availability.room;
    const taxRate = await getTaxRate();
    const pricing = calculatePricing(room, checkIn, checkOut, taxRate);

    const adults = clampInt(data.adults, 1, 12, 1);
    const children = clampInt(data.children, 0, 8, 0);
    const guests = clampInt(data.guests, 1, 20, adults + children);
    const guestName = sanitizeText(data.guest_name || authUser.name || "", { maxLength: 120 });
    const guestEmail = sanitizeEmail(data.guest_email || authUser.email || "");
    const guestPhone = sanitizePhone(data.guest_phone || "");
    const guestCountry = sanitizeText(data.guest_country || "", { maxLength: 60 });
    const specialRequests = sanitizeText(data.special_requests || "", { maxLength: 1000 });

    if (!guestName || !guestEmail) {
      return NextResponse.json({ error: "Guest name and email are required" }, { status: 400 });
    }

    const bookingId = "BKG-" + uuidv4().slice(0, 8).toUpperCase();
    const booking = await prisma.booking.create({
      data: {
        booking_id: bookingId,
        user_id: authUser.id,
        room_id: roomId,
        check_in: checkIn,
        check_out: checkOut,
        total_amount: pricing.total,
        subtotal_amount: pricing.subtotal,
        tax_amount: pricing.taxAmount,
        status: "pending",
        payment_status: "unpaid",
        guests,
        adults,
        children,
        rooms_count: clampInt(data.rooms_count, 1, 6, 1),
        guest_name: guestName,
        guest_email: guestEmail,
        guest_phone: guestPhone,
        guest_country: guestCountry,
        special_requests: specialRequests,
        payment_method: data.payment_method === "mobile_money" ? "mobile_money" : "",
      },
      include: {
        room: { select: { title: true } },
        user: { select: { name: true, email: true } },
      },
    });

    await reserveRoom(room.id);

    const guestEmail = booking.guest_email || booking.user?.email;
    const guestName = booking.guest_name || booking.user?.name;

    await sendBookingReceivedEmail({
      to: guestEmail,
      customerName: guestName,
      orderId: booking.booking_id,
      roomTitle: booking.room?.title,
      checkIn: booking.check_in,
      checkOut: booking.check_out,
      amount: booking.total_amount,
      payLater: !data.payment_method || data.pay_later,
    });

    const adminEmail =
      process.env.SUPPORT_EMAIL ||
      process.env.EMAIL_FROM ||
      (await prisma.setting.findUnique({ where: { key: "contact_email" } }))?.value;

    if (adminEmail) {
      await sendNewBookingAdminEmail({
        to: adminEmail,
        customerName: guestName,
        customerEmail: guestEmail,
        customerPhone: booking.guest_phone,
        orderId: booking.booking_id,
        roomTitle: booking.room?.title,
        checkIn: booking.check_in,
        checkOut: booking.check_out,
        amount: booking.total_amount,
        guests: booking.guests,
      });
    }

    return NextResponse.json({ booking }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: errorStatus(error) });
  }
}

export async function PUT(request) {
  try {
    await requireAdmin();
    const data = await request.json();

    const existing = await prisma.booking.findUnique({ where: { id: parseInt(data.id, 10) } });
    if (!existing) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const updateData = {};
    if (data.status != null && data.status !== "") updateData.status = data.status;
    if (data.payment_status != null && data.payment_status !== "")
      updateData.payment_status = data.payment_status;
    if (data.payment_method != null) updateData.payment_method = data.payment_method;
    if (data.payment_details != null) updateData.payment_details = data.payment_details;

    if (data.action === "check_in") {
      updateData.status = "checked_in";
      updateData.checked_in_at = new Date();
    }
    if (data.action === "check_out") {
      updateData.status = "completed";
      updateData.checked_out_at = new Date();
    }
    if (data.action === "reject") {
      updateData.status = "cancelled";
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const booking = await prisma.booking.update({
      where: { id: parseInt(data.id, 10) },
      data: updateData,
    });

    const nextStatus = updateData.status || existing.status;
    const nextPayment = updateData.payment_status || existing.payment_status;

    if (nextStatus === "cancelled" || nextStatus === "completed") {
      await prisma.room.update({
        where: { id: existing.room_id },
        data: { status: "available" },
      });
    }

    if (nextPayment === "paid" && (nextStatus === "confirmed" || nextStatus === "pending")) {
      await prisma.room.update({
        where: { id: existing.room_id },
        data: { status: "booked" },
      });
    }

    if (nextStatus === "checked_in") {
      await prisma.room.update({
        where: { id: existing.room_id },
        data: { status: "booked" },
      });
    }

    const becameConfirmed =
      updateData.status === "confirmed" && existing.status !== "confirmed";
    const becamePaid =
      updateData.payment_status === "paid" && existing.payment_status !== "paid";
    const becameCancelled =
      updateData.status === "cancelled" && existing.status !== "cancelled";
    const paymentIsPaid = nextPayment === "paid";

    const full = await getBookingForInvoice(existing.id);
    const emailTo = full?.guest_email || full?.user?.email;
    const emailName = full?.guest_name || full?.user?.name;

    if (becamePaid && !becameConfirmed && emailTo) {
      const pdfAttachment = await createInvoiceAttachment(full);
      await sendPaymentSuccessEmail({
        to: emailTo,
        customerName: emailName,
        orderId: full.booking_id,
        amount: full.total_amount,
        orderStatus: "awaiting approval",
        roomTitle: full.room?.title,
        checkIn: full.check_in,
        checkOut: full.check_out,
        pdfAttachment,
      });
    }

    if (becameConfirmed && paymentIsPaid && emailTo) {
      const pdfAttachment = await createInvoiceAttachment(full);
      await sendBookingApprovedEmail({
        to: emailTo,
        customerName: emailName,
        orderId: full.booking_id,
        roomTitle: full.room?.title,
        checkIn: full.check_in,
        checkOut: full.check_out,
        amount: full.total_amount,
        pdfAttachment,
      });
    }

    if (becameCancelled && emailTo) {
      await sendBookingRejectedEmail({
        to: emailTo,
        customerName: emailName,
        orderId: full.booking_id,
        roomTitle: full.room?.title,
      });
    }

    return NextResponse.json({ booking });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: errorStatus(error) });
  }
}
