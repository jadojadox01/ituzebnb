import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getAuth, requireAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const authUser = await getAuth();
    if (!authUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { id: true, name: true, email: true, phone: true, role: true, created_at: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const auth = await requireAuth();
    const { name, phone, password, currentPassword } = await request.json();

    const user = await prisma.user.findUnique({ where: { id: auth.id } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const data = {};
    if (name !== undefined) data.name = String(name).trim();
    if (phone !== undefined) data.phone = String(phone).trim();

    if (password?.trim()) {
      if (!currentPassword) {
        return NextResponse.json({ error: "Current password is required" }, { status: 400 });
      }
      const valid = bcrypt.compareSync(currentPassword, user.password);
      if (!valid) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
      }
      data.password = bcrypt.hashSync(password.trim(), 10);
    }

    const updated = await prisma.user.update({
      where: { id: auth.id },
      data,
      select: { id: true, name: true, email: true, phone: true, role: true, created_at: true },
    });

    return NextResponse.json({ user: updated });
  } catch (error) {
    const status = error.message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}