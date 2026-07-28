"use client";

import { useEffect, useState } from "react";
import { Loader2, Smartphone } from "lucide-react";
import { useTranslation } from "@/lib/TranslationContext";

/**
 * Reusable IntouchPay Mobile Money payment control.
 * Calls POST /api/payment/intouchpay/request (server-side only — no credentials in browser).
 */
export function IntouchPayPaymentButton({
  orderId,
  amount,
  defaultPhone = "",
  disabled = false,
  onPending,
  onSuccess,
  onError,
  pollStatus = true,
  className = "",
}) {
  const { t } = useTranslation();
  const [phone, setPhone] = useState(defaultPhone);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState("");
  const [requestTransactionId, setRequestTransactionId] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [phase, setPhase] = useState("idle"); // idle | sending | pending | checking | success | error

  useEffect(() => {
    if (defaultPhone) setPhone(defaultPhone);
  }, [defaultPhone]);

  useEffect(() => {
    if (!pollStatus || !requestTransactionId || loading) return undefined;

    let attempts = 0;
    const interval = setInterval(async () => {
      attempts += 1;
      if (attempts > 18) {
        clearInterval(interval);
        return;
      }

      setChecking(true);
      try {
        const res = await fetch("/api/payment/intouchpay/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requestTransactionId,
            transactionId,
          }),
        });
        const data = await res.json();
        if (!res.ok) return;

        const status = String(data.transaction?.status || data.intouch?.status || "").toUpperCase();
        const responseCode = String(data.intouch?.responsecode || data.intouch?.responseCode || "");
        if (
          status === "SUCCESS" ||
          status === "SUCCESSFUL" ||
          responseCode === "01"
        ) {
          clearInterval(interval);
          setMessage(t("paymentConfirmed"));
          setPhase("success");
          onSuccess?.(data);
        } else if (status === "FAILED" || status === "Failed") {
          clearInterval(interval);
          setMessage(data.error || t("paymentFailed"));
          setPhase("error");
          onError?.(data);
        }
      } catch {
        // keep polling
      } finally {
        setChecking(false);
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [pollStatus, requestTransactionId, transactionId, loading, onSuccess, onError, t]);

  const handlePay = async () => {
    if (!phone.trim()) {
      setMessage(t("enterMomoNumber"));
      setPhase("error");
      onError?.({ error: t("enterMomoNumber") });
      return;
    }

    setLoading(true);
    setMessage("");
    setPhase("sending");
    try {
      const res = await fetch("/api/payment/intouchpay/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          amount,
          phone: phone.trim(),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        const errMsg = data.error || t("paymentRequestFailed");
        setMessage(errMsg);
        setPhase("error");
        onError?.(data);
        return;
      }

      const pendingMsg = data.message || t("paymentWaitingConfirmation");
      setMessage(pendingMsg);
      setRequestTransactionId(data.transaction?.request_transaction_id || "");
      setTransactionId(data.transaction?.intouch_transaction_id || data.payment?.transactionid || "");
      setPhase("pending");
      onPending?.(data);
    } catch {
      setMessage(t("paymentStartFailed"));
      setPhase("error");
      onError?.({ error: t("paymentStartFailed") });
    } finally {
      setLoading(false);
    }
  };

  const showLoadingState = phase === "sending" || phase === "pending" || checking;

  return (
    <div className={`grid gap-3 ${className}`}>
      <label className="grid gap-1 text-sm font-semibold">
        {t("mobileMoneyNumber")}
        <input
          type="tel"
          className="min-h-11 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
          placeholder="0781234567"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={disabled || loading}
        />
      </label>

      <button
        type="button"
        onClick={handlePay}
        disabled={disabled || loading}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-bold text-primary-foreground disabled:opacity-60"
      >
        <Smartphone size={16} aria-hidden="true" />
        {loading ? t("sending") : t("payWithMomo")}
      </button>

      {showLoadingState && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
          <div className="flex items-start gap-2.5">
            <Loader2 size={18} className="mt-0.5 animate-spin text-primary" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-primary">
                {loading ? t("sending") : t("paymentWaitingConfirmation")}
              </p>
              <p className="text-xs text-muted-foreground">{t("paymentCheckingStatus")}</p>
              <div className="flex items-center gap-1 pt-1">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        </div>
      )}

      {message && !showLoadingState && (
        <div className={`rounded-md p-3 text-sm ${phase === "error" ? "border border-red-200 bg-red-50 text-red-800" : "border border-green-200 bg-green-50 text-green-800"}`}>
          <p>{message}</p>
        </div>
      )}
    </div>
  );
}
