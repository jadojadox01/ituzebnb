"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Filter, Search, BedDouble } from "lucide-react";
import { PropertyCard } from "@/components/PropertyCard";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { isRoomBookable } from "@/lib/roomUtils";
import { useTranslation } from "@/lib/TranslationContext";

export default function HousesPage() {
  const { t } = useTranslation();
  const [rooms, setRooms] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [settings, setSettings] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("booking") === "success") {
      setBookingSuccess(true);
      window.history.replaceState({}, "", "/houses");
    }
  }, []);

  useEffect(() => {
    fetch("/api/rooms").then((r) => r.json()).then((d) => {
      if (d.rooms) {
        const available = d.rooms.filter((room) => isRoomBookable(room.status));
        setRooms(available);
        setFiltered(available);
      }
    });
    fetch("/api/settings").then((r) => r.json()).then((d) => {
      if (d.settings) setSettings(d.settings);
    });
  }, []);

  useEffect(() => {
    let result = [...rooms];
    if (searchTerm) {
      result = result.filter(
        (r) =>
          r.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (typeFilter !== "all") {
      result = result.filter((r) => r.room_type === typeFilter);
    }
    setFiltered(result);
  }, [searchTerm, typeFilter, rooms]);

  return (
    <main>
      <SiteHeader />
      <section className="border-b border-border bg-primary px-4 py-10 text-primary-foreground sm:px-6 sm:py-14 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-secondary">{t("navHouses")}</p>
          <h1 className="mt-2 text-3xl font-bold sm:text-5xl">{t("housesTitle")}</h1>
          <p className="mt-3 max-w-2xl text-sm text-primary-foreground/80 sm:text-base">{t("housesDescription")}</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {bookingSuccess && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-900">
            <CheckCircle2 className="mt-0.5 shrink-0 text-green-600" size={20} />
            <div>
              <p className="font-bold">{t("paymentConfirmed")}</p>
              <p className="mt-1 text-green-800">{t("housesBookingSuccessHint")}</p>
            </div>
          </div>
        )}

        <div className="rounded-lg border border-border bg-card p-3 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-[1fr_180px_auto]">
            <label className="flex min-h-12 items-center gap-3 rounded-md border border-input bg-background px-3 sm:col-span-2 md:col-span-1">
              <Search size={18} className="shrink-0 text-muted-foreground" aria-hidden="true" />
              <span className="sr-only">{t("searchByLocation")}</span>
              <input
                className="w-full min-w-0 bg-transparent text-sm outline-none"
                placeholder={t("searchPlaceholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </label>
            <select
              className="min-h-12 rounded-md border border-input bg-background px-3 text-sm outline-none"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">{t("filterAllTypes")}</option>
              <option value="single">{t("roomType_single")}</option>
              <option value="double">{t("roomType_double")}</option>
              <option value="twin">{t("roomType_twin")}</option>
            </select>
            <button
              type="button"
              className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-secondary px-5 text-sm font-extrabold text-secondary-foreground sm:col-span-2 md:col-span-1"
            >
              <Filter size={16} aria-hidden="true" />
              {t("housesCountLabel", { count: filtered.length })}
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:mt-8 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.length === 0 ? (
            <div className="col-span-full py-12 text-center">
              <BedDouble size={48} className="mx-auto text-muted-foreground/40" />
              <p className="mt-4 text-lg font-semibold text-muted-foreground">{t("housesNoResults")}</p>
              <p className="text-sm text-muted-foreground">{t("housesTryFilters")}</p>
            </div>
          ) : (
            filtered.map((room) => (
              <PropertyCard key={room.id} listing={room} />
            ))
          )}
        </div>
      </section>
      <SiteFooter settings={settings} />
    </main>
  );
}
