"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarCheck,
  Car,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Mail,
  MessageCircle,
  Phone,
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
import { formatMoney } from "@/lib/roomUtils";
import { settingValue } from "@/lib/siteDefaults";

function digitsOnly(value) {
  return String(value || "").replace(/\D/g, "");
}

function whatsappHref(raw) {
  const digits = digitsOnly(raw);
  if (!digits) return "";
  return `https://wa.me/${digits.startsWith("0") ? `250${digits.slice(1)}` : digits}`;
}

export function BookingWizard({ listing, user, price, fullscreen = false }) {
  const { t, fx, convertRoomAmount } = useTranslation();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [stepDir, setStepDir] = useState("forward");
  const [completedFlashStep, setCompletedFlashStep] = useState(null);
  const [celebrate, setCelebrate] = useState(false);
  const celebrateTimer = useRef(null);
  const [form, setForm] = useState({
    check_in: "",
    check_out: "",
    guests: 1,
    special_requests: "",
    pickup_requested: false,
    pickup_details: "",
    mobile_phone: user?.phone || "",
    payment_method: "mobile_money",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [paymentOrder, setPaymentOrder] = useState(null);
  const [settings, setSettings] = useState({});

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) setSettings(d.settings);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    return () => {
      if (celebrateTimer.current) clearTimeout(celebrateTimer.current);
    };
  }, []);

  const contactPhone = settingValue(settings, "contact_phone");
  const contactEmail = settingValue(settings, "contact_email");
  const contactWhatsapp =
    settingValue(settings, "contact_whatsapp") || contactPhone.split(",")[0]?.trim() || "";
  const primaryPhone = contactPhone.split(",")[0]?.trim() || "";

  const nights = useMemo(() => {
    if (!form.check_in || !form.check_out) return 0;
    const checkIn = new Date(form.check_in);
    const checkOut = new Date(form.check_out);
    if (checkOut <= checkIn) return 0;
    return Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
  }, [form.check_in, form.check_out]);

  // Always charge / show the listed RWF nightly rate (never the USD display amount).
  const nightlyRwf = Number(listing?.price_daily ?? price ?? 0) || 0;
  const totalRwf = nights * nightlyRwf;
  const totalUsd = fx.ok && fx.rwfPerUsd ? convertRoomAmount(totalRwf, "USD") : null;
  const today = useMemo(() => new Date().toISOString().split("T")[0], []);
  const minCheckout = form.check_in || today;

  const flashCompleted = (fromStep) => {
    setCompletedFlashStep(fromStep);
    setCelebrate(true);
    if (celebrateTimer.current) clearTimeout(celebrateTimer.current);
    celebrateTimer.current = setTimeout(() => {
      setCelebrate(false);
      setCompletedFlashStep(null);
    }, 900);
  };

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

  const validateStep2 = () => {
    if (form.pickup_requested && !String(form.pickup_details || "").trim()) {
      setError(t("pickupDetailsRequired"));
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
    if (step === 2 && !validateStep2()) return;
    flashCompleted(step);
    setStepDir("forward");
    setStep((s) => Math.min(3, s + 1));
  };

  const goBack = () => {
    setError("");
    setStepDir("back");
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
    router.push(`/login?next=${encodeURIComponent(bookingContinueUrl(loginReturnUrl))}`);
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

    if (!validateStep1() || !validateStep2() || !validateStep3()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room_id: listing.id,
          check_in: form.check_in,
          check_out: form.check_out,
          total_amount: totalRwf,
          guests: form.guests,
          special_requests: form.special_requests,
          pickup_requested: Boolean(form.pickup_requested),
          pickup_details: form.pickup_requested
            ? String(form.pickup_details || "").trim()
            : "",
          payment_method: form.payment_method,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t("bookingFailed"));
        return;
      }

      flashCompleted(3);

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

  const stepAnimClass =
    stepDir === "back" ? "booking-step-enter-back" : "booking-step-enter";

  const fieldClass =
    "min-h-14 rounded-xl border border-input bg-background px-4 text-base outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

  if (paymentOrder) {
    return (
      <div
        className={`space-y-6 ${
          fullscreen
            ? "rounded-3xl border border-border bg-card p-6 shadow-smooth sm:p-10"
            : "mt-5"
        }`}
      >
        <BookingStepIndicator currentStep={3} completedFlashStep={3} />
        <div className="rounded-2xl border border-green-200 bg-green-50 p-5 text-base font-semibold text-green-800">
          {success}
        </div>
        <PaymentMethodSelector
          value={form.payment_method}
          onChange={() => {}}
          readOnly
          compact
        />
        <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-6 sm:p-8">
          <p className="flex items-center gap-2 text-base font-bold text-primary">
            <CreditCard size={18} />
            {t("bookingStep3")}
          </p>
          <IntouchPayPaymentButton
            orderId={paymentOrder.orderId}
            amount={paymentOrder.amount}
            defaultPhone={form.mobile_phone}
            autoStart
            onSuccess={() => {
              router.push("/houses?booking=success");
            }}
            onError={(data) => setError(data?.error || t("bookingPaymentFailed"))}
          />
        </div>
        {error && (
          <div className="rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-600">
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={fullscreen ? "" : "mt-5"}
      aria-labelledby="booking-wizard-title"
    >
      <div
        className={`relative overflow-hidden border border-border bg-gradient-to-b from-card to-muted/20 shadow-smooth ${
          fullscreen
            ? "rounded-3xl p-5 sm:p-8 lg:p-12"
            : "rounded-xl p-3 sm:p-5"
        }`}
      >
        {celebrate && (
          <div
            className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center pt-4"
            aria-live="polite"
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground booking-check-pop shadow-smooth">
              <CheckCircle2 size={16} aria-hidden="true" />
              {t("bookingStepDone")}
            </span>
          </div>
        )}

        <div className={`mb-2 flex items-center gap-3 ${fullscreen ? "mb-4" : ""}`}>
          <Sparkles className="text-secondary" size={fullscreen ? 26 : 18} />
          <h2
            id="booking-wizard-title"
            className={`font-extrabold ${fullscreen ? "text-2xl sm:text-3xl" : "text-base"}`}
          >
            {t("requestBooking")}
          </h2>
        </div>
        {fullscreen && (
          <p className="mb-6 max-w-2xl text-base text-muted-foreground sm:text-lg">
            {t("bookingFullscreenHint")}
          </p>
        )}

        <BookingStepIndicator
          currentStep={step}
          completedFlashStep={completedFlashStep}
        />

        {error && (
          <div className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
            {error}
          </div>
        )}
        {success && !paymentOrder && (
          <div className="mb-5 rounded-xl bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
            {success}
          </div>
        )}

        <div className="min-h-[22rem] sm:min-h-[24rem]">
          {/* Step 1 — Stay details */}
          {step === 1 && (
            <div key="step-1" className={`space-y-6 ${stepAnimClass}`}>
              <p className="text-base text-muted-foreground sm:text-lg">{t("bookingStep1Hint")}</p>
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-semibold sm:text-base">
                  {t("checkInLabel")}
                  <input
                    type="date"
                    required
                    min={today}
                    className={fieldClass}
                    value={form.check_in}
                    onChange={(e) => setForm({ ...form, check_in: e.target.value })}
                  />
                </label>
                <label className="grid gap-2 text-sm font-semibold sm:text-base">
                  {t("checkOutLabel")}
                  <input
                    type="date"
                    required
                    min={minCheckout}
                    className={fieldClass}
                    value={form.check_out}
                    onChange={(e) => setForm({ ...form, check_out: e.target.value })}
                  />
                </label>
              </div>
              <label className="grid max-w-xs gap-2 text-sm font-semibold sm:text-base">
                {t("guestsField")}
                <input
                  type="number"
                  min="1"
                  max={listing.capacity || 10}
                  className={fieldClass}
                  value={form.guests}
                  onChange={(e) =>
                    setForm({ ...form, guests: parseInt(e.target.value, 10) || 1 })
                  }
                />
              </label>
              {nights > 0 && (
                <div className="rounded-2xl bg-primary/5 px-5 py-4 text-base">
                  <span className="text-muted-foreground">{t("bookingPreviewTotal")}: </span>
                  <span className="font-extrabold text-primary">
                    {nights} {nights === 1 ? t("night") : t("nights")} ·{" "}
                    {formatMoney(totalRwf, "RWF")}
                  </span>
                  {totalUsd != null ? (
                    <p className="mt-1 text-sm font-semibold text-muted-foreground">
                      ≈ {formatMoney(totalUsd, "USD")}
                      {fx.rwfPerUsd
                        ? ` · ${t("fxLiveRate", {
                            rate: Math.round(fx.rwfPerUsd).toLocaleString(),
                          })}`
                        : ""}
                    </p>
                  ) : null}
                </div>
              )}
            </div>
          )}

          {/* Step 2 — Guest details + car pickup */}
          {step === 2 && (
            <div key="step-2" className={`space-y-6 ${stepAnimClass}`}>
              <p className="text-base text-muted-foreground sm:text-lg">{t("bookingStep2Hint")}</p>
              <label className="grid gap-2 text-sm font-semibold sm:text-base">
                {t("contactPhoneLabel")}
                <input
                  type="tel"
                  className={fieldClass}
                  placeholder="0781234567"
                  value={form.mobile_phone}
                  onChange={(e) => setForm({ ...form, mobile_phone: e.target.value })}
                />
                <span className="text-xs font-normal text-muted-foreground sm:text-sm">
                  {t("contactPhoneHint")}
                </span>
              </label>
              <label className="grid gap-2 text-sm font-semibold sm:text-base">
                {t("specialRequests")}
                <textarea
                  className="min-h-32 rounded-xl border border-input bg-background px-4 py-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder={t("specialRequestsPlaceholder")}
                  value={form.special_requests}
                  onChange={(e) => setForm({ ...form, special_requests: e.target.value })}
                />
              </label>

              <div className="rounded-2xl border border-primary/15 bg-primary/5 p-5 sm:p-6">
                <label className="flex cursor-pointer items-start gap-4">
                  <input
                    type="checkbox"
                    checked={form.pickup_requested}
                    onChange={(e) =>
                      setForm({ ...form, pickup_requested: e.target.checked })
                    }
                    className="mt-1.5 h-5 w-5"
                  />
                  <div className="flex-1">
                    <p className="flex items-center gap-2 text-lg font-extrabold text-primary">
                      <Car size={22} aria-hidden="true" />
                      {t("pickupTitle")}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground sm:text-base">
                      {t("pickupHint")}
                    </p>
                  </div>
                </label>
                {form.pickup_requested && (
                  <div className="mt-5 space-y-4 booking-step-enter">
                    <label className="grid gap-2 text-sm font-semibold sm:text-base">
                      {t("pickupDetailsLabel")}
                      <textarea
                        value={form.pickup_details}
                        onChange={(e) =>
                          setForm({ ...form, pickup_details: e.target.value })
                        }
                        className="min-h-32 rounded-xl border border-input bg-background px-4 py-3 text-base outline-none focus:border-primary"
                        placeholder={t("pickupDetailsPlaceholder")}
                        required
                      />
                    </label>
                    <div className="rounded-xl border border-border bg-card p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                        {t("pickupContactTitle")}
                      </p>
                      <div className="mt-3 flex flex-col gap-3 text-base">
                        {primaryPhone ? (
                          <a
                            href={`tel:${digitsOnly(primaryPhone)}`}
                            className="inline-flex items-center gap-2 font-semibold text-primary hover:underline"
                          >
                            <Phone size={18} /> {contactPhone}
                          </a>
                        ) : null}
                        {contactWhatsapp ? (
                          <a
                            href={whatsappHref(contactWhatsapp)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 font-semibold text-emerald-700 hover:underline"
                          >
                            <MessageCircle size={18} /> {t("pickupWhatsapp")}:{" "}
                            {contactWhatsapp}
                          </a>
                        ) : null}
                        {contactEmail ? (
                          <a
                            href={`mailto:${contactEmail}`}
                            className="inline-flex items-center gap-2 font-semibold text-primary hover:underline"
                          >
                            <Mail size={18} /> {contactEmail}
                          </a>
                        ) : null}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3 — Review + payment */}
          {step === 3 && (
            <div key="step-3" className={`space-y-6 ${stepAnimClass}`}>
              <p className="text-base text-muted-foreground sm:text-lg">{t("bookingStep3Hint")}</p>

              <div className="rounded-2xl border border-border bg-background/80 p-5 text-base sm:p-6">
                <p className="mb-4 text-lg font-extrabold">{t("bookingSummary")}</p>
                <dl className="grid gap-3">
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
                  {form.pickup_requested ? (
                    <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm font-semibold text-primary">
                      {t("pickupSelected")}
                      {form.pickup_details ? (
                        <p className="mt-1 whitespace-pre-wrap font-normal text-muted-foreground">
                          {form.pickup_details}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                  <div className="mt-2 flex justify-between gap-4 border-t border-border pt-3">
                    <dt className="font-bold">{t("totalLabel")}</dt>
                    <dd className="text-right">
                      <p className="text-2xl font-extrabold text-primary">
                        {formatMoney(totalRwf, "RWF")}
                      </p>
                      {totalUsd != null ? (
                        <p className="text-sm font-semibold text-muted-foreground">
                          ≈ {formatMoney(totalUsd, "USD")}
                        </p>
                      ) : null}
                    </dd>
                  </div>
                </dl>
              </div>

              <PaymentMethodSelector
                value={form.payment_method}
                onChange={(payment_method) => setForm({ ...form, payment_method })}
              />

              {form.payment_method === "mobile_money" && (
                <label className="grid gap-2 text-sm font-semibold sm:text-base">
                  {t("mobileMoneyNumber")}
                  <input
                    type="tel"
                    required
                    className={fieldClass}
                    placeholder="0781234567"
                    value={form.mobile_phone}
                    onChange={(e) => setForm({ ...form, mobile_phone: e.target.value })}
                  />
                </label>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-8 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={goBack}
              className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-6 text-base font-bold hover:bg-muted/50 sm:w-auto"
            >
              <ChevronLeft size={20} />
              {t("back")}
            </button>
          ) : (
            <span className="hidden sm:block" />
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={goNext}
              className="inline-flex min-h-14 w-full flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-8 text-base font-extrabold text-primary-foreground sm:max-w-xs sm:flex-none"
            >
              {t("continue")}
              <ChevronRight size={20} />
            </button>
          ) : !user ? (
            <button
              type="button"
              onClick={goToLogin}
              className="inline-flex min-h-14 w-full flex-1 items-center justify-center gap-2 rounded-xl bg-secondary px-8 text-base font-extrabold text-secondary-foreground sm:max-w-md sm:flex-none"
            >
              <CalendarCheck size={20} />
              {t("signInToBook")}
            </button>
          ) : (
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex min-h-14 w-full flex-1 items-center justify-center gap-2 rounded-xl bg-secondary px-8 text-base font-extrabold text-secondary-foreground disabled:opacity-60 sm:max-w-md sm:flex-none"
            >
              <CalendarCheck size={20} />
              {submitting
                ? t("processing")
                : form.payment_method === "mobile_money"
                  ? t("bookAndPayMomo")
                  : t("confirmBooking")}
            </button>
          )}
        </div>

        {!user && step === 3 && (
          <p className="mt-4 text-center text-sm text-muted-foreground">{t("roomBookGuest")}</p>
        )}
      </div>
    </form>
  );
}
