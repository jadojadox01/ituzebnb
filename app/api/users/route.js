import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();
    const users = await prisma.user.findMany({
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        created_at: true,
        _count: { select: { bookings: true } },
      },
    });
    return NextResponse.json({ users });
  } catch (error) {
    const status = error.message.includes("Forbidden") ? 403 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

export async function POST(request) {
  try {
    await requireAdmin();
    const { name, email, phone, password, role } = await request.json();

    if (!name?.trim() || !email?.trim() || !password?.trim()) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: "Email already in use" }, { status: 400 });
    }

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || "",
        password: bcrypt.hashSync(password, 10),
        role: role === "admin" ? "admin" : "client",
      },
      select: { id: true, name: true, email: true, phone: true, role: true, created_at: true },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    const status = error.message.includes("Forbidden") ? 403 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
