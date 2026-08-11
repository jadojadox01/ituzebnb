import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { seedDatabase } from "@/lib/seed";
import { getAuth, requireAdmin } from "@/lib/auth";
import { isRoomBookable } from "@/lib/roomAvailability";
import { sanitizeRoomData } from "@/lib/sanitizeRoomData";

function errorStatus(error) {
  if (error.message?.includes("Unauthorized")) return 401;
  if (error.message?.includes("Forbidden")) return 403;
  return 500;
}

export async function GET() {
  try {
    // Seed only when inventory is empty (avoid DB work on every public request)
    const roomCount = await prisma.room.count();
    if (roomCount === 0) {
      await seedDatabase();
    }

    const auth = await getAuth();
    const isAdmin = auth?.role === "admin";

    const rooms = await prisma.room.findMany({ orderBy: { created_at: "desc" } });

    // Never mutate room status on list GET — that was wiping admin status changes.
    // Stale "reserved" cleanup happens in getBookableRoom / booking flows only.
    if (isAdmin) {
      return NextResponse.json({ rooms });
    }

    const visible = rooms.filter((room) => isRoomBookable(room.status));
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
