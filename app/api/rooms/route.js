import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { seedDatabase } from "@/lib/seed";
import { getAuth, requireAdmin } from "@/lib/auth";
import { isRoomBookable, releaseStaleRoomReservation } from "@/lib/roomAvailability";

export async function GET() {
  try {
    await seedDatabase();
    const auth = await getAuth();
    const isAdmin = auth?.role === "admin";

    const rooms = await prisma.room.findMany({ orderBy: { created_at: "desc" } });
    const refreshed = await Promise.all(
      rooms.map((room) => releaseStaleRoomReservation(room.id))
    );

    const visible = isAdmin ? refreshed : refreshed.filter((room) => isRoomBookable(room.status));

    return NextResponse.json({ rooms: visible });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await requireAdmin();
    const data = await request.json();
    const room = await prisma.room.create({ data });
    return NextResponse.json({ room }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}