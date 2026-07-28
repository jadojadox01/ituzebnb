import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { signToken, createSessionCookie } from "@/lib/auth";

export async function POST(request) {
  try {
    const { name, email, password, phone } = await request.json();
    
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, phone: phone || "", role: "client" },
      select: { id: true, name: true, email: true, phone: true, role: true },
    });

    const token = signToken({ id: user.id, name: user.name, email: user.email, role: user.role });
    const response = NextResponse.json({ user }, { status: 201 });
    response.cookies.set(createSessionCookie(token));
    return response;
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}