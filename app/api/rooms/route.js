import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { seedDatabase } from "@/lib/seed";
import { getAuth, requireAdmin } from "@/lib/auth";
import { isRoomBookable, releaseStaleRoomReservation } from "@/lib/roomAvailability";
import { sanitizeRoomData } from "@/lib/sanitizeRoomData";

function errorStatus(error) {
  if (error.message?.includes("Unauthorized")) return 401;
  if (error.message?.includes("Forbidden")) return 403;
  return 500;
}

export async function GET() {
  try {
    await seedDatabase();
    const auth = await getAuth();
    const isAdmin = auth?.role === "admin";

    const rooms = await prisma.room.findMany({ orderBy: { created_at: "desc" } });
    const refreshed = await Promise.all(
      rooms.map((room) => releaseStaleRoomReservation(room.id))
    );

    const visible = isAdmin
      ? refreshed.filter(Boolean)
      : refreshed.filter((room) => room && isRoomBookable(room.status));

    return NextResponse.json({ rooms: visible });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: errorStatus(error) });
  }
}

export async function POST(request) {
  try {
    await requireAdmin();
    const raw = await request.json();
    const data = sanitizeRoomData(raw);

    if (!data.title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const room = await prisma.room.create({ data });
    return NextResponse.json({ room }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: errorStatus(error) });
  }
}
