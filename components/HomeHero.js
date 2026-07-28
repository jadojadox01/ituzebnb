"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { ArrowRight, CalendarCheck, Sparkles } from "lucide-react";
import { collectHeroSlides, formatRwf } from "@/lib/roomUtils";
import { DEFAULT_SITE_NAME, settingValue } from "@/lib/siteDefaults";
import { localizedSetting } from "@/lib/i18n";
import { useTranslation } from "@/lib/TranslationContext";

export default function HomeHero({ settings, rooms, availableCount, totalCount, startingPrice }) {
  const { t, language } = useTranslation();
  const [slides, setSlides] = useState([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    fetch("/api/hero-ads")
      .then((r) => r.json())
      .then((d) => {
        setSlides(collectHeroSlides(rooms, d.ads || []));
      });
  }, [rooms]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [slides.length]);

  const siteName = settingValue(settings, "site_name") || DEFAULT_SITE_NAME;
  const fallbackTitle = localizedSetting(settings, "hero_title", language, t);
  const fallbackSubtitle = localizedSetting(settings, "hero_subtitle", language, t);
  const heroCardTitle = localizedSetting(settings, "hero_card_title", language, t);
  const heroCardText = localizedSetting(settings, "hero_card_text", language, t);

  const current = slides[index];
  const heroTitle = current?.title || fallbackTitle;
  const heroSubtitle = current?.subtitle || fallbackSubtitle;
  const heroLink = current?.link || "/houses";

  return (
    <section className="relative overflow-hidden border-b border-primary/10">
      <div className="absolute inset-0 overflow-hidden">
        {slides.length > 0 ? (
          slides.map((slide, i) => (
            <div
              key={`${slide.image}-${i}`}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                i === index ? "opacity-100" : "opacity-0"
              }`}
            >
              <Image src={slide.image} alt="" fill priority={i === 0} className="object-cover" quality={90} />
            </div>
          ))
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-accent to-primary/80" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0f2f28]/88 via-[#0f2f28]/62 to-[#0f2f28]/48" />
      </div>

      <div className="absolute inset-x-0 top-0 z-10 h-1 bg-secondary" aria-hidden="true" />

      <div className="relative z-10 mx-auto grid min-h-[78vh] max-w-7xl items-center gap-8 px-4 py-10 sm:min-h-[85vh] sm:gap-10 sm:px-6 sm:py-14 lg:grid-cols-[1fr_1.05fr] lg:px-8">
        <div className="max-w-xl text-white">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur-md sm:px-4 sm:text-sm">
            <Sparkles size={16} aria-hidden="true" />
            {siteName}
          </p>
          <h1 className="mt-5 text-3xl font-bold leading-tight sm:mt-6 sm:text-5xl lg:text-6xl">{heroTitle}</h1>
          <p className="mt-4 text-sm leading-6 text-white/88 sm:mt-5 sm:text-lg sm:leading-7">{heroSubtitle}</p>

          <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap">
            {String(heroLink).startsWith("http") ? (
              <a
                href={heroLink}
                className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-secondary px-6 py-3 text-sm font-bold text-secondary-foreground shadow-lg transition hover:brightness-105"
              >
                {t("heroBrowseRooms")}
                <ArrowRight size={16} aria-hidden="true" />
              </a>
            ) : (
              <Link
                href={heroLink || "/houses"}
                className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-secondary px-6 py-3 text-sm font-bold text-secondary-foreground shadow-lg transition hover:brightness-105"
              >
                {t("heroBrowseRooms")}
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            )}
            <Link
              href="/register"
              className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/35 bg-white/10 px-6 py-3 text-sm font-bold text-white backdrop-blur-md transition hover:bg-white/20"
            >
              {t("createAccount")}
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-2 text-center sm:mt-10 sm:max-w-md sm:gap-3">
            <div className="rounded-xl border border-white/15 bg-white/10 p-2.5 backdrop-blur-md sm:rounded-2xl sm:p-3">
              <p className="text-xl font-bold sm:text-2xl">{availableCount}</p>
              <p className="text-[10px] leading-tight text-white/75 sm:text-xs">{t("heroRoomsAvailable")}</p>
            </div>
            <div className="rounded-xl border border-white/15 bg-white/10 p-2.5 backdrop-blur-md sm:rounded-2xl sm:p-3">
              <p className="text-xl font-bold sm:text-2xl">{totalCount}</p>
              <p className="text-[10px] leading-tight text-white/75 sm:text-xs">{t("heroTotalListings")}</p>
            </div>
            <div className="rounded-xl border border-white/15 bg-white/10 p-2.5 backdrop-blur-md sm:rounded-2xl sm:p-3">
              <p className="break-safe text-xs font-bold leading-snug sm:text-sm">{startingPrice ? formatRwf(startingPrice) : "—"}</p>
              <p className="text-[10px] leading-tight text-white/75 sm:text-xs">{t("heroFromNight")}</p>
            </div>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md lg:mx-0 lg:max-w-none">
          <div className="overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-1.5 shadow-2xl backdrop-blur-sm sm:rounded-3xl sm:p-2">
            <div className="relative aspect-[4/3] min-h-[200px] sm:aspect-[5/6] sm:min-h-[280px]">
              {slides.length > 0 ? (
                <>
                  {slides.map((slide, i) => (
                    <div
                      key={`carousel-${slide.image}-${i}`}
                      className={`absolute inset-0 transition-opacity duration-700 ${
                        i === index ? "opacity-100" : "opacity-0"
                      }`}
                    >
                      <Image
                        src={slide.image}
                        alt={`Hero photo ${i + 1}`}
                        fill
                        priority={i === 0}
                        className="rounded-2xl object-cover"
                        quality={90}
                      />
                    </div>
                  ))}
                  {slides.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
                      {slides.map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setIndex(i)}
                          className={`h-2 rounded-full transition-all ${
                            i === index ? "w-7 bg-secondary" : "w-2 bg-white/50 hover:bg-white/80"
                          }`}
                          aria-label={t("heroShowSlide", { n: i + 1 })}
                        />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex h-full items-center justify-center rounded-2xl bg-muted/20 p-6 text-center text-sm text-white/80">
                  {t("heroEmptySlides")}
                </div>
              )}
            </div>
          </div>
          <div className="glass-panel absolute -bottom-4 left-3 right-3 rounded-xl p-3 shadow-smooth sm:-bottom-5 sm:left-6 sm:right-auto sm:w-80 sm:rounded-2xl sm:p-4">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground sm:h-11 sm:w-11">
                <CalendarCheck size={20} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="truncate font-bold text-sm sm:text-base">{heroCardTitle}</p>
                <p className="line-clamp-2 text-xs text-muted-foreground sm:text-sm">{heroCardText}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
