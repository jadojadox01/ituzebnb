"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BedDouble,
  MapPin,
  ShieldCheck,
  Sparkles,
  Wifi,
} from "lucide-react";
import HomeHero from "@/components/HomeHero";
import { PropertyCard } from "@/components/PropertyCard";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { formatRwf, isRoomBookable, normalizeRoomForCard } from "@/lib/roomUtils";
import { DEFAULT_SITE_NAME, settingValue } from "@/lib/siteDefaults";
import { localizedSetting } from "@/lib/i18n";
import { useTranslation } from "@/lib/TranslationContext";

export default function HomePage() {
  const { t, language } = useTranslation();
  const [rooms, setRooms] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/rooms").then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
    ])
      .then(([roomsData, settingsData]) => {
        if (roomsData.rooms) setRooms(roomsData.rooms);
        if (settingsData.settings) setSettings(settingsData.settings);
      })
      .finally(() => setLoading(false));
  }, []);

  const availableRooms = rooms.filter((r) => isRoomBookable(r.status));
  const featuredRooms = availableRooms.slice(0, 6);
  const startingPrice = availableRooms.length
    ? Math.min(...availableRooms.map((r) => r.price_daily || 0))
    : null;

  const siteName = settingValue(settings, "site_name") || DEFAULT_SITE_NAME;
  const siteDescription = localizedSetting(settings, "site_description", language, t);
  const roomsSectionSubtitle = localizedSetting(settings, "rooms_section_subtitle", language, t);
  const aboutSectionTitle = localizedSetting(settings, "about_section_title", language, t);
  const guestsExpectText = localizedSetting(settings, "guests_expect_text", language, t);
  const ctaTitle = localizedSetting(settings, "cta_title", language, t);
  const ctaSubtitle = localizedSetting(settings, "cta_subtitle", language, t);
  const aboutText = localizedSetting(settings, "about_text", language, t);
  const mission = localizedSetting(settings, "mission", language, t);
  const vision = localizedSetting(settings, "vision", language, t);

  const steps = [
    t("homeStepPickRoom"),
    t("homeStepChooseDates"),
    t("homeStepPayMomo"),
  ];

  return (
    <main>
      <SiteHeader />

      <HomeHero
        settings={settings}
        rooms={rooms}
        availableCount={availableRooms.length}
        totalCount={rooms.length}
        startingPrice={startingPrice}
      />

      <section id="rooms" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-accent">
              <MapPin size={16} aria-hidden="true" />
              {t("homeAvailableNow")}
            </p>
            <h2 className="mt-2 text-2xl font-bold break-safe sm:text-4xl">{t("homeRoomsAt", { name: siteName })}</h2>
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">{roomsSectionSubtitle}</p>
          </div>
          <Link
            href="/houses"
            className="focus-ring inline-flex w-full items-center justify-center gap-2 rounded-full border border-primary/20 px-5 py-2.5 text-sm font-bold text-primary transition hover:bg-primary/5 sm:w-auto"
          >
            {t("homeViewAllRooms")}
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>

        {loading ? (
          <div className="mt-10 flex min-h-[240px] items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : featuredRooms.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-dashed border-border bg-card p-12 text-center">
            <BedDouble className="mx-auto text-muted-foreground/40" size={48} />
            <h3 className="mt-4 text-xl font-semibold">{t("homeNoRoomsTitle")}</h3>
            <p className="mt-2 text-muted-foreground">{t("homeNoRoomsText")}</p>
            <Link href="/admin/rooms" className="focus-ring mt-6 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground">
              {t("homeManageRooms")}
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:mt-10 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featuredRooms.map((room) => (
              <PropertyCard key={room.id} listing={normalizeRoomForCard(room)} />
            ))}
          </div>
        )}
      </section>

      {aboutText || mission ? (
        <section className="border-y border-border bg-card/60">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8">
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-accent">{t("homeAboutBnb")}</p>
              <h2 className="mt-3 text-3xl font-bold">{aboutSectionTitle}</h2>
              <p className="mt-4 leading-7 text-muted-foreground">{aboutText || siteDescription}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {mission ? (
                <div className="rounded-2xl border border-border bg-background p-5">
                  <ShieldCheck className="text-primary" size={22} />
                  <h3 className="mt-3 font-semibold">{t("homeOurMission")}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{mission}</p>
                </div>
              ) : null}
              {vision ? (
                <div className="rounded-2xl border border-border bg-background p-5">
                  <Sparkles className="text-secondary" size={22} />
                  <h3 className="mt-3 font-semibold">{t("homeOurVision")}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{vision}</p>
                </div>
              ) : null}
              <div className="rounded-2xl border border-border bg-background p-5 sm:col-span-2">
                <Wifi className="text-accent" size={22} />
                <h3 className="mt-3 font-semibold">{t("homeGuestsExpect")}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{guestsExpectText}</p>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
        <div className="overflow-hidden rounded-2xl bg-primary px-4 py-8 text-primary-foreground sm:rounded-3xl sm:px-10 sm:py-12">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <h2 className="text-2xl font-bold sm:text-4xl">{ctaTitle}</h2>
              <p className="mt-3 max-w-xl text-sm text-primary-foreground/85 sm:text-base">{ctaSubtitle}</p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link href="/houses" className="focus-ring inline-flex min-h-12 items-center justify-center rounded-full bg-secondary px-6 py-3 text-sm font-bold text-secondary-foreground">
                  {t("homeCheckAvailability")}
                </Link>
                <Link href="/login" className="focus-ring inline-flex min-h-12 items-center justify-center rounded-full border border-white/25 px-6 py-3 text-sm font-bold text-white">
                  {t("signIn")}
                </Link>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {steps.map((step, i) => (
                <div key={step} className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                  <p className="text-xs font-bold uppercase tracking-wider text-secondary">{t("homeStepLabel", { n: i + 1 })}</p>
                  <p className="mt-2 font-semibold">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <SiteFooter settings={settings} />
    </main>
  );
}
