"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Car,
  CheckCircle2,
  ChevronLeft,
  CreditCard,
  Mail,
  MessageCircle,
  Phone,
  User,
} from "lucide-react";
import { IntouchPayPaymentButton } from "@/components/IntouchPayPaymentButton";
import { COUNTRIES } from "@/components/BookingWidget";
import { useTranslation } from "@/lib/TranslationContext";
import { formatMoney } from "@/lib/roomUtils";
import { getNightlyPrice } from "@/lib/currency";
import { sanitizeEmail, sanitizePhone, sanitizeText } from "@/lib/sanitizeInput";
import { settingValue } from "@/lib/siteDefaults";

function digitsOnly(value) {
  return String(value || "").replace(/\D/g, "");
}

function whatsappHref(raw) {
  const digits = digitsOnly(raw);
  if (!digits) return "";
  return `https://wa.me/${digits.startsWith("0") ? `250${digits.slice(1)}` : digits}`;
}

export function BookingCheckout({ room, searchParams, user }) {
  const { t, currency } = useTranslation();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [paymentOrder, setPaymentOrder] = useState(null);
  const [settings, setSettings] = useState({});

  const [form, setForm] = useState({
    guest_name: user?.name || "",
    guest_email: user?.email || "",
    guest_phone: user?.phone || "",
    guest_country: "Rwanda",
    special_requests: "",
    pickup_requested: false,
    pickup_details: "",
    payment_method: "pay_later",
    mobile_phone: user?.phone || "",
  });

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) setSettings(d.settings);
      })
      .catch(() => {});
  }, []);

  const contactPhone = settingValue(settings, "contact_phone");
  const contactEmail = settingValue(settings, "contact_email");
  const contactWhatsapp = settingValue(settings, "contact_whatsapp") || contactPhone.split(",")[0]?.trim() || "";

  const pricing = useMemo(() => {
    const nights = Number(room.nights) || 1;
    const pricePerNight = getNightlyPrice(room, currency);
    const hasUsd = Number(room.price_daily_usd) > 0;
    const useDisplay = currency === "USD" && hasUsd;
    const subtotal = useDisplay ? pricePerNight * nights : Number(room.subtotal) || 0;
    const taxAmount = useDisplay ? 0 : Number(room.taxAmount) || 0;
    const total = useDisplay ? subtotal + taxAmount : Number(room.total) || 0;
    return {
      nights,
      subtotal,
      taxAmount,
      total,
      pricePerNight,
      payableRwf: Number(room.total) || 0,
    };
  }, [room, currency]);

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
    if (form.pickup_requested && !sanitizeText(form.pickup_details, { maxLength: 500 })) {
      setError(t("pickupDetailsRequired"));
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
          pickup_requested: Boolean(form.pickup_requested),
          pickup_details: form.pickup_requested
            ? sanitizeText(form.pickup_details, { maxLength: 500 })
            : "",
          display_currency: currency,
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
          className="focus-ring mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground"
        >
          {t("viewMyBookings")}
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-smooth">
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
                  className="min-h-11 rounded-xl border border-input px-3 text-sm outline-none focus:border-primary"
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
                  className="min-h-11 rounded-xl border border-input px-3 text-sm outline-none focus:border-primary"
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
                  className="min-h-11 rounded-xl border border-input px-3 text-sm outline-none focus:border-primary"
                />
              </label>
              <label className="grid gap-1.5 sm:col-span-2">
                <span className="text-sm font-bold">{t("widgetCountry")}</span>
                <select
                  value={form.guest_country}
                  onChange={(e) => setForm({ ...form, guest_country: e.target.value })}
                  className="min-h-11 rounded-xl border border-input px-3 text-sm outline-none focus:border-primary"
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
                  className="min-h-24 rounded-xl border border-input px-3 py-2 text-sm outline-none focus:border-primary"
                  placeholder={t("widgetSpecialRequestsPlaceholder")}
                />
              </label>
            </div>

            <div className="mt-5 rounded-2xl border border-primary/15 bg-primary/5 p-4">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={form.pickup_requested}
                  onChange={(e) =>
                    setForm({ ...form, pickup_requested: e.target.checked })
                  }
                  className="mt-1"
                />
                <div className="flex-1">
                  <p className="flex items-center gap-2 font-extrabold text-primary">
                    <Car size={18} aria-hidden="true" />
                    {t("pickupTitle")}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{t("pickupHint")}</p>
                </div>
              </label>
              {form.pickup_requested && (
                <div className="mt-4 space-y-3">
                  <label className="grid gap-1.5">
                    <span className="text-sm font-bold">{t("pickupDetailsLabel")}</span>
                    <textarea
                      value={form.pickup_details}
                      onChange={(e) => setForm({ ...form, pickup_details: e.target.value })}
                      className="min-h-24 rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                      placeholder={t("pickupDetailsPlaceholder")}
                      required
                    />
                  </label>
                  <div className="rounded-xl border border-border bg-card p-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      {t("pickupContactTitle")}
                    </p>
                    <div className="mt-2 flex flex-col gap-2 text-sm">
                      {contactPhone ? (
                        <a href={`tel:${digitsOnly(contactPhone.split(",")[0])}`} className="inline-flex items-center gap-2 font-semibold text-primary hover:underline">
                          <Phone size={15} /> {contactPhone}
                        </a>
                      ) : null}
                      {contactWhatsapp ? (
                        <a
                          href={whatsappHref(contactWhatsapp)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 font-semibold text-emerald-700 hover:underline"
                        >
                          <MessageCircle size={15} /> {t("pickupWhatsapp")}: {contactWhatsapp}
                        </a>
                      ) : null}
                      {contactEmail ? (
                        <a href={`mailto:${contactEmail}`} className="inline-flex items-center gap-2 font-semibold text-primary hover:underline">
                          <Mail size={15} /> {contactEmail}
                        </a>
                      ) : null}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setError("");
                if (validateGuest()) setStep(2);
              }}
              className="focus-ring mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground"
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
                      className="mt-3 min-h-10 w-full rounded-xl border border-input px-3 text-sm"
                    />
                  )}
                </div>
              </label>
            </div>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-1 rounded-full border border-border text-sm font-bold"
              >
                <ChevronLeft size={16} /> {t("back")}
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmit}
                className="inline-flex min-h-11 flex-[2] items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground disabled:opacity-60"
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
            <p className="mb-3 text-xs text-muted-foreground">{t("paymentAlwaysRwf")}</p>
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

      <aside className="h-fit rounded-2xl border border-border bg-card p-5 shadow-smooth">
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
          {form.pickup_requested ? (
            <div className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs font-semibold text-primary">
              {t("pickupSelected")}
            </div>
          ) : null}
          <div className="flex justify-between border-t border-border pt-2">
            <dt>{t("widgetPerNight")}</dt>
            <dd>{formatMoney(pricing.pricePerNight, currency)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>{t("widgetNights", { count: pricing.nights })}</dt>
            <dd>{formatMoney(pricing.subtotal, currency)}</dd>
          </div>
          {pricing.taxAmount > 0 && (
            <div className="flex justify-between">
              <dt>{t("widgetTaxes")}</dt>
              <dd>{formatMoney(pricing.taxAmount, currency)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-border pt-2 text-base font-extrabold">
            <dt>{t("widgetTotal")}</dt>
            <dd className="text-primary">{formatMoney(pricing.total, currency)}</dd>
          </div>
          {currency === "USD" ? (
            <p className="pt-1 text-xs text-muted-foreground">
              {t("paymentAlwaysRwf")}: {formatMoney(pricing.payableRwf, "RWF")}
            </p>
          ) : null}
        </dl>
      </aside>
    </div>
  );
}
