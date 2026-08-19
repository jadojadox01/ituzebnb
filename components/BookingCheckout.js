"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronLeft, CreditCard, User } from "lucide-react";
import { IntouchPayPaymentButton } from "@/components/IntouchPayPaymentButton";
import { COUNTRIES } from "@/components/BookingWidget";
import { useTranslation } from "@/lib/TranslationContext";
import { formatRwf } from "@/lib/roomUtils";
import { sanitizeEmail, sanitizePhone, sanitizeText } from "@/lib/sanitizeInput";

export function BookingCheckout({ room, searchParams, user }) {
  const { t } = useTranslation();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [paymentOrder, setPaymentOrder] = useState(null);

  const [form, setForm] = useState({
    guest_name: user?.name || "",
    guest_email: user?.email || "",
    guest_phone: user?.phone || "",
    guest_country: "Rwanda",
    special_requests: "",
    payment_method: "pay_later",
    mobile_phone: user?.phone || "",
  });

  const pricing = useMemo(
    () => ({
      nights: room.nights,
      subtotal: room.subtotal,
      taxAmount: room.taxAmount,
      total: room.total,
      pricePerNight: room.price_daily,
    }),
    [room]
  );

  const validateGuest = () => {
    const name = sanitizeText(form.guest_name, { maxLength: 120 });
    const email = sanitizeEmail(form.guest_email);
    const phone = sanitizePhone(form.guest_phone);
    if (!name) {
      setError(t("widgetNameRequired"));
      return false;
    }
    if (!email) {
      setError(t("widgetEmailRequired"));
      return false;
    }
    if (!phone) {
      setError(t("widgetPhoneRequired"));
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    setError("");
    if (!validateGuest()) return;

    if (form.payment_method === "mobile_money" && !sanitizePhone(form.mobile_phone)) {
      setError(t("bookingEnterMomo"));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room_id: room.id,
          check_in: searchParams.check_in,
          check_out: searchParams.check_out,
          adults: Number(searchParams.adults) || 1,
          children: Number(searchParams.children) || 0,
          rooms_count: Number(searchParams.rooms) || 1,
          guests:
            (Number(searchParams.adults) || 1) + (Number(searchParams.children) || 0),
          guest_name: sanitizeText(form.guest_name, { maxLength: 120 }),
          guest_email: sanitizeEmail(form.guest_email),
          guest_phone: sanitizePhone(form.guest_phone),
          guest_country: sanitizeText(form.guest_country, { maxLength: 60 }),
          special_requests: sanitizeText(form.special_requests, { maxLength: 1000 }),
          payment_method: form.payment_method === "mobile_money" ? "mobile_money" : "",
          pay_later: form.payment_method === "pay_later",
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 401) {
          router.push(
            `/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`
          );
          return;
        }
        setError(data.error || t("bookingFailed"));
        return;
      }

      if (form.payment_method === "mobile_money") {
        setPaymentOrder({
          orderId: data.booking.booking_id,
          amount: data.booking.total_amount,
        });
        setStep(3);
        setSuccess(t("bookingCreatedPayMomo", { id: data.booking.booking_id }));
      } else {
        setSuccess(t("widgetBookingReceived"));
        setStep(4);
      }
    } catch {
      setError(t("bookingFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 4) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
        <CheckCircle2 className="mx-auto text-green-600" size={48} aria-hidden="true" />
        <h2 className="mt-4 text-xl font-extrabold text-green-900">{t("widgetBookingReceived")}</h2>
        <p className="mt-2 text-sm text-green-800">{success || t("widgetBookingReceivedHint")}</p>
        <button
          type="button"
          onClick={() => router.push("/my-bookings")}
          className="focus-ring mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-6 text-sm font-bold text-primary-foreground"
        >
          {t("viewMyBookings")}
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        {step === 1 && (
          <>
            <div className="mb-4 flex items-center gap-2">
              <User className="text-primary" size={20} />
              <h2 className="text-lg font-extrabold">{t("widgetGuestDetails")}</h2>
            </div>
            {error && (
              <p className="mb-4 rounded-md bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5 sm:col-span-2">
                <span className="text-sm font-bold">{t("widgetFullName")}</span>
                <input
                  required
                  autoComplete="name"
                  placeholder={t("widgetNamePlaceholder")}
                  value={form.guest_name}
                  onChange={(e) => setForm({ ...form, guest_name: e.target.value })}
                  className="min-h-11 rounded-lg border border-input px-3 text-sm outline-none focus:border-primary"
                />
              </label>
              <label className="grid gap-1.5">
                <span className="text-sm font-bold">{t("contactEmail")}</span>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder={t("widgetEmailPlaceholder")}
                  value={form.guest_email}
                  onChange={(e) => setForm({ ...form, guest_email: e.target.value })}
                  className="min-h-11 rounded-lg border border-input px-3 text-sm outline-none focus:border-primary"
                />
              </label>
              <label className="grid gap-1.5">
                <span className="text-sm font-bold">{t("contactPhone")}</span>
                <input
                  required
                  type="tel"
                  autoComplete="tel"
                  placeholder={t("widgetPhonePlaceholder")}
                  value={form.guest_phone}
                  onChange={(e) => setForm({ ...form, guest_phone: e.target.value })}
                  className="min-h-11 rounded-lg border border-input px-3 text-sm outline-none focus:border-primary"
                />
              </label>
              <label className="grid gap-1.5 sm:col-span-2">
                <span className="text-sm font-bold">{t("widgetCountry")}</span>
                <select
                  value={form.guest_country}
                  onChange={(e) => setForm({ ...form, guest_country: e.target.value })}
                  className="min-h-11 rounded-lg border border-input px-3 text-sm outline-none focus:border-primary"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1.5 sm:col-span-2">
                <span className="text-sm font-bold">{t("specialRequests")}</span>
                <textarea
                  value={form.special_requests}
                  onChange={(e) => setForm({ ...form, special_requests: e.target.value })}
                  className="min-h-24 rounded-lg border border-input px-3 py-2 text-sm outline-none focus:border-primary"
                  placeholder={t("widgetSpecialRequestsPlaceholder")}
                />
              </label>
            </div>
            <button
              type="button"
              onClick={() => {
                setError("");
                if (validateGuest()) setStep(2);
              }}
              className="focus-ring mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground"
            >
              {t("continue")}
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <div className="mb-4 flex items-center gap-2">
              <CreditCard className="text-primary" size={20} />
              <h2 className="text-lg font-extrabold">{t("widgetPaymentChoice")}</h2>
            </div>
            {error && (
              <p className="mb-4 rounded-md bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>
            )}
            <div className="space-y-3">
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-4 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                <input
                  type="radio"
                  name="payment_method"
                  value="pay_later"
                  checked={form.payment_method === "pay_later"}
                  onChange={() => setForm({ ...form, payment_method: "pay_later" })}
                  className="mt-1"
                />
                <div>
                  <p className="font-bold">{t("widgetPayLater")}</p>
                  <p className="text-sm text-muted-foreground">{t("widgetPayLaterHint")}</p>
                </div>
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-4 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                <input
                  type="radio"
                  name="payment_method"
                  value="mobile_money"
                  checked={form.payment_method === "mobile_money"}
                  onChange={() => setForm({ ...form, payment_method: "mobile_money" })}
                  className="mt-1"
                />
                <div className="flex-1">
                  <p className="font-bold">{t("paymentMobileMoney")}</p>
                  <p className="text-sm text-muted-foreground">{t("paymentMomoHint")}</p>
                  {form.payment_method === "mobile_money" && (
                    <input
                      type="tel"
                      value={form.mobile_phone}
                      onChange={(e) => setForm({ ...form, mobile_phone: e.target.value })}
                      placeholder={t("widgetMomoPlaceholder")}
                      className="mt-3 min-h-10 w-full rounded-lg border border-input px-3 text-sm"
                    />
                  )}
                </div>
              </label>
            </div>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-1 rounded-lg border border-border text-sm font-bold"
              >
                <ChevronLeft size={16} /> {t("back")}
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmit}
                className="inline-flex min-h-11 flex-[2] items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground disabled:opacity-60"
              >
                {submitting ? t("contactSending") : t("confirmBooking")}
              </button>
            </div>
          </>
        )}

        {step === 3 && paymentOrder && (
          <div>
            <p className="mb-4 text-sm text-muted-foreground">{success}</p>
            {error && (
              <p className="mb-4 rounded-md bg-red-50 p-3 text-sm font-semibold text-red-700">
                {typeof error === "string" ? error : error.error || t("paymentFailed")}
              </p>
            )}
            <IntouchPayPaymentButton
              orderId={paymentOrder.orderId}
              amount={paymentOrder.amount}
              defaultPhone={form.mobile_phone}
              autoStart
              onSuccess={() => {
                setStep(4);
                setSuccess(t("paymentConfirmed"));
              }}
              onError={(data) => setError(data?.error || t("paymentFailed"))}
            />
          </div>
        )}
      </div>

      <aside className="h-fit rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h3 className="text-lg font-extrabold">{t("bookingSummary")}</h3>
        <p className="mt-1 text-sm font-semibold text-primary">{room.title}</p>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{t("checkInLabel")}</dt>
            <dd className="font-semibold">{searchParams.check_in}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{t("checkOutLabel")}</dt>
            <dd className="font-semibold">{searchParams.check_out}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{t("widgetGuestsRooms")}</dt>
            <dd className="font-semibold">
              {searchParams.adults} {t("widgetAdults")}
              {Number(searchParams.children) > 0
                ? `, ${searchParams.children} ${t("widgetChildren")}`
                : ""}
            </dd>
          </div>
          <div className="flex justify-between border-t border-border pt-2">
            <dt>{t("widgetPerNight")}</dt>
            <dd>{formatRwf(pricing.pricePerNight)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>{t("widgetNights", { count: pricing.nights })}</dt>
            <dd>{formatRwf(pricing.subtotal)}</dd>
          </div>
          {pricing.taxAmount > 0 && (
            <div className="flex justify-between">
              <dt>{t("widgetTaxes")}</dt>
              <dd>{formatRwf(pricing.taxAmount)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-border pt-2 text-base font-extrabold">
            <dt>{t("widgetTotal")}</dt>
            <dd className="text-primary">{formatRwf(pricing.total)}</dd>
          </div>
        </dl>
      </aside>
    </div>
  );
}
