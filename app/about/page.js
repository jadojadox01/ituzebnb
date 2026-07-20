"use client";

import { CheckCircle2, Home, MessageCircle } from "lucide-react";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { useTranslation } from "@/lib/TranslationContext";

export default function AboutPage() {
  const { t } = useTranslation();

  const aboutItems = [
    { icon: CheckCircle2, titleKey: "aboutVerifiedRooms", textKey: "aboutVerifiedRoomsText" },
    { icon: Home, titleKey: "aboutEasyBrowsing", textKey: "aboutEasyBrowsingText" },
    { icon: MessageCircle, titleKey: "aboutSimpleContact", textKey: "aboutSimpleContactText" }
  ];

  return (
    <main>
      <SiteHeader />
      <section className="bg-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="text-sm font-extrabold uppercase text-primary">{t("aboutTitle")}</p>
            <h1 className="mt-3 text-4xl font-extrabold tracking-normal sm:text-5xl">{t("aboutHeading")}</h1>
          </div>
          <div className="space-y-5 text-lg leading-8 text-muted-foreground">
            <p>{t("aboutP1")}</p>
            <p>{t("aboutP2")}</p>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-muted/60 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-3">
          {aboutItems.map((item) => (
            <article key={item.titleKey} className="rounded-lg border border-border bg-card p-5 shadow-sm">
              <item.icon className="text-primary" size={24} aria-hidden="true" />
              <h2 className="mt-4 text-xl font-extrabold">{t(item.titleKey)}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{t(item.textKey)}</p>
            </article>
          ))}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
