"use client";

import { Filter, Search } from "lucide-react";
import { PropertyCard } from "@/components/PropertyCard";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { useTranslation } from "@/lib/TranslationContext";
import { listings } from "@/constants/listings";

export default function HousesPage() {
  const { t } = useTranslation();

  return (
    <main>
      <SiteHeader />
      <section className="border-b border-primary/20 bg-primary px-4 py-12 text-primary-foreground sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-bold uppercase">{t("navHouses")}</p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-normal">{t("housesTitle")}</h1>
          <p className="mt-3 max-w-2xl text-white/80">{t("housesDescription")}</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-border bg-card p-3 shadow-sm">
          <form className="grid gap-3 md:grid-cols-[1fr_180px_180px_auto]" aria-label="Filter houses">
            <label className="flex min-h-12 items-center gap-3 rounded-md border border-input bg-background px-3">
              <Search size={18} className="text-muted-foreground" aria-hidden="true" />
              <span className="sr-only">{t("searchByLocation")}</span>
              <input className="w-full bg-transparent text-sm outline-none" placeholder={t("searchPlaceholder")} />
            </label>
            <select className="min-h-12 rounded-md border border-input bg-background px-3 text-sm outline-none">
              <option>{t("anyBudget")}</option>
              <option>Single Room</option>
              <option>Double Room</option>
              <option>Twin Bed Room</option>
            </select>
            <select className="min-h-12 rounded-md border border-input bg-background px-3 text-sm outline-none">
              <option>Available</option>
              <option>Reserved</option>
              <option>Booked</option>
            </select>
            <button className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-secondary px-5 text-sm font-extrabold text-secondary-foreground">
              <Filter size={16} aria-hidden="true" />
              {t("filterDistrict")}
            </button>
          </form>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <PropertyCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
