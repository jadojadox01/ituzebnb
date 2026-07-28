import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import {
  generateRequestTransactionId,
  generateTimestamp,
  getRequestDepositUrl,
  requestDeposit,
} from "@/lib/intouchpay";
import { logIntouchFailure } from "@/lib/logger";

export async function POST(request) {
  try {
    await requireAdmin();
    const body = await request.json();

    const amount = body.amount ?? 500;
    const mobilephone = body.mobilephone || body.phone || "0786328597";
    const requesttransactionid = body.requesttransactionid
      ? `${String(body.requesttransactionid).replace(/[^A-Za-z0-9]/g, "").slice(0, 34)}${generateTimestamp().slice(-6)}`
      : generateRequestTransactionId("DEP");

    const intouch = await requestDeposit({
      amount,
      mobilephone,
      requesttransactionid,
      reason: body.reason || "",
      withdrawcharge: body.withdrawcharge ?? 0,
      sid: body.sid ?? 1,
    });

    return NextResponse.json({
      ok: true,
      apiUrl: getRequestDepositUrl(),
      requesttransactionid,
      intouch,
    });
  } catch (error) {
    logIntouchFailure({
      endpoint: "/api/payments/intouchpay/deposit",
      error,
    });

    if (error.code === "INTOUCH_NOT_CONFIGURED") {
      return NextResponse.json(
        { ok: false, message: error.message, missing: error.missing },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        ok: false,
        message: error.message,
        intouch: error.intouch || null,
        apiUrl: getRequestDepositUrl(),
      },
      { status: error.status || 500 }
    );
  }
}
