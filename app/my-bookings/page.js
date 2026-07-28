"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { IntouchPayPaymentButton } from "@/components/IntouchPayPaymentButton";
import { formatRwf } from "@/lib/roomUtils";
import { useTranslation } from "@/lib/TranslationContext";
import { tPaymentStatus, tStatus } from "@/lib/i18n";

export default function MyBookings() {
  const { t } = useTranslation();
  const [bookings, setBookings] = useState([]);
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [paymentMessage, setPaymentMessage] = useState("");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const router = useRouter();

  const loadBookings = () =>
    fetch("/api/bookings")
      .then((r) => r.json())
      .then((d) => {
        if (d.bookings) {
          setBookings(d.bookings);
          setSelectedBooking((prev) => {
            if (!prev) return null;
            return d.bookings.find((b) => b.id === prev.id) || null;
          });
        }
      });

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me").then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
    ])
      .then(([authData, settingsData]) => {
        if (!authData.user) {
          router.push("/login");
          return null;
        }
        setUser(authData.user);
        if (settingsData.settings) setSettings(settingsData.settings);
        return loadBookings();
      })
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    if (!selectedBooking) return undefined;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedBooking]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <main className="min-h-screen">
      <SiteHeader />
      <section className="border-b border-border bg-primary px-4 py-10 text-primary-foreground sm:px-6">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-3xl font-bold">{t("myBookingsTitle")}</h1>
          <p className="mt-2 text-primary-foreground/80">{t("myBookingsSubtitle")}</p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {paymentMessage && (
          <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            {paymentMessage}
          </div>
        )}

        {bookings.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
            <p className="text-muted-foreground">{t("noBookingsAccount")}</p>
            <Link
              href="/houses"
              className="focus-ring mt-4 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground"
            >
              {t("heroBrowseRooms")}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setSelectedBooking(b)}
                className="block w-full rounded-3xl border border-border bg-card p-5 text-left shadow-sm transition hover:border-primary/40 hover:shadow-md"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold">{b.room?.title || t("roomFallback")}</h3>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">{b.booking_id}</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-bold">
                      {tStatus(b.status, t)}
                    </span>
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-bold">
                      {tPaymentStatus(b.payment_status, t)}
                    </span>
                  </div>
                </div>
                <div className="mt-4 grid gap-2 text-sm sm:grid-cols-4">
                  <div>
                    <span className="text-muted-foreground">{t("checkIn")}</span>{" "}
                    <span className="font-semibold">{b.check_in}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t("checkOut")}</span>{" "}
                    <span className="font-semibold">{b.check_out}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t("guestsLabel")}</span>{" "}
                    <span className="font-semibold">{b.guests}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t("totalLabel")}</span>{" "}
                    <span className="font-semibold">{formatRwf(b.total_amount)}</span>
                  </div>
                </div>
                <p className="mt-3 text-xs font-semibold text-primary">{t("viewBookingDetails")}</p>
              </button>
            ))}
          </div>
        )}

        <div className="mt-8">
          <Link href="/dashboard" className="text-sm font-bold text-primary">
            {t("backToDashboard")}
          </Link>
        </div>
      </div>

      {selectedBooking && (
        <div
          className="fixed inset-0 z-50 flex bg-black/70 p-0 sm:p-3"
          onClick={() => setSelectedBooking(null)}
        >
          <div
            className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-background shadow-2xl sm:h-auto sm:max-h-[96vh] sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-4 py-4 sm:px-6">
              <div className="min-w-0">
                <h2 className="text-xl font-extrabold sm:text-2xl">
                  {selectedBooking.room?.title || t("roomFallback")}
                </h2>
                <p className="mt-1 break-all font-mono text-sm text-muted-foreground">
                  {selectedBooking.booking_id}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-md hover:bg-muted"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
              <div className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-muted/50 p-4">
                  <p className="text-xs font-bold uppercase text-muted-foreground">{t("status")}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="rounded-full bg-card px-2.5 py-1 text-xs font-bold">
                      {tStatus(selectedBooking.status, t)}
                    </span>
                    <span className="rounded-full bg-card px-2.5 py-1 text-xs font-bold">
                      {tPaymentStatus(selectedBooking.payment_status, t)}
                    </span>
                  </div>
                </div>
                <div className="rounded-xl bg-muted/50 p-4">
                  <p className="text-xs font-bold uppercase text-muted-foreground">{t("totalLabel")}</p>
                  <p className="mt-2 text-2xl font-extrabold text-primary">
                    {formatRwf(selectedBooking.total_amount)}
                  </p>
                </div>
                <div className="rounded-xl bg-muted/50 p-4">
                  <p className="text-xs font-bold uppercase text-muted-foreground">{t("checkIn")}</p>
                  <p className="mt-2 font-semibold">{selectedBooking.check_in}</p>
                </div>
                <div className="rounded-xl bg-muted/50 p-4">
                  <p className="text-xs font-bold uppercase text-muted-foreground">{t("checkOut")}</p>
                  <p className="mt-2 font-semibold">{selectedBooking.check_out}</p>
                </div>
                <div className="rounded-xl bg-muted/50 p-4">
                  <p className="text-xs font-bold uppercase text-muted-foreground">{t("guestsLabel")}</p>
                  <p className="mt-2 font-semibold">{selectedBooking.guests}</p>
                </div>
                <div className="rounded-xl bg-muted/50 p-4">
                  <p className="text-xs font-bold uppercase text-muted-foreground">{t("roomType")}</p>
                  <p className="mt-2 font-semibold capitalize">
                    {selectedBooking.room?.room_type || "—"}
                  </p>
                </div>
              </div>

              {selectedBooking.special_requests ? (
                <div className="mx-auto mt-4 max-w-3xl rounded-xl bg-muted/50 p-4">
                  <p className="text-xs font-bold uppercase text-muted-foreground">{t("specialRequests")}</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm">{selectedBooking.special_requests}</p>
                </div>
              ) : null}

              {selectedBooking.payment_status !== "paid" && selectedBooking.status !== "cancelled" && (
                <div className="mx-auto mt-6 max-w-3xl rounded-xl border border-primary/20 bg-primary/5 p-4 sm:p-5">
                  <p className="mb-3 text-sm font-bold text-primary">{t("bookingStep3")}</p>
                  <IntouchPayPaymentButton
                    orderId={selectedBooking.booking_id}
                    amount={selectedBooking.total_amount}
                    defaultPhone={user?.phone || ""}
                    onPending={(data) =>
                      setPaymentMessage(data.message || t("paymentWaitingConfirmation"))
                    }
                    onSuccess={() => {
                      setPaymentMessage(t("paymentConfirmedAwaitingApproval"));
                      loadBookings();
                    }}
                    onError={(data) =>
                      setPaymentMessage(data.error || t("paymentRequestFailed"))
                    }
                  />
                </div>
              )}

              {selectedBooking.payment_status === "paid" && (
                <div className="mx-auto mt-6 max-w-3xl">
                  <a
                    href={`/api/bookings/${selectedBooking.id}/invoice`}
                    className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-bold text-primary-foreground"
                  >
                    {t("downloadInvoicePdf")}
                  </a>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {selectedBooking.status === "confirmed"
                      ? t("invoiceWatermarkApproved")
                      : selectedBooking.status === "completed"
                        ? t("invoiceWatermarkCompleted")
                        : t("invoiceWatermarkAwaiting")}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <SiteFooter settings={settings} />
    </main>
  );
}
