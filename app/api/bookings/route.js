import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth, requireAdmin } from "@/lib/auth";
import { getBookableRoom, reserveRoom } from "@/lib/roomAvailability";
import { sendBookingApprovedEmail, sendPaymentSuccessEmail } from "@/lib/email";
import { createInvoiceAttachment, getBookingForInvoice } from "@/lib/invoiceService";
import { v4 as uuidv4 } from "uuid";

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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const authUser = await requireAuth();
    const data = await request.json();
    
    const availability = await getBookableRoom(parseInt(data.room_id));
    if (availability.error) {
      return NextResponse.json({ error: availability.error }, { status: availability.status });
    }
    const room = availability.room;
    const checkIn = new Date(data.check_in);
    const checkOut = new Date(data.check_out);
    if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime()) || checkOut <= checkIn) {
      return NextResponse.json({ error: "Invalid booking dates" }, { status: 400 });
    }

    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    const totalAmount = nights * room.price_daily;

    const bookingId = "BKG-" + uuidv4().slice(0, 8).toUpperCase();
    const booking = await prisma.booking.create({
      data: {
        booking_id: bookingId,
        user_id: authUser.id,
        room_id: parseInt(data.room_id),
        check_in: data.check_in,
        check_out: data.check_out,
        total_amount: totalAmount,
        status: "pending",
        payment_status: "unpaid",
        guests: data.guests || 1,
        special_requests: data.special_requests || "",
        payment_method: data.payment_method === "mobile_money" ? "mobile_money" : "",
      },
    });

    await reserveRoom(room.id);

    return NextResponse.json({ booking }, { status: 201 });  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await requireAdmin();
    const data = await request.json();

    const existing = await prisma.booking.findUnique({ where: { id: parseInt(data.id) } });
    if (!existing) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const updateData = {};
    if (data.status != null && data.status !== "") {
      updateData.status = data.status;
    }
    if (data.payment_status != null && data.payment_status !== "") {
      updateData.payment_status = data.payment_status;
    }
    if (data.payment_method != null) {
      updateData.payment_method = data.payment_method;
    }
    if (data.payment_details != null) {
      updateData.payment_details = data.payment_details;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const booking = await prisma.booking.update({
      where: { id: parseInt(data.id) },
      data: updateData,
    });

    const nextStatus = updateData.status || existing.status;
    const nextPayment = updateData.payment_status || existing.payment_status;

    // Cancelled or completed stays free the room for new bookings
    if (nextStatus === "cancelled" || nextStatus === "completed") {
      await prisma.room.update({
        where: { id: existing.room_id },
        data: { status: "available" },
      });
    }

    // Paid + confirmed/pending keeps room booked
    if (nextPayment === "paid" && (nextStatus === "confirmed" || nextStatus === "pending")) {
      await prisma.room.update({
        where: { id: existing.room_id },
        data: { status: "booked" },
      });
    }

    // When admin confirms a paid booking → email APPROVED invoice PDF
    const becameConfirmed =
      updateData.status === "confirmed" && existing.status !== "confirmed";
    const becamePaid =
      updateData.payment_status === "paid" && existing.payment_status !== "paid";
    const paymentIsPaid = nextPayment === "paid";

    if (becamePaid && !becameConfirmed) {
      const full = await getBookingForInvoice(existing.id);
      if (full?.user?.email) {
        const pdfAttachment = await createInvoiceAttachment(full);
        await sendPaymentSuccessEmail({
          to: full.user.email,
          customerName: full.user.name,
          orderId: full.booking_id,
          amount: full.total_amount,
          orderStatus: "awaiting approval",
          roomTitle: full.room?.title,
          checkIn: full.check_in,
          checkOut: full.check_out,
          pdfAttachment,
        });
      }
    }

    if (becameConfirmed && paymentIsPaid) {
      const full = await getBookingForInvoice(existing.id);
      if (full?.user?.email) {
        const pdfAttachment = await createInvoiceAttachment(full);
        await sendBookingApprovedEmail({
          to: full.user.email,
          customerName: full.user.name,
          orderId: full.booking_id,
          roomTitle: full.room?.title,
          checkIn: full.check_in,
          checkOut: full.check_out,
          amount: full.total_amount,
          pdfAttachment,
        });
      }
    }

    return NextResponse.json({ booking });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}