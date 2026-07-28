"use client";

import { CheckCircle2, Home, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { DEFAULT_SITE_NAME, settingValue } from "@/lib/siteDefaults";
import { localizedSetting } from "@/lib/i18n";
import { useTranslation } from "@/lib/TranslationContext";

export default function AboutPage() {
  const { t, language } = useTranslation();
  const [settings, setSettings] = useState({});

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) setSettings(d.settings);
      });
  }, []);

  const siteName = settingValue(settings, "site_name") || DEFAULT_SITE_NAME;
  const aboutText = localizedSetting(settings, "about_text", language, t);
  const mission = localizedSetting(settings, "mission", language, t);
  const vision = localizedSetting(settings, "vision", language, t);

  const aboutItems = [
    { icon: CheckCircle2, title: t("aboutRealRooms"), text: t("aboutRealRoomsText") },
    { icon: Home, title: t("aboutComfortable"), text: t("aboutComfortableText") },
    { icon: MessageCircle, title: t("aboutEasyContact"), text: t("aboutEasyContactText") },
  ];

  return (
    <main>
      <SiteHeader />
      <section className="bg-white px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-10">
          <div>
            <p className="text-sm font-extrabold uppercase text-primary">{t("navAbout")} {siteName}</p>
            <h1 className="mt-3 text-3xl font-extrabold tracking-normal sm:text-5xl">{t("aboutHeading")}</h1>
          </div>
          <div className="space-y-5 text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
            <p>{aboutText}</p>
            {mission ? <p><strong className="text-foreground">{t("aboutMissionLabel")}</strong> {mission}</p> : null}
            {vision ? <p><strong className="text-foreground">{t("aboutVisionLabel")}</strong> {vision}</p> : null}
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-muted/60 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-3">
          {aboutItems.map((item) => (
            <article key={item.title} className="rounded-lg border border-border bg-card p-5 shadow-sm">
              <item.icon className="text-primary" size={24} aria-hidden="true" />
              <h2 className="mt-4 text-xl font-extrabold">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p>
            </article>
          ))}
        </div>
      </section>
      <SiteFooter settings={settings} />
    </main>
  );
}
