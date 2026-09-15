"use client";

import { useTranslation } from "@/lib/TranslationContext";

export function CurrencySwitch({ className = "" }) {
  const { currency, setCurrency, t, fx } = useTranslation();

  return (
    <div className={`inline-flex flex-col items-end gap-1 ${className}`}>
      <div
        className="inline-flex items-center rounded-full border border-border bg-card p-0.5 shadow-sm"
        role="group"
        aria-label={t("currencyLabel")}
      >
        {["RWF", "USD"].map((code) => {
          const active = currency === code;
          const disabled = code === "USD" && !fx.ok;
          return (
            <button
              key={code}
              type="button"
              disabled={disabled}
              onClick={() => setCurrency(code)}
              className={`focus-ring min-h-9 rounded-full px-3 text-xs font-extrabold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-primary"
              }`}
              aria-pressed={active}
              title={
                disabled
                  ? t("fxUnavailable")
                  : code === "USD" && fx.rwfPerUsd
                    ? `1 USD = ${Math.round(fx.rwfPerUsd).toLocaleString()} RWF`
                    : undefined
              }
            >
              {code === "USD" ? "$ USD" : "RWF"}
            </button>
          );
        })}
      </div>
      {currency === "USD" && fx.ok ? (
        <p className="text-[10px] font-semibold text-muted-foreground">
          {t("fxLiveRate", { rate: Math.round(fx.rwfPerUsd).toLocaleString() })}
        </p>
      ) : null}
    </div>
  );
}
