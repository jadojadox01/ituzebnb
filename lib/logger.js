import { maskPayload } from "@/lib/mask";

let sentryReady = false;

async function captureSentry(error, context = {}) {
  const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  try {
    if (!sentryReady) {
      const Sentry = await import("@sentry/nextjs");
      if (!Sentry.isInitialized?.()) {
        Sentry.init({ dsn, tracesSampleRate: 0.1 });
      }
      sentryReady = true;
    }
    const Sentry = await import("@sentry/nextjs");
    Sentry.captureException(error, { extra: context });
  } catch {
    // Sentry optional — do not break payment flow
  }
}

function baseLog(level, message, meta = {}) {
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...meta,
  };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else console.info(line);
  return entry;
}

export function logInfo(message, meta = {}) {
  return baseLog("info", message, meta);
}

export function logError(message, error, meta = {}) {
  const entry = baseLog("error", message, {
    ...meta,
    error: error?.message || String(error),
    stack: error?.stack,
  });
  if (error) captureSentry(error, meta);
  return entry;
}

export function logPaymentEvent(event, meta = {}) {
  return baseLog("payment", event, {
    ...maskPayload(meta),
    event,
  });
}

export function logIntouchFailure({ endpoint, error, transactionId, orderId }) {
  return logError(
    "IntouchPay API failure",
    error instanceof Error ? error : new Error(String(error)),
    {
      endpoint,
      transactionId,
      orderId,
      intouch: maskPayload(error?.intouch || null),
    }
  );
}
