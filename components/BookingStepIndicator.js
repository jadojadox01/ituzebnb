"use client";

import { Check } from "lucide-react";
import { useTranslation } from "@/lib/TranslationContext";

export function BookingStepIndicator({ currentStep, totalSteps = 3 }) {
  const { t } = useTranslation();

  const steps = [
    { num: 1, label: t("bookingStep1") },
    { num: 2, label: t("bookingStep2") },
    { num: 3, label: t("bookingStep3") },
  ].slice(0, totalSteps);

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between gap-1">
        {steps.map((step, index) => {
          const done = currentStep > step.num;
          const active = currentStep === step.num;

          return (
            <div key={step.num} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-extrabold transition-all sm:h-9 sm:w-9 sm:text-sm ${
                    done
                      ? "bg-primary text-primary-foreground"
                      : active
                        ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                        : "border-2 border-border bg-muted text-muted-foreground"
                  }`}
                >
                  {done ? <Check size={16} strokeWidth={3} /> : step.num}
                </div>
                <span
                  className={`hidden text-center text-[10px] font-bold uppercase tracking-wide sm:block ${
                    active ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`mx-1 h-0.5 flex-1 rounded-full transition-colors ${
                    currentStep > step.num ? "bg-primary" : "bg-border"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-center text-xs font-semibold text-muted-foreground sm:hidden">
        {t("bookingStepOf", { current: currentStep, total: totalSteps })} — {steps[currentStep - 1]?.label}
      </p>
    </div>
  );
}
