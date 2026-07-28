"use client";

import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { useTranslation } from "@/lib/TranslationContext";
import { SiteLogo } from "@/components/SiteLogo";
import { DEFAULT_SITE_NAME, settingValue } from "@/lib/siteDefaults";

import { localizedSetting } from "@/lib/i18n";

export function SiteFooter({ settings = {} }) {
  const { t, language } = useTranslation();
  const siteDescription =
    localizedSetting(settings, "site_description", language, t) || t("siteTagline");
  const phone = settings.contact_phone;
  const email = settings.contact_email;
  const address = settings.contact_address;
  const copyright =
    localizedSetting(settings, "footer_copyright", language, t) ||
    t("footerCopyright").replace("ITUZE B&B", settingValue(settings, "site_name") || DEFAULT_SITE_NAME);

  const footerLinks = [
    { label: t("navHome"), href: "/" },
    { label: t("navHouses"), href: "/houses" },
    { label: t("navAbout"), href: "/about" },
    { label: t("navContact"), href: "/contact" },
  ];

  return (
    <footer className="border-t border-primary/10 bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 md:grid-cols-[1.2fr_0.8fr_1fr] md:gap-8 md:py-12 lg:px-8">
        <div>
          <SiteLogo variant="footer" />
          <p className="mt-4 max-w-sm text-sm leading-6 text-white/80">{siteDescription}</p>
        </div>

        <nav aria-label="Footer navigation">
          <p className="font-bold">{t("footerExplore")}</p>
          <div className="mt-3 grid gap-2">
            {footerLinks.map((link) => (
              <Link key={link.href} href={link.href} className="focus-ring w-fit rounded-md text-sm text-white/80 transition hover:text-secondary">
                {link.label}
              </Link>
            ))}
          </div>
        </nav>

        <div>
          <p className="font-bold">{t("footerContact")}</p>
          <div className="mt-3 space-y-2 text-sm text-white/80">
            {address ? (
              <p className="flex items-start gap-2"><MapPin size={16} className="mt-0.5 shrink-0" aria-hidden="true" /> {address}</p>
            ) : null}
            {phone ? (
              <p className="flex items-start gap-2"><Phone size={16} className="mt-0.5 shrink-0" aria-hidden="true" /> {phone}</p>
            ) : null}
            {email ? (
              <p className="flex items-start gap-2"><Mail size={16} className="mt-0.5 shrink-0" aria-hidden="true" /> {email}</p>
            ) : null}
            {!address && !phone && !email ? (
              <p className="text-white/60">{t("footerContactMissing")}</p>
            ) : null}
          </div>
        </div>
      </div>
      <div className="border-t border-white/15 px-4 py-4 text-center text-sm text-white/70">
        {copyright}
      </div>
    </footer>
  );
}
