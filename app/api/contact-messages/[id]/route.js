import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function PATCH(request, { params }) {
  try {
    await requireAdmin();
    const { id: rawId } = await params;
    const id = parseInt(rawId, 10);
    const { status } = await request.json();

    if (!["new", "read", "archived"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const message = await prisma.contactMessage.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ message });
  } catch (error) {
    const status =
      error.message.includes("Forbidden") || error.message.includes("Unauthorized")
        ? 403
        : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

export async function DELETE(_request, { params }) {
  try {
    await requireAdmin();
    const { id: rawId } = await params;
    const id = parseInt(rawId, 10);
    await prisma.contactMessage.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    const status =
      error.message.includes("Forbidden") || error.message.includes("Unauthorized")
        ? 403
        : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
