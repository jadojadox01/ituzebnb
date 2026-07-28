import prisma from "@/lib/prisma";
import { buildBookingInvoicePdf, invoiceFilename } from "@/lib/invoicePdf";
import { DEFAULT_SITE_NAME } from "@/lib/siteDefaults";
import { logError } from "@/lib/logger";

async function loadSiteMeta() {
  const rows = await prisma.setting.findMany({
    where: {
      key: { in: ["site_name", "contact_email", "contact_phone"] },
    },
  });
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    siteName: map.site_name || DEFAULT_SITE_NAME,
    supportEmail: map.contact_email || process.env.SUPPORT_EMAIL || "",
    supportPhone: map.contact_phone || "",
  };
}

export async function getBookingForInvoice(bookingIdOrCode) {
  const asInt = parseInt(bookingIdOrCode, 10);
  if (!Number.isNaN(asInt) && String(asInt) === String(bookingIdOrCode)) {
    return prisma.booking.findUnique({
      where: { id: asInt },
      include: {
        user: { select: { name: true, email: true, phone: true } },
        room: { select: { title: true, room_type: true, location: true } },
      },
    });
  }

  return prisma.booking.findUnique({
    where: { booking_id: String(bookingIdOrCode) },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      room: { select: { title: true, room_type: true, location: true } },
    },
  });
}

export async function createInvoicePdfForBooking(booking) {
  const meta = await loadSiteMeta();
  const pdf = await buildBookingInvoicePdf({
    booking,
    siteName: meta.siteName,
    supportEmail: meta.supportEmail,
    supportPhone: meta.supportPhone,
  });
  return {
    filename: invoiceFilename(booking),
    content: pdf,
    contentType: "application/pdf",
  };
}

export async function createInvoiceAttachment(booking) {
  try {
    const file = await createInvoicePdfForBooking(booking);
    return {
      filename: file.filename,
      content: file.content,
    };
  } catch (error) {
    logError("invoice.attachment.failed", error, { bookingId: booking?.booking_id });
    return null;
  }
}
