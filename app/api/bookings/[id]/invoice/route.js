import { NextResponse } from "next/server";
import { getAuth, requireAdmin } from "@/lib/auth";
import {
  createInvoicePdfForBooking,
  getBookingForInvoice,
} from "@/lib/invoiceService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request, { params }) {
  try {
    const auth = await getAuth();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const booking = await getBookingForInvoice(id);
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (auth.role !== "admin" && booking.user_id !== auth.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const file = await createInvoicePdfForBooking(booking);
    return new NextResponse(file.content, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${file.filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/** Admin-only regenerate helper (same as GET). */
export async function POST(request, ctx) {
  await requireAdmin();
  return GET(request, ctx);
}
