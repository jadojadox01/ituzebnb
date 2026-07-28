import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";
import { DEFAULT_SITE_NAME } from "@/lib/siteDefaults";

function formatRwf(amount) {
  return `RWF ${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(amount || 0)}`;
}

function watermarkLabels({ paymentStatus, bookingStatus }) {
  const paid = String(paymentStatus || "").toLowerCase() === "paid";
  const status = String(bookingStatus || "").toLowerCase();

  if (!paid) {
    return {
      primary: String(paymentStatus || "UNPAID").toUpperCase(),
      secondary: status === "cancelled" ? "CANCELLED" : "PAYMENT REQUIRED",
    };
  }

  if (status === "completed") {
    return { primary: "PAID", secondary: "COMPLETED" };
  }

  if (status === "confirmed") {
    return { primary: "PAID", secondary: "APPROVED" };
  }

  if (status === "cancelled") {
    return { primary: "PAID", secondary: "CANCELLED" };
  }

  // Paid but not yet confirmed by admin
  return { primary: "PAID", secondary: "AWAITING APPROVAL" };
}

const PAGE_WIDTH = 595.28; // A4
const PAGE_HEIGHT = 841.89;

function drawText(page, text, x, yFromTop, options) {
  page.drawText(String(text ?? ""), {
    x,
    y: PAGE_HEIGHT - yFromTop,
    ...options,
  });
}

function drawWatermark(page, text, yFromTop, font) {
  page.drawText(text, {
    x: 90,
    y: PAGE_HEIGHT - yFromTop,
    size: 46,
    font,
    color: rgb(0.06, 0.22, 0.18),
    rotate: degrees(-32),
    opacity: 0.12,
  });
}

/**
 * Build a booking invoice PDF buffer.
 * Watermarks:
 * - Paid + pending  → PAID / AWAITING APPROVAL
 * - Paid + confirmed → PAID / APPROVED
 * - Paid + completed → PAID / COMPLETED
 */
export async function buildBookingInvoicePdf({
  booking,
  siteName = DEFAULT_SITE_NAME,
  supportEmail = "",
  supportPhone = "",
}) {
  const labels = watermarkLabels({
    paymentStatus: booking.payment_status,
    bookingStatus: booking.status,
  });
  const doc = await PDFDocument.create();
  doc.setTitle(`Invoice ${booking.booking_id}`);
  doc.setAuthor(siteName);
  const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  // watermarks
  drawWatermark(page, labels.primary, 350, bold);
  drawWatermark(page, labels.secondary, 500, bold);

  // Header
  drawText(page, siteName, 48, 52, { font: bold, size: 22, color: rgb(0.06, 0.22, 0.18) });
  drawText(page, "Booking Invoice", 48, 76, { font, size: 10, color: rgb(0.35, 0.35, 0.35) });
  drawText(page, `Issued: ${new Date().toLocaleString()}`, 48, 90, {
    font,
    size: 10,
    color: rgb(0.35, 0.35, 0.35),
  });
  drawText(page, `Invoice / Booking ID: ${booking.booking_id}`, 48, 120, {
    font: bold,
    size: 12,
    color: rgb(0.06, 0.22, 0.18),
  });

  drawText(page, `${labels.primary} · ${labels.secondary}`, 48, 146, {
    font: bold,
    size: 11,
    color: rgb(0.03, 0.49, 0.34),
  });

  let y = 185;
  const line = (label, value) => {
    drawText(page, `${label}: ${value || "—"}`, 48, y, { font, size: 11, color: rgb(0.13, 0.13, 0.13) });
    y += 16;
  };

  drawText(page, "Guest details", 48, y, { font: bold, size: 12, color: rgb(0.06, 0.22, 0.18) });
  y += 20;
  line("Name", booking.user?.name);
  line("Email", booking.user?.email);
  line("Phone", booking.user?.phone);
  y += 12;

  drawText(page, "Stay details", 48, y, { font: bold, size: 12, color: rgb(0.06, 0.22, 0.18) });
  y += 20;
  line("Room", booking.room?.title);
  line("Type", booking.room?.room_type);
  line("Check-in", booking.check_in);
  line("Check-out", booking.check_out);
  line("Guests", booking.guests || 1);
  y += 12;

  drawText(page, "Payment summary", 48, y, { font: bold, size: 12, color: rgb(0.06, 0.22, 0.18) });
  y += 20;
  line("Amount", formatRwf(booking.total_amount));
  line("Payment status", booking.payment_status);
  line("Booking status", booking.status);
  line("Method", booking.payment_method);

  y += 8;
  if (labels.secondary === "AWAITING APPROVAL") {
    drawText(
      page,
      "Payment received. Your booking is awaiting admin approval. You will receive an updated invoice once approved.",
      48,
      y,
      { font, size: 9, color: rgb(0.4, 0.4, 0.4), maxWidth: 500 }
    );
  } else if (labels.secondary === "APPROVED") {
    drawText(
      page,
      "Payment received and booking approved by ITUZE B&B. We look forward to welcoming you.",
      48,
      y,
      { font, size: 9, color: rgb(0.4, 0.4, 0.4), maxWidth: 500 }
    );
  } else if (labels.secondary === "COMPLETED") {
    drawText(page, "This stay has been marked completed. Thank you for choosing us.", 48, y, {
      font,
      size: 9,
      color: rgb(0.4, 0.4, 0.4),
      maxWidth: 500,
    });
  }

  const footerParts = [siteName];
  if (supportEmail) footerParts.push(supportEmail);
  if (supportPhone) footerParts.push(supportPhone);
  drawText(page, footerParts.join("  ·  "), 48, 806, {
    font,
    size: 9,
    color: rgb(0.5, 0.5, 0.5),
  });

  const bytes = await doc.save();
  return Buffer.from(bytes);
}

export function invoiceFilename(booking) {
  const status = String(booking.status || "pending").toLowerCase();
  const paid = String(booking.payment_status || "").toLowerCase() === "paid";
  const tag = !paid
    ? "unpaid"
    : status === "confirmed"
      ? "approved"
      : status === "completed"
        ? "completed"
        : "awaiting-approval";
  return `invoice-${booking.booking_id}-${tag}.pdf`;
}
