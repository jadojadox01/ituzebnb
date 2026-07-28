"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BedDouble,
  CalendarCheck,
  Clock3,
  CreditCard,
  Home,
  LogOut,
  User,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { formatRwf } from "@/lib/roomUtils";
import { useTranslation } from "@/lib/TranslationContext";
import { tPaymentStatus, tStatus } from "@/lib/i18n";
import { DEFAULT_SITE_NAME, settingValue } from "@/lib/siteDefaults";

function statusStyle(status) {
  if (status === "confirmed") return "bg-emerald-100 text-emerald-800";
  if (status === "pending") return "bg-amber-100 text-amber-800";
  if (status === "cancelled") return "bg-rose-100 text-rose-800";
  return "bg-slate-100 text-slate-700";
}

function paymentStyle(status) {
  if (status === "paid") return "bg-emerald-100 text-emerald-800";
  if (status === "pending") return "bg-amber-100 text-amber-800";
  if (status === "failed") return "bg-rose-100 text-rose-800";
  return "bg-slate-100 text-slate-700";
}

export default function ClientDashboard() {
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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
        if (authData.user.role === "admin") {
          router.push("/admin/dashboard");
          return null;
        }
        setUser(authData.user);
        if (settingsData.settings) setSettings(settingsData.settings);
        return fetch("/api/bookings");
      })
      .then((r) => r?.json())
      .then((d) => {
        if (d?.bookings) setBookings(d.bookings);
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  const confirmed = bookings.filter((b) => b.status === "confirmed").length;
  const pending = bookings.filter((b) => b.status === "pending").length;
  const waitingApproval = bookings.filter(
    (b) => b.payment_status === "paid" && b.status === "pending"
  ).length;
  const awaitingPayment = bookings.filter(
    (b) =>
      b.status !== "cancelled" &&
      (b.payment_status === "unpaid" || b.payment_status === "pending")
  ).length;
  const totalSpent = bookings
    .filter((b) => b.payment_status === "paid")
    .reduce((sum, b) => sum + (b.total_amount || 0), 0);

  const siteName = settingValue(settings, "site_name") || DEFAULT_SITE_NAME;

  return (
    <main className="min-h-screen">
      <SiteHeader />

      <section className="border-b border-border bg-primary text-primary-foreground">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-secondary">{t("guestDashboard")}</p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{t("welcomeBack", { name: user.name })}</h1>
          <p className="mt-2 max-w-2xl text-primary-foreground/80">
            {t("dashboardIntro", { site: siteName })}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: t("statTotalBookings"), value: bookings.length, icon: BedDouble },
            { label: t("statConfirmed"), value: confirmed, icon: CalendarCheck },
            {
              label: waitingApproval > 0 ? t("statWaitingApproval") : t("statAwaitingPayment"),
              value: waitingApproval > 0 ? waitingApproval : awaitingPayment,
              icon: CreditCard,
            },
            { label: t("statTotalPaid"), value: formatRwf(totalSpent), icon: Clock3 },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <Icon className="text-primary" size={22} />
              <p className="mt-3 text-2xl font-bold">{value}</p>
              <p className="text-sm text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-bold">{t("recentBookings")}</h2>
              <Link href="/my-bookings" className="text-sm font-bold text-primary">{t("viewAll")}</Link>
            </div>

            {bookings.length === 0 ? (
              <div className="mt-8 rounded-2xl border border-dashed border-border p-10 text-center">
                <Home className="mx-auto text-muted-foreground/40" size={40} />
                <p className="mt-4 font-semibold">{t("noBookingsYet")}</p>
                <p className="mt-2 text-sm text-muted-foreground">{t("noBookingsHint")}</p>
                <Link href="/houses" className="focus-ring mt-5 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground">
                  {t("heroBrowseRooms")}
                </Link>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {bookings.slice(0, 5).map((b) => (
                  <div key={b.id} className="rounded-2xl border border-border bg-background p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-bold">{b.room?.title || t("roomFallback")}</p>
                        <p className="mt-1 font-mono text-xs text-muted-foreground">{b.booking_id}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${statusStyle(b.status)}`}>{tStatus(b.status, t)}</span>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${paymentStyle(b.payment_status)}`}>{tPaymentStatus(b.payment_status, t)}</span>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span>{b.check_in} → {b.check_out}</span>
                      <span>{formatRwf(b.total_amount)}</span>
                      <span>{t("guestsCount", { count: b.guests })}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {b.room?.id ? (
                        <Link
                          href={`/houses/${b.room.id}`}
                          className="focus-ring rounded-md border border-border bg-card px-3 py-1.5 text-xs font-bold hover:bg-muted"
                        >
                          {t("viewRoomBooked")}
                        </Link>
                      ) : null}
                      {b.payment_status === "paid" ? (
                        <>
                          <a
                            href={`/api/bookings/${b.id}/invoice`}
                            className="focus-ring rounded-md bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground"
                          >
                            {t("downloadInvoicePdf")}
                          </a>
                          {(b.status === "pending" || b.status === "confirmed") && (
                            <span className="text-xs font-semibold text-amber-700">
                              {b.status === "pending" ? t("invoiceWatermarkAwaiting") : t("invoiceWatermarkApproved")}
                            </span>
                          )}
                        </>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-bold">{t("yourProfile")}</h2>
              <div className="mt-4 space-y-3 text-sm">
                <p className="flex items-center gap-2"><User size={16} className="text-primary" /> {user.name}</p>
                <p className="text-muted-foreground">{user.email}</p>
                <p className="text-muted-foreground">{user.phone || t("noPhoneAdded")}</p>
              </div>
              <div className="mt-5 grid gap-2">
                <Link href="/profile" className="focus-ring rounded-xl border border-border px-4 py-2.5 text-center text-sm font-bold hover:bg-muted">
                  {t("editProfile")}
                </Link>
                <button onClick={handleLogout} className="focus-ring inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50">
                  <LogOut size={16} />
                  {t("logout")}
                </button>
              </div>
            </div>

            <div className="rounded-3xl bg-primary p-6 text-primary-foreground">
              <h2 className="text-lg font-bold">{t("needAnotherRoom")}</h2>
              <p className="mt-2 text-sm text-primary-foreground/85">
                {waitingApproval > 0
                  ? t("waitingApprovalHint", { count: waitingApproval })
                  : pending > 0
                    ? t("pendingBookingsHint", { count: pending })
                    : t("findRoomHint")}
              </p>
              <Link href="/houses" className="focus-ring mt-4 inline-flex rounded-full bg-secondary px-5 py-2.5 text-sm font-bold text-secondary-foreground">
                {t("findRoom")}
              </Link>
            </div>
          </aside>
        </div>
      </div>

      <SiteFooter settings={settings} />
    </main>
  );
}
