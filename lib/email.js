import { getAppUrl, getOrderTrackingUrl } from "@/lib/appUrl";
import { DEFAULT_SITE_NAME } from "@/lib/siteDefaults";
import { logInfo, logError } from "@/lib/logger";

function companyName() {
  return process.env.EMAIL_FROM_NAME || DEFAULT_SITE_NAME;
}

function supportEmail() {
  return process.env.SUPPORT_EMAIL || process.env.EMAIL_FROM || "support@example.com";
}

function fromAddress() {
  try {
    return process.env.EMAIL_FROM || `noreply@${new URL(getAppUrl()).hostname}`;
  } catch {
    return process.env.EMAIL_FROM || "noreply@ituzebnb.com";
  }
}

function baseTemplate({ title, bodyHtml }) {
  return `<!DOCTYPE html>
<html><body style="font-family:Arial,sans-serif;line-height:1.6;color:#111;">
  <div style="max-width:560px;margin:0 auto;padding:24px;">
    <h1 style="font-size:20px;">${companyName()}</h1>
    <h2 style="font-size:18px;">${title}</h2>
    ${bodyHtml}
    <p style="margin-top:24px;font-size:13px;color:#666;">
      Need help? Contact us at <a href="mailto:${supportEmail()}">${supportEmail()}</a>
    </p>
  </div>
</body></html>`;
}

async function deliverEmail({ to, subject, html, attachments = [] }) {
  if (!to) return { ok: false, skipped: true, reason: "missing_recipient" };

  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    const payload = {
      from: `${companyName()} <${fromAddress()}>`,
      to: [to],
      subject,
      html,
    };

    if (attachments.length > 0) {
      payload.attachments = attachments.map((file) => ({
        filename: file.filename,
        content: Buffer.isBuffer(file.content)
          ? file.content.toString("base64")
          : Buffer.from(file.content).toString("base64"),
      }));
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Resend error: ${text}`);
    }
    return { ok: true, provider: "resend" };
  }

  if (process.env.SMTP_HOST) {
    logInfo("email.smtp.skipped", {
      message: "SMTP_HOST is set but nodemailer is not installed. Use RESEND_API_KEY or install nodemailer.",
      to,
      subject,
    });
    return { ok: false, skipped: true, reason: "smtp_not_implemented" };
  }

  logInfo("email.dev.skipped", { to, subject, attachments: attachments.map((a) => a.filename) });
  return { ok: false, skipped: true, reason: "email_not_configured" };
}

export async function sendPaymentSuccessEmail({
  to,
  customerName,
  orderId,
  amount,
  paymentMethod = "Mobile Money",
  transactionId,
  orderStatus = "awaiting approval",
  roomTitle = "",
  checkIn = "",
  checkOut = "",
  pdfAttachment = null,
}) {
  const html = baseTemplate({
    title: "Payment confirmed",
    bodyHtml: `
      <p>Hello ${customerName || "Guest"},</p>
      <p>Your payment was successful. ${
        orderStatus === "awaiting approval"
          ? "Your booking is <strong>awaiting admin approval</strong>."
          : `Booking status: <strong>${orderStatus}</strong>.`
      }</p>
      <ul>
        <li><strong>Order:</strong> ${orderId}</li>
        <li><strong>Room:</strong> ${roomTitle || "—"}</li>
        <li><strong>Check-in:</strong> ${checkIn || "—"}</li>
        <li><strong>Check-out:</strong> ${checkOut || "—"}</li>
        <li><strong>Amount:</strong> RWF ${Number(amount).toLocaleString()}</li>
        <li><strong>Method:</strong> ${paymentMethod}</li>
        <li><strong>Transaction ID:</strong> ${transactionId || "—"}</li>
        <li><strong>Status:</strong> Paid · ${orderStatus}</li>
      </ul>
      <p>Your invoice PDF is attached${
        orderStatus === "awaiting approval"
          ? " (watermark: <strong>PAID / AWAITING APPROVAL</strong>)"
          : ""
      }.</p>
      <p><a href="${getOrderTrackingUrl(orderId)}">View your booking</a></p>
    `,
  });

  try {
    return await deliverEmail({
      to,
      subject: `${companyName()} — Payment confirmed (${orderId})`,
      html,
      attachments: pdfAttachment ? [pdfAttachment] : [],
    });
  } catch (error) {
    logError("email.payment_success.failed", error, { orderId });
    return { ok: false, error: error.message };
  }
}

export async function sendBookingApprovedEmail({
  to,
  customerName,
  orderId,
  roomTitle,
  checkIn,
  checkOut,
  amount,
  pdfAttachment = null,
}) {
  const html = baseTemplate({
    title: "Booking approved",
    bodyHtml: `
      <p>Hello ${customerName || "Guest"},</p>
      <p>Great news — your booking has been <strong>approved</strong>.</p>
      <ul>
        <li><strong>Order:</strong> ${orderId}</li>
        <li><strong>Room:</strong> ${roomTitle || "—"}</li>
        <li><strong>Check-in:</strong> ${checkIn}</li>
        <li><strong>Check-out:</strong> ${checkOut}</li>
        <li><strong>Total:</strong> RWF ${Number(amount).toLocaleString()}</li>
        <li><strong>Status:</strong> Paid · Approved</li>
      </ul>
      <p>Your updated invoice PDF is attached (watermark: <strong>PAID / APPROVED</strong>).</p>
      <p><a href="${getOrderTrackingUrl(orderId)}">View your booking</a></p>
    `,
  });

  try {
    return await deliverEmail({
      to,
      subject: `${companyName()} — Booking approved (${orderId})`,
      html,
      attachments: pdfAttachment ? [pdfAttachment] : [],
    });
  } catch (error) {
    logError("email.booking_approved.failed", error, { orderId });
    return { ok: false, error: error.message };
  }
}

export async function sendContactMessageAdminEmail({
  to,
  name,
  email,
  phone,
  message,
  messageId,
}) {
  if (!to) return { ok: false, skipped: true, reason: "missing_admin_email" };

  const html = baseTemplate({
    title: "New contact message",
    bodyHtml: `
      <p>A guest sent a message from the contact form.</p>
      <ul>
        <li><strong>Name:</strong> ${name}</li>
        <li><strong>Email:</strong> ${email}</li>
        <li><strong>Phone:</strong> ${phone || "—"}</li>
        <li><strong>Message ID:</strong> ${messageId}</li>
      </ul>
      <p style="white-space:pre-wrap;background:#f5f5f5;padding:12px;border-radius:8px;">${message}</p>
      <p><a href="${getAppUrl()}/admin/messages">Open messages in admin</a></p>
    `,
  });

  try {
    return await deliverEmail({
      to,
      subject: `${companyName()} — New contact message from ${name}`,
      html,
    });
  } catch (error) {
    logError("email.contact_admin.failed", error, { messageId });
    return { ok: false, error: error.message };
  }
}

export async function sendPaymentFailedEmail({ to, customerName, orderId, amount, reason }) {
  const html = baseTemplate({
    title: "Payment failed",
    bodyHtml: `
      <p>Hello ${customerName || "Guest"},</p>
      <p>We could not complete your Mobile Money payment for order <strong>${orderId}</strong>.</p>
      <p><strong>Amount:</strong> RWF ${Number(amount).toLocaleString()}</p>
      <p><strong>Reason:</strong> ${reason || "Payment was declined or timed out."}</p>
      <p><a href="${getOrderTrackingUrl(orderId)}">Try again from your bookings page</a></p>
    `,
  });

  try {
    return await deliverEmail({ to, subject: `${companyName()} — Payment failed (${orderId})`, html });
  } catch (error) {
    logError("email.payment_failed.failed", error, { orderId });
    return { ok: false, error: error.message };
  }
}

export async function sendOrderConfirmationEmail({
  to,
  customerName,
  orderId,
  roomTitle,
  checkIn,
  checkOut,
  amount,
}) {
  const html = baseTemplate({
    title: "Booking received",
    bodyHtml: `
      <p>Hello ${customerName || "Guest"},</p>
      <p>We received your booking request.</p>
      <ul>
        <li><strong>Order:</strong> ${orderId}</li>
        <li><strong>Room:</strong> ${roomTitle || "—"}</li>
        <li><strong>Check-in:</strong> ${checkIn}</li>
        <li><strong>Check-out:</strong> ${checkOut}</li>
        <li><strong>Total:</strong> RWF ${Number(amount).toLocaleString()}</li>
      </ul>
      <p><a href="${getOrderTrackingUrl(orderId)}">Track your booking</a></p>
    `,
  });

  try {
    return await deliverEmail({ to, subject: `${companyName()} — Booking ${orderId}`, html });
  } catch (error) {
    logError("email.order_confirmation.failed", error, { orderId });
    return { ok: false, error: error.message };
  }
}
