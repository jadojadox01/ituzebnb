"use client";

import { useTranslation } from "@/lib/TranslationContext";

export function CurrencySwitch({ className = "" }) {
  const { currency, setCurrency, t } = useTranslation();

  return (
    <div
      className={`inline-flex items-center rounded-full border border-border bg-card p-0.5 shadow-sm ${className}`}
      role="group"
      aria-label={t("currencyLabel")}
    >
      {["RWF", "USD"].map((code) => {
        const active = currency === code;
        return (
          <button
            key={code}
            type="button"
            onClick={() => setCurrency(code)}
            className={`focus-ring min-h-9 rounded-full px-3 text-xs font-extrabold transition ${
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-primary"
            }`}
            aria-pressed={active}
          >
            {code === "USD" ? "$ USD" : "RWF"}
          </button>
        );
      })}
    </div>
  );
}
