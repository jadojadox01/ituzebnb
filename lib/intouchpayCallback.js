import { extractCallbackPayload } from "@/lib/intouchpay";

/**
 * IntouchPay requires HTTP 200 and exactly:
 * { "message": "success", "success": true, "request_id": "<requesttransactionid>" }
 */
export function buildIntouchCallbackBody(requestTransactionId) {
  return JSON.stringify({
    message: "success",
    success: true,
    request_id: String(requestTransactionId ?? "").trim(),
  });
}

export function buildIntouchCallbackAck(requestTransactionId) {
  return new Response(buildIntouchCallbackBody(requestTransactionId), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export function resolveCallbackRequestId(payload = {}, raw = {}, fallback = "") {
  return (
    payload.requesttransactionid ||
    payload.requestTransactionId ||
    payload.request_id ||
    raw.requesttransactionid ||
    raw.requestTransactionId ||
    raw.request_id ||
    fallback ||
    ""
  );
}

export async function parseIntouchCallbackRequest(request) {
  const contentType = request.headers.get("content-type") || "";
  const rawText = await request.text();

  if (!rawText.trim()) {
    return { raw: {}, payload: {}, requestTransactionId: "", intouchTransactionId: "" };
  }

  let raw = {};
  try {
    raw = JSON.parse(rawText);
  } catch {
    if (contentType.includes("application/x-www-form-urlencoded") || rawText.includes("=")) {
      const params = new URLSearchParams(rawText);
      const jsonPayloadRaw = params.get("jsonpayload") || params.get("JSONPayload");
      if (jsonPayloadRaw) {
        try {
          raw = { jsonpayload: JSON.parse(jsonPayloadRaw) };
        } catch {
          raw = Object.fromEntries(params);
        }
      } else {
        raw = Object.fromEntries(params);
      }
    } else {
      raw = { _raw: rawText };
    }
  }

  const payload = extractCallbackPayload(raw);
  const requestTransactionId = resolveCallbackRequestId(payload, raw);
  const intouchTransactionId =
    payload.transactionid || payload.transactionId || raw.transactionid || raw.transactionId || "";

  return { raw, payload, requestTransactionId, intouchTransactionId };
}
