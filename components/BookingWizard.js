"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Sparkles,
} from "lucide-react";
import { BookingStepIndicator } from "@/components/BookingStepIndicator";
import { PaymentMethodSelector } from "@/components/PaymentMethodSelector";
import { IntouchPayPaymentButton } from "@/components/IntouchPayPaymentButton";
import { useTranslation } from "@/lib/TranslationContext";
import {
  bookingContinueUrl,
  clearBookingDraft,
  loadBookingDraft,
  saveBookingDraft,
} from "@/lib/bookingDraft";

function formatRwf(amount) {
  return `RWF ${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(amount)}`;
}

export function BookingWizard({ listing, user, price }) {
  const { t } = useTranslation();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    check_in: "",
    check_out: "",
    guests: 1,
    special_requests: "",
    mobile_phone: user?.phone || "",
    payment_method: "mobile_money",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [paymentOrder, setPaymentOrder] = useState(null);

  const nights = useMemo(() => {
    if (!form.check_in || !form.check_out) return 0;
    const checkIn = new Date(form.check_in);
    const checkOut = new Date(form.check_out);
    if (checkOut <= checkIn) return 0;
    return Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
  }, [form.check_in, form.check_out]);

  const totalAmount = nights * (price || 0);
  const today = useMemo(() => new Date().toISOString().split("T")[0], []);
  const minCheckout = form.check_in || today;

  const validateStep1 = () => {
    if (!form.check_in || !form.check_out) {
      setError(t("bookingSelectDates"));
      return false;
    }
    const checkIn = new Date(form.check_in);
    const checkOut = new Date(form.check_out);
    if (checkOut <= checkIn) {
      setError(t("bookingCheckoutAfterCheckin"));
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (form.payment_method === "bank_card") {
      setError(t("bookingCardUnavailable"));
      return false;
    }
    if (form.payment_method === "mobile_money" && !form.mobile_phone?.trim()) {
      setError(t("bookingEnterMomo"));
      return false;
    }
    return true;
  };

  const goNext = () => {
    setError("");
    if (step === 1 && !validateStep1()) return;
    setStep((s) => Math.min(3, s + 1));
  };

  const goBack = () => {
    setError("");
    setStep((s) => Math.max(1, s - 1));
  };

  const loginReturnUrl = `/houses/${listing.id}`;

  useEffect(() => {
    if (!user) return;

    const params = new URLSearchParams(window.location.search);
    if (params.get("continueBooking") !== "1") return;

    const draft = loadBookingDraft(listing.id);
    if (!draft) return;

    setForm((prev) => ({
      ...prev,
      ...draft.form,
      mobile_phone: draft.form?.mobile_phone || user.phone || prev.mobile_phone,
    }));
    setStep(Math.min(3, Math.max(1, draft.step || 3)));
    setSuccess(t("bookingDraftRestored"));
    clearBookingDraft(listing.id);
    window.history.replaceState({}, "", loginReturnUrl);
  }, [listing.id, user, loginReturnUrl, t]);

  const goToLogin = () => {
    saveBookingDraft(listing.id, { step, form });
    router.push(
      `/login?next=${encodeURIComponent(bookingContinueUrl(loginReturnUrl))}`
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Enter key on steps 1–2 must not create a booking — advance instead.
    if (step !== 3) {
      goNext();
      return;
    }

    if (!user) {
      goToLogin();
      return;
    }

    if (!validateStep1() || !validateStep3()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room_id: listing.id,
          check_in: form.check_in,
          check_out: form.check_out,
          total_amount: totalAmount,
          guests: form.guests,
          special_requests: form.special_requests,
          payment_method: form.payment_method,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t("bookingFailed"));
        return;
      }

      if (form.payment_method === "mobile_money") {
        clearBookingDraft(listing.id);
        setPaymentOrder({
          orderId: data.booking.booking_id,
          amount: data.booking.total_amount,
        });
        setSuccess(t("bookingCreatedPayMomo", { id: data.booking.booking_id }));
      } else {
        setSuccess(t("bookingSubmitted", { id: data.booking.booking_id }));
      }
    } catch {
      setError(t("bookingErrorGeneric"));
    } finally {
      setSubmitting(false);
    }
  };

  if (paymentOrder) {
    return (
      <div className="mt-5 space-y-4">
        <BookingStepIndicator currentStep={3} />
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-800">
          {success}
        </div>
        <PaymentMethodSelector
          value={form.payment_method}
          onChange={() => {}}
          readOnly
          compact
        />
        <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-5">
          <p className="flex items-center gap-2 text-sm font-bold text-primary">
            <CreditCard size={16} />
            {t("bookingStep3")}
          </p>
          <IntouchPayPaymentButton
            orderId={paymentOrder.orderId}
            amount={paymentOrder.amount}
            defaultPhone={form.mobile_phone}
            onSuccess={() => {
              router.push("/houses?booking=success");
            }}
            onError={(data) => setError(data.error || t("bookingPaymentFailed"))}
          />
        </div>
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</div>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5">
      <div className="rounded-xl border border-border bg-gradient-to-b from-card to-muted/20 p-3 shadow-smooth sm:p-5">
        <div className="mb-1 flex items-center gap-2">
          <Sparkles className="text-secondary" size={18} />
          <h3 className="font-extrabold">{t("requestBooking")}</h3>
        </div>

        <BookingStepIndicator currentStep={step} />

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-600">
            {error}
          </div>
        )}
        {success && !paymentOrder && (
          <div className="mb-4 rounded-lg bg-green-50 px-3 py-2.5 text-sm font-semibold text-green-700">
            {success}
          </div>
        )}

        {/* Step 1 — Stay details */}
        {step === 1 && (
          <div key="step-1" className="space-y-4 animate-[fadeIn_0.25s_ease-out]">
            <p className="text-sm text-muted-foreground">{t("bookingStep1Hint")}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5 text-sm font-semibold">
                {t("checkInLabel")}
                <input
                  type="date"
                  required
                  min={today}
                  className="min-h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  value={form.check_in}
                  onChange={(e) => setForm({ ...form, check_in: e.target.value })}
                />
              </label>
              <label className="grid gap-1.5 text-sm font-semibold">
                {t("checkOutLabel")}
                <input
                  type="date"
                  required
                  min={minCheckout}
                  className="min-h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  value={form.check_out}
                  onChange={(e) => setForm({ ...form, check_out: e.target.value })}
                />
              </label>
            </div>
            <label className="grid gap-1.5 text-sm font-semibold">
              {t("guestsField")}
              <input
                type="number"
                min="1"
                max={listing.capacity || 10}
                className="min-h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                value={form.guests}
                onChange={(e) => setForm({ ...form, guests: parseInt(e.target.value, 10) || 1 })}
              />
            </label>
            {nights > 0 && (
              <div className="rounded-lg bg-primary/5 px-4 py-3 text-sm">
                <span className="text-muted-foreground">{t("bookingPreviewTotal")}: </span>
                <span className="font-extrabold text-primary">
                  {nights} {nights === 1 ? t("night") : t("nights")} · {formatRwf(totalAmount)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Step 2 — Guest details */}
        {step === 2 && (
          <div key="step-2" className="space-y-4 animate-[fadeIn_0.25s_ease-out]">
            <p className="text-sm text-muted-foreground">{t("bookingStep2Hint")}</p>
            <label className="grid gap-1.5 text-sm font-semibold">
              {t("contactPhoneLabel")}
              <input
                type="tel"
                className="min-h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="0781234567"
                value={form.mobile_phone}
                onChange={(e) => setForm({ ...form, mobile_phone: e.target.value })}
              />
              <span className="text-xs font-normal text-muted-foreground">{t("contactPhoneHint")}</span>
            </label>
            <label className="grid gap-1.5 text-sm font-semibold">
              {t("specialRequests")}
              <textarea
                className="min-h-24 rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder={t("specialRequestsPlaceholder")}
                value={form.special_requests}
                onChange={(e) => setForm({ ...form, special_requests: e.target.value })}
              />
            </label>
          </div>
        )}

        {/* Step 3 — Review + payment */}
        {step === 3 && (
          <div key="step-3" className="space-y-5 animate-[fadeIn_0.25s_ease-out]">
            <p className="text-sm text-muted-foreground">{t("bookingStep3Hint")}</p>

            <div className="rounded-xl border border-border bg-background/80 p-4 text-sm">
              <p className="mb-3 font-extrabold">{t("bookingSummary")}</p>
              <dl className="grid gap-2">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{t("checkInLabel")}</dt>
                  <dd className="font-semibold">{form.check_in}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{t("checkOutLabel")}</dt>
                  <dd className="font-semibold">{form.check_out}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{t("guestsField")}</dt>
                  <dd className="font-semibold">{form.guests}</dd>
                </div>
                <div className="mt-2 flex justify-between gap-4 border-t border-border pt-2">
                  <dt className="font-bold">{t("totalLabel")}</dt>
                  <dd className="text-lg font-extrabold text-primary">{formatRwf(totalAmount)}</dd>
                </div>
              </dl>
            </div>

            <PaymentMethodSelector
              value={form.payment_method}
              onChange={(payment_method) => setForm({ ...form, payment_method })}
            />

            {form.payment_method === "mobile_money" && (
              <label className="grid gap-1.5 text-sm font-semibold">
                {t("mobileMoneyNumber")}
                <input
                  type="tel"
                  required
                  className="min-h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="0781234567"
                  value={form.mobile_phone}
                  onChange={(e) => setForm({ ...form, mobile_phone: e.target.value })}
                />
              </label>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {step > 1 && (
            <button
              type="button"
              onClick={goBack}
              className="inline-flex min-h-11 w-full items-center justify-center gap-1 rounded-lg border border-border bg-background px-4 text-sm font-bold hover:bg-muted/50 sm:w-auto sm:px-6"
            >
              <ChevronLeft size={16} />
              {t("back")}
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={goNext}
              className="inline-flex min-h-11 w-full flex-1 items-center justify-center gap-1 rounded-lg bg-primary px-4 text-sm font-extrabold text-primary-foreground sm:w-auto sm:px-6"
            >
              {t("continue")}
              <ChevronRight size={16} />
            </button>
          ) : !user ? (
            <button
              type="button"
              onClick={goToLogin}
              className="inline-flex min-h-11 w-full flex-1 items-center justify-center gap-2 rounded-lg bg-secondary px-4 text-sm font-extrabold text-secondary-foreground sm:w-auto sm:px-6"
            >
              <CalendarCheck size={16} />
              {t("signInToBook")}
            </button>
          ) : (
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex min-h-11 w-full flex-1 items-center justify-center gap-2 rounded-lg bg-secondary px-4 text-sm font-extrabold text-secondary-foreground disabled:opacity-60 sm:w-auto sm:px-6"
            >
              <CalendarCheck size={16} />
              {submitting
                ? t("processing")
                : form.payment_method === "mobile_money"
                  ? t("bookAndPayMomo")
                  : t("confirmBooking")}
            </button>
          )}
        </div>

        {!user && step === 3 && (
          <p className="mt-3 text-center text-xs text-muted-foreground">{t("roomBookGuest")}</p>
        )}
      </div>
    </form>
  );
}
