import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { sendContactMessageAdminEmail } from "@/lib/email";
import { logError } from "@/lib/logger";
import { getClientIp, rateLimit } from "@/lib/rateLimit";
import { sanitizeEmail, sanitizePhone, sanitizeText } from "@/lib/sanitizeInput";

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

    const body = await request.json();
    const name = sanitizeText(body.name, { maxLength: 120 });
    const email = sanitizeEmail(body.email);
    const phone = sanitizePhone(body.phone);
    const message = sanitizeText(body.message, { maxLength: 2000 });

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required." },
        { status: 400 }
      );
    }

    const contactMessage = await prisma.contactMessage.create({
      data: {
        name,
        email,
        phone,
        message,
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
