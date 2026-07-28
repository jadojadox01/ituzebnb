import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuth, requireAdmin } from "@/lib/auth";
import { isRoomBookable, releaseStaleRoomReservation } from "@/lib/roomAvailability";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const roomId = parseInt(id);
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const data = await request.json();

    const existing = await prisma.room.findUnique({ where: { id: parseInt(id) } });
    if (!existing) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const room = await prisma.room.update({
      where: { id: parseInt(id) },
      data,
    });
    return NextResponse.json({ room });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const existing = await prisma.room.findUnique({ where: { id: parseInt(id) } });
    if (!existing) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }
    await prisma.room.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}