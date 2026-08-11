import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuth, requireAdmin } from "@/lib/auth";
import { isRoomBookable, releaseStaleRoomReservation } from "@/lib/roomAvailability";
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
    const room = await releaseStaleRoomReservation(roomId);
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const auth = await getAuth();
    const isAdmin = auth?.role === "admin";
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
    const existing = await prisma.room.findUnique({ where: { id: roomId } });
    if (!existing) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }
    await prisma.room.delete({ where: { id: roomId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: errorStatus(error) });
  }
}
