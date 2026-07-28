import { NextResponse } from "next/server";

/** Legacy path — forwards to the new IntouchPay request endpoint. */
export async function POST(request) {
  const body = await request.json();
  const origin = new URL(request.url).origin;

  const res = await fetch(`${origin}/api/payment/intouchpay/request`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      cookie: request.headers.get("cookie") || "",
    },
    body: JSON.stringify({
      orderId: body.booking_id,
      amount: body.amount,
      phone: body.mobilephone,
    }),
  });

  const data = await res.json();
  return NextResponse.json(
    {
      ...data,
      payment: data.payment,
      booking_id: data.orderId,
    },
    { status: res.status }
  );
}
