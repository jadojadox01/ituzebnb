"use client";

import Image from "next/image";
import { useTranslation } from "@/lib/TranslationContext";

export function LanguageSwitch() {
  const { language, toggleLanguage, t } = useTranslation();

  const nextLabel = language === "en" ? t("languageFR") : t("languageEN");

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className="focus-ring inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-bold text-foreground/75 transition hover:border-primary/50 hover:text-primary"
      aria-label={`${t("languageLabel")}: ${nextLabel}`}
      title={`${t("languageLabel")}: ${nextLabel}`}
    >
      <Image
        src="/images/flag-uk.svg"
        alt="English"
        width={18}
        height={12}
        className={`rounded-sm ${language === "en" ? "opacity-100" : "opacity-40"}`}
      />
      <span className="uppercase">{language === "en" ? "FR" : "EN"}</span>
      <Image
        src="/images/flag-fr.svg"
        alt="Français"
        width={18}
        height={12}
        className={`rounded-sm ${language === "fr" ? "opacity-100" : "opacity-40"}`}
      />
    </button>
  );
}
