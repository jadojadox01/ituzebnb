import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

function errorStatus(error) {
  if (error.message?.includes("Unauthorized")) return 401;
  if (error.message?.includes("Forbidden")) return 403;
  return 500;
}

function sanitizeHeroAd(data = {}) {
  return {
    title: String(data.title || ""),
    subtitle: String(data.subtitle || ""),
    image: String(data.image || ""),
    link: String(data.link || ""),
    active: Number(data.active) === 1 || data.active === true ? 1 : 0,
    sort_order: Number.isFinite(Number(data.sort_order)) ? Number(data.sort_order) : 0,
  };
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get("all") === "1";

    if (all) {
      await requireAdmin();
    }

    const ads = await prisma.heroAd.findMany({
      where: all ? {} : { active: 1 },
      orderBy: { sort_order: "asc" },
    });
    return NextResponse.json({ ads });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: errorStatus(error) });
  }
}

export async function POST(request) {
  try {
    await requireAdmin();
    const raw = await request.json();
    const data = sanitizeHeroAd(raw);
    if (!data.image) {
      return NextResponse.json({ error: "Hero image is required" }, { status: 400 });
    }
    const ad = await prisma.heroAd.create({ data });
    return NextResponse.json({ ad }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: errorStatus(error) });
  }
}

export async function PUT(request) {
  try {
    await requireAdmin();
    const raw = await request.json();
    const id = parseInt(raw.id, 10);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "Invalid slide id" }, { status: 400 });
    }
    const data = sanitizeHeroAd(raw);
    if (!data.image) {
      return NextResponse.json({ error: "Hero image is required" }, { status: 400 });
    }
    const ad = await prisma.heroAd.update({
      where: { id },
      data,
    });
    return NextResponse.json({ ad });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: errorStatus(error) });
  }
}

export async function DELETE(request) {
  try {
    await requireAdmin();
    const { id } = await request.json();
    await prisma.heroAd.delete({ where: { id: parseInt(id, 10) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: errorStatus(error) });
  }
}
