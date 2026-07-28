"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { useTranslation } from "@/lib/TranslationContext";

const LANGUAGES = [
  {
    code: "en",
    labelKey: "languageEN",
    flag: "/images/flag-uk.svg",
  },
  {
    code: "fr",
    labelKey: "languageFR",
    flag: "/images/flag-fr.svg",
  },
];

export function LanguageSwitch() {
  const { language, setLanguage, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  const current = LANGUAGES.find((item) => item.code === language) || LANGUAGES[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const pickLanguage = (code) => {
    if (code === "en" || code === "fr") setLanguage(code);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        id="language-select"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("languageLabel")}
        onClick={() => setOpen((value) => !value)}
        className="focus-ring inline-flex min-h-10 items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1.5 text-xs font-bold text-foreground/80 transition hover:border-primary/50 hover:text-primary sm:gap-2 sm:px-2.5 sm:py-2"
      >
        <Image
          src={current.flag}
          alt=""
          width={20}
          height={14}
          className="rounded-sm border border-border/50 shadow-sm"
          aria-hidden="true"
        />
        <span className="hidden sm:inline">{t(current.labelKey)}</span>
        <span className="uppercase sm:hidden">{current.code}</span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-muted-foreground transition ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-labelledby="language-select"
          className="absolute right-0 z-50 mt-1.5 min-w-[9rem] overflow-hidden rounded-md border border-border bg-card py-1 shadow-lg"
        >
          {LANGUAGES.map((lang) => {
            const selected = language === lang.code;
            return (
              <li key={lang.code} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onClick={() => pickLanguage(lang.code)}
                  className={`flex min-h-10 w-full items-center gap-2.5 px-3 py-2 text-left text-xs font-bold transition hover:bg-primary/10 hover:text-primary ${
                    selected ? "bg-primary/5 text-primary" : "text-foreground/80"
                  }`}
                >
                  <Image
                    src={lang.flag}
                    alt=""
                    width={20}
                    height={14}
                    className="rounded-sm border border-border/50 shadow-sm"
                    aria-hidden="true"
                  />
                  <span>{t(lang.labelKey)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
