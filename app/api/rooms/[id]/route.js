import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuth, requireAdmin } from "@/lib/auth";
import { isRoomBookable } from "@/lib/roomAvailability";
import { sanitizeRoomData } from "@/lib/sanitizeRoomData";

function errorStatus(error) {
  if (error.message?.includes("Unauthorized")) return 401;
  if (error.message?.includes("Forbidden")) return 403;
  return 500;
}

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const roomId = parseInt(id, 10);
    const auth = await getAuth();
    const isAdmin = auth?.role === "admin";

    // Do not mutate status on GET — admin edits must stick.
    const room = await prisma.room.findUnique({ where: { id: roomId } });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    if (!isAdmin && !isRoomBookable(room.status)) {
      const hasBookingForRoom = auth
        ? await prisma.booking.findFirst({
            where: {
              user_id: auth.id,
              room_id: roomId,
              status: { notIn: ["cancelled"] },
            },
            select: { id: true },
          })
        : null;

      if (hasBookingForRoom) {
        return NextResponse.json({ room });
      }

      return NextResponse.json({ error: "Room is not available" }, { status: 404 });
    }

    return NextResponse.json({ room });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: errorStatus(error) });
  }
}

export async function PUT(request, { params }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const raw = await request.json();
    const data = sanitizeRoomData(raw);

    if (!data.title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const roomId = parseInt(id, 10);
    if (!Number.isFinite(roomId)) {
      return NextResponse.json({ error: "Invalid room id" }, { status: 400 });
    }

    const existing = await prisma.room.findUnique({ where: { id: roomId } });
    if (!existing) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const room = await prisma.room.update({
      where: { id: roomId },
      data,
    });
    return NextResponse.json({ room });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: errorStatus(error) });
  }
}

export async function DELETE(request, { params }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const roomId = parseInt(id, 10);
    if (!Number.isFinite(roomId)) {
      return NextResponse.json({ error: "Invalid room id" }, { status: 400 });
    }

    const existing = await prisma.room.findUnique({
      where: { id: roomId },
      include: { _count: { select: { bookings: true } } },
    });
    if (!existing) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const force = searchParams.get("force") === "1";
    const bookingCount = existing._count.bookings;

    if (bookingCount > 0 && !force) {
      return NextResponse.json(
        {
          error: `This room has ${bookingCount} booking(s). Confirm force delete to remove the room and its bookings.`,
          bookingCount,
          requiresForce: true,
        },
        { status: 409 }
      );
    }

    await prisma.$transaction(async (tx) => {
      if (bookingCount > 0) {
        await tx.booking.deleteMany({ where: { room_id: roomId } });
      }
      await tx.room.delete({ where: { id: roomId } });
    });

    return NextResponse.json({ success: true, deletedBookings: bookingCount });
  } catch (error) {
    const message = String(error?.message || "Could not delete room");
    if (/Foreign key constraint|P2003/i.test(message)) {
      return NextResponse.json(
        {
          error: "Could not delete room because related records still reference it. Try force delete.",
          requiresForce: true,
        },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: message }, { status: errorStatus(error) });
  }
}
