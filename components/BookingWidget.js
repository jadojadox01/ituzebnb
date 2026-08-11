"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Minus, Plus, Search, Users } from "lucide-react";
import { useTranslation } from "@/lib/TranslationContext";

const COUNTRIES = [
  "Rwanda",
  "Uganda",
  "Kenya",
  "Tanzania",
  "Burundi",
  "DRC",
  "Belgium",
  "France",
  "United States",
  "United Kingdom",
  "Other",
];

function Counter({ label, value, min, max, onChange, id }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <label htmlFor={id} className="text-sm font-semibold text-foreground">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          id={id}
          aria-label={`Decrease ${label}`}
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}
          className="grid h-9 w-9 place-items-center rounded-full border border-border bg-background text-foreground transition hover:bg-muted disabled:opacity-40"
        >
          <Minus size={16} />
        </button>
        <span className="min-w-[2ch] text-center text-sm font-bold" aria-live="polite">
          {value}
        </span>
        <button
          type="button"
          aria-label={`Increase ${label}`}
          disabled={value >= max}
          onClick={() => onChange(Math.min(max, value + 1))}
          className="grid h-9 w-9 place-items-center rounded-full border border-border bg-background text-foreground transition hover:bg-muted disabled:opacity-40"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}

/**
 * Booking.com-style search widget.
 * @param {object} props
 * @param {"hero"|"inline"|"compact"} props.variant
 * @param {number} [props.roomId] - pre-select room on property page
 * @param {function} [props.onSearch] - callback with search params
 * @param {boolean} [props.navigateToBook] - navigate to /book with query params
 */
export function BookingWidget({
  variant = "inline",
  roomId = null,
  onSearch,
  navigateToBook = true,
  className = "",
  initialValues = null,
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  const [checkIn, setCheckIn] = useState(initialValues?.check_in || "");
  const [checkOut, setCheckOut] = useState(initialValues?.check_out || "");
  const [adults, setAdults] = useState(Number(initialValues?.adults) || 2);
  const [children, setChildren] = useState(Number(initialValues?.children) || 0);
  const [rooms, setRooms] = useState(Number(initialValues?.rooms) || 1);
  const [guestsOpen, setGuestsOpen] = useState(false);
  const [error, setError] = useState("");
  const [searching, setSearching] = useState(false);

  const minCheckout = checkIn || today;
  const guestSummary = `${adults} ${t("widgetAdults")}${children ? ` · ${children} ${t("widgetChildren")}` : ""} · ${rooms} ${t("widgetRooms")}`;

  const handleSearch = async (e) => {
    e?.preventDefault();
    setError("");

    if (!checkIn || !checkOut) {
      setError(t("bookingSelectDates"));
      return;
    }
    if (checkOut <= checkIn) {
      setError(t("bookingCheckoutAfterCheckin"));
      return;
    }

    const params = {
      check_in: checkIn,
      check_out: checkOut,
      adults: String(adults),
      children: String(children),
      rooms: String(rooms),
    };
    if (roomId) params.room_id = String(roomId);

    if (onSearch) {
      setSearching(true);
      try {
        await onSearch(params);
      } finally {
        setSearching(false);
      }
      return;
    }

    if (navigateToBook) {
      const qs = new URLSearchParams(params).toString();
      router.push(`/book?${qs}`);
      return;
    }
  };

  const isHero = variant === "hero";
  const shellClass = isHero
    ? "rounded-2xl border border-white/20 bg-white p-4 shadow-2xl sm:p-5"
    : variant === "compact"
      ? "rounded-xl border border-border bg-card p-3 shadow-sm"
      : "rounded-2xl border border-border bg-card p-4 shadow-smooth sm:p-5";

  const labelClass = isHero ? "text-xs font-bold uppercase tracking-wide text-muted-foreground" : "text-xs font-bold text-muted-foreground";

  return (
    <form
      onSubmit={handleSearch}
      className={`${shellClass} ${className}`}
      aria-label={t("widgetSearchLabel")}
    >
      {variant !== "compact" && (
        <div className="mb-4 flex items-center gap-2">
          <CalendarDays className="text-primary" size={20} aria-hidden="true" />
          <h2 className="text-base font-extrabold sm:text-lg">{t("widgetTitle")}</h2>
        </div>
      )}

      {error && (
        <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700" role="alert">
          {error}
        </p>
      )}

      <div
        className={
          variant === "compact"
            ? "grid gap-3"
            : "grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.2fr_auto]"
        }
      >
        <label className="grid gap-1.5">
          <span className={labelClass}>{t("checkInLabel")}</span>
          <input
            type="date"
            required
            min={today}
            value={checkIn}
            onChange={(e) => {
              setCheckIn(e.target.value);
              if (checkOut && e.target.value >= checkOut) setCheckOut("");
            }}
            className="min-h-11 rounded-lg border border-input bg-background px-3 text-sm font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>

        <label className="grid gap-1.5">
          <span className={labelClass}>{t("checkOutLabel")}</span>
          <input
            type="date"
            required
            min={minCheckout}
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            className="min-h-11 rounded-lg border border-input bg-background px-3 text-sm font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>

        <div className="relative grid gap-1.5">
          <span className={labelClass}>{t("widgetGuestsRooms")}</span>
          <button
            type="button"
            onClick={() => setGuestsOpen((o) => !o)}
            className="flex min-h-11 items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 text-left text-sm font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            aria-expanded={guestsOpen}
            aria-haspopup="dialog"
          >
            <span className="flex items-center gap-2 truncate">
              <Users size={16} className="shrink-0 text-primary" aria-hidden="true" />
              {guestSummary}
            </span>
          </button>

          {guestsOpen && (
            <div
              className="absolute left-0 right-0 top-full z-20 mt-1 rounded-xl border border-border bg-card p-4 shadow-lg"
              role="dialog"
              aria-label={t("widgetGuestsRooms")}
            >
              <Counter label={t("widgetAdults")} value={adults} min={1} max={12} onChange={setAdults} id="adults" />
              <Counter label={t("widgetChildren")} value={children} min={0} max={8} onChange={setChildren} id="children" />
              <Counter label={t("widgetRooms")} value={rooms} min={1} max={6} onChange={setRooms} id="rooms" />
              <button
                type="button"
                onClick={() => setGuestsOpen(false)}
                className="mt-3 w-full rounded-lg bg-primary py-2 text-sm font-bold text-primary-foreground"
              >
                {t("widgetDone")}
              </button>
            </div>
          )}
        </div>

        <div className={variant === "compact" ? "" : "flex items-end sm:col-span-2 lg:col-span-1"}>
          <button
            type="submit"
            disabled={searching}
            className="focus-ring inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-bold text-primary-foreground transition hover:brightness-105 disabled:opacity-60"
          >
            <Search size={18} aria-hidden="true" />
            {searching ? t("widgetSearching") : t("widgetSearch")}
          </button>
        </div>
      </div>
    </form>
  );
}

export { COUNTRIES };
