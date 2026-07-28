"use client";

import { useEffect } from "react";
import { useTranslation } from "@/lib/TranslationContext";
import { DEFAULT_SITE_NAME, settingValue } from "@/lib/siteDefaults";
import { localizedSetting } from "@/lib/i18n";

export function DynamicSiteTitle() {
  const { language, t } = useTranslation();

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        const settings = d.settings || {};
        const name = settingValue(settings, "site_name") || DEFAULT_SITE_NAME;
        const description = localizedSetting(settings, "site_description", language, t);
        const titleSuffix = language === "fr" ? "Bed & Breakfast à Kigali" : "Bed & Breakfast in Kigali";
        document.title = `${name} | ${titleSuffix}`;
        const meta = document.querySelector('meta[name="description"]');
        if (meta) meta.setAttribute("content", description);
      })
      .catch(() => {});
  }, [language, t]);

  return null;
}
