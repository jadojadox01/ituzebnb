import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();
    const blocked = await prisma.blockedDate.findMany({
      orderBy: { start_date: "desc" },
      include: { room: { select: { id: true, title: true } } },
    });
    return NextResponse.json({ blocked_dates: blocked });
  } catch (error) {
    const status = error.message?.includes("Forbidden") ? 403 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

export async function POST(request) {
  try {
    await requireAdmin();
    const data = await request.json();
    const { start_date, end_date, reason = "", room_id = null } = data;

    if (!start_date || !end_date) {
      return NextResponse.json({ error: "start_date and end_date are required" }, { status: 400 });
    }
    if (end_date <= start_date) {
      return NextResponse.json({ error: "end_date must be after start_date" }, { status: 400 });
    }

    const blocked = await prisma.blockedDate.create({
      data: {
        room_id: room_id ? parseInt(room_id, 10) : null,
        start_date,
        end_date,
        reason: String(reason || ""),
      },
      include: { room: { select: { id: true, title: true } } },
    });

    return NextResponse.json({ blocked_date: blocked }, { status: 201 });
  } catch (error) {
    const status = error.message?.includes("Forbidden") ? 403 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

export async function DELETE(request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get("id") || "", 10);
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }
    await prisma.blockedDate.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const status = error.message?.includes("Forbidden") ? 403 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
