import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function PUT(request, { params }) {
  try {
    await requireAdmin();
    const id = parseInt(params.id, 10);
    const { name, email, phone, role, password } = await request.json();

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (email && email.trim().toLowerCase() !== user.email) {
      const taken = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
      if (taken) {
        return NextResponse.json({ error: "Email already in use" }, { status: 400 });
      }
    }

    const data = {
      ...(name !== undefined ? { name: name.trim() } : {}),
      ...(email !== undefined ? { email: email.trim().toLowerCase() } : {}),
      ...(phone !== undefined ? { phone: phone.trim() } : {}),
      ...(role !== undefined ? { role: role === "admin" ? "admin" : "client" } : {}),
    };

    if (password?.trim()) {
      data.password = bcrypt.hashSync(password.trim(), 10);
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, phone: true, role: true, created_at: true },
    });

    return NextResponse.json({ user: updated });
  } catch (error) {
    const status = error.message.includes("Forbidden") ? 403 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

export async function DELETE(_request, { params }) {
  try {
    const auth = await requireAdmin();
    const id = parseInt(params.id, 10);

    if (auth.id === id) {
      return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
    }

    const bookings = await prisma.booking.count({ where: { user_id: id } });
    if (bookings > 0) {
      return NextResponse.json(
        { error: "Cannot delete a user who has bookings. Change their role or deactivate instead." },
        { status: 400 }
      );
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    const status = error.message.includes("Forbidden") ? 403 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
