import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { testConnection } from "@/lib/intouchpay";

export async function POST() {
  try {
    await requireAdmin();
    const result = await testConnection();
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (error) {
    if (error.code === "INTOUCH_NOT_CONFIGURED") {
      return NextResponse.json(
        { ok: false, message: error.message, missing: error.missing },
        { status: 503 }
      );
    }
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }
}
