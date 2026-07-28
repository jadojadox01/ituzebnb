import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { verifyPasswordHash } from "@/lib/intouchpay";

export async function POST(request) {
  try {
    await requireAdmin();
    const { timestamp, expectedHash } = await request.json();

    if (!timestamp || !expectedHash) {
      return NextResponse.json(
        { error: "Timestamp and expected hash are required" },
        { status: 400 }
      );
    }

    const result = await verifyPasswordHash(timestamp, expectedHash);
    return NextResponse.json({
      ...result,
      message: result.matches
        ? `Password hash matches Swagger (${result.matchMode}).`
        : `Hash mismatch. Password length in .env: ${result.passwordLength}. Re-copy password from IntouchPay portal, save .env, restart server.`,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
