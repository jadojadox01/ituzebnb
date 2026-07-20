"use client";

import { Mail, MapPin, Phone, Send } from "lucide-react";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { useTranslation } from "@/lib/TranslationContext";

export default function ContactPage() {
  const { t } = useTranslation();

  return (
    <main>
      <SiteHeader />
      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
        <div>
          <p className="text-sm font-extrabold uppercase text-primary">{t("navContact")}</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-normal">{t("contactHeading")}</h1>
          <p className="mt-4 leading-7 text-muted-foreground">{t("contactSubtitle")}</p>
          <div className="mt-8 space-y-3 text-sm">
            <p className="flex items-center gap-3"><MapPin className="text-primary" size={18} aria-hidden="true" /> {t("footerAddress")}</p>
            <p className="flex items-center gap-3"><Phone className="text-primary" size={18} aria-hidden="true" /> {t("footerPhone")}</p>
            <p className="flex items-center gap-3"><Mail className="text-primary" size={18} aria-hidden="true" /> {t("footerEmail")}</p>
          </div>
        </div>

        <form className="rounded-lg border border-border bg-card p-5 shadow-smooth" aria-label={t("contactFormLabel")}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold">
              {t("contactName")}
              <input className="min-h-12 rounded-md border border-input bg-background px-3 font-normal outline-none focus:border-primary" placeholder={t("contactPlaceholderName")} />
            </label>
            <label className="grid gap-2 text-sm font-bold">
              {t("contactPhone")}
              <input className="min-h-12 rounded-md border border-input bg-background px-3 font-normal outline-none focus:border-primary" placeholder={t("contactPlaceholderPhone")} />
            </label>
          </div>
          <label className="mt-4 grid gap-2 text-sm font-bold">
            {t("contactEmail")}
            <input className="min-h-12 rounded-md border border-input bg-background px-3 font-normal outline-none focus:border-primary" placeholder={t("contactPlaceholderEmail")} />
          </label>
          <label className="mt-4 grid gap-2 text-sm font-bold">
            {t("contactMessage")}
            <textarea className="min-h-36 rounded-md border border-input bg-background px-3 py-3 font-normal outline-none focus:border-primary" placeholder={t("contactPlaceholderMessage")} />
          </label>
          <button className="focus-ring mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-bold text-primary-foreground">
            <Send size={16} aria-hidden="true" />
            {t("contactSend")}
          </button>
        </form>
      </section>
      <SiteFooter />
    </main>
  );
}
