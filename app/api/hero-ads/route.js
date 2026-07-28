import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await requireAdmin();
    const data = await request.json();
    const ad = await prisma.heroAd.create({ data });
    return NextResponse.json({ ad }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await requireAdmin();
    const data = await request.json();
    const ad = await prisma.heroAd.update({
      where: { id: parseInt(data.id) },
      data: { title: data.title, subtitle: data.subtitle, image: data.image, link: data.link, active: data.active, sort_order: data.sort_order },
    });
    return NextResponse.json({ ad });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await requireAdmin();
    const { id } = await request.json();
    await prisma.heroAd.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}