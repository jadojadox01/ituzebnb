import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { sendContactMessageAdminEmail } from "@/lib/email";
import { logError } from "@/lib/logger";
import { getClientIp, rateLimit } from "@/lib/rateLimit";

export async function GET() {
  try {
    await requireAdmin();
    const messages = await prisma.contactMessage.findMany({
      orderBy: { created_at: "desc" },
    });
    const newCount = messages.filter((m) => m.status === "new").length;
    return NextResponse.json({ messages, newCount });
  } catch (error) {
    const status = error.message.includes("Unauthorized")
      ? 401
      : error.message.includes("Forbidden")
        ? 403
        : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

export async function POST(request) {
  try {
    const ip = getClientIp(request);
    const limited = rateLimit(`contact:${ip}`, { limit: 8, windowMs: 60_000 });
    if (!limited.allowed) {
      return NextResponse.json(
        { error: "Too many messages. Please wait a minute and try again." },
        { status: 429 }
      );
    }

    const { name, email, phone, message } = await request.json();

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: "Name, email, and message are required." },
        { status: 400 }
      );
    }

    const contactMessage = await prisma.contactMessage.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || "",
        message: message.trim(),
        status: "new",
      },
    });

    const adminEmail =
      process.env.SUPPORT_EMAIL ||
      process.env.ADMIN_EMAIL ||
      process.env.EMAIL_FROM ||
      "";

    if (adminEmail) {
      sendContactMessageAdminEmail({
        to: adminEmail,
        name: contactMessage.name,
        email: contactMessage.email,
        phone: contactMessage.phone,
        message: contactMessage.message,
        messageId: contactMessage.id,
      }).catch((error) => logError("contact.admin_email.failed", error));
    }

    return NextResponse.json(
      {
        message: contactMessage,
        ok: true,
        notice: "Message received. Our team can view it in Admin → Messages.",
      },
      { status: 201 }
    );
  } catch (error) {
    logError("contact.create.failed", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
