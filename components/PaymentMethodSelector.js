"use client";

import Image from "next/image";
import { useTranslation } from "@/lib/TranslationContext";

const METHODS = [
  {
    id: "mobile_money",
    image: "/images/payments/mobile-money.png",
    enabled: true,
  },
  {
    id: "bank_card",
    image: "/images/payments/bank-card.png",
    enabled: false,
  },
];

export function PaymentMethodSelector({ value, onChange, compact = false, readOnly = false }) {
  const { t } = useTranslation();

  const labels = {
    mobile_money: {
      label: t("paymentMobileMoney"),
      description: t("paymentMobileMoneyDesc"),
    },
    bank_card: {
      label: t("paymentBankCard"),
      description: t("paymentBankCardDesc"),
    },
  };

  return (
    <fieldset className="grid gap-3">
      <legend className="mb-1 text-sm font-semibold">{t("paymentMethod")}</legend>

      <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
        {METHODS.map((method) => {
          const selected = value === method.id;
          const meta = labels[method.id];

          return (
            <label
              key={method.id}
              className={`group relative flex min-w-0 flex-row items-center gap-2.5 overflow-hidden rounded-xl border-2 p-2.5 transition-all duration-200 sm:gap-3 sm:p-3 ${
                readOnly
                  ? selected
                    ? "border-primary bg-primary/5"
                    : "border-border bg-muted/20 opacity-50"
                  : !method.enabled
                    ? "cursor-not-allowed border-border bg-muted/30 opacity-70"
                    : selected
                      ? "cursor-pointer border-primary bg-primary/5 shadow-md ring-2 ring-primary/20"
                      : "cursor-pointer border-border bg-card hover:border-primary/50 hover:shadow-sm"
              }`}
            >
              <input
                type="radio"
                name="payment_method"
                value={method.id}
                checked={selected}
                disabled={!method.enabled || readOnly}
                onChange={() => !readOnly && method.enabled && onChange(method.id)}
                className="sr-only"
              />

              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted/40 sm:h-16 sm:w-16">
                <Image
                  src={method.image}
                  alt={meta.label}
                  fill
                  className="object-contain p-1.5 transition-transform duration-200 group-hover:scale-105"
                  sizes="64px"
                />
              </div>

              <div className="min-w-0 flex-1 pr-5">
                <p className="text-xs font-bold leading-tight sm:text-sm">{meta.label}</p>
                {!compact && (
                  <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-muted-foreground sm:text-xs">
                    {meta.description}
                  </p>
                )}
                {!method.enabled && (
                  <span className="mt-1 inline-block rounded bg-muted px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
                    {t("comingSoon")}
                  </span>
                )}
              </div>

              {selected && method.enabled && (
                <span className="absolute right-1.5 top-1.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  ✓
                </span>
              )}
            </label>
          );
        })}
      </div>

      {value === "mobile_money" && (
        <p className="rounded-lg border border-amber-200/80 bg-amber-50 px-3 py-2.5 text-xs font-medium leading-relaxed text-amber-950">
          {t("paymentMomoHint")}
        </p>
      )}
    </fieldset>
  );
}
