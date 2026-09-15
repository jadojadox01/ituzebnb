"use client";

import { Check } from "lucide-react";
import { useTranslation } from "@/lib/TranslationContext";

export function BookingStepIndicator({
  currentStep,
  totalSteps = 3,
  completedFlashStep = null,
}) {
  const { t } = useTranslation();

  const steps = [
    { num: 1, label: t("bookingStep1") },
    { num: 2, label: t("bookingStep2") },
    { num: 3, label: t("bookingStep3") },
  ].slice(0, totalSteps);

  return (
    <div className="mb-8 sm:mb-10">
      <div className="flex items-center justify-between gap-2 sm:gap-3">
        {steps.map((step, index) => {
          const done = currentStep > step.num;
          const active = currentStep === step.num;
          const justDone = completedFlashStep === step.num;

          return (
            <div key={step.num} className="flex min-w-0 flex-1 items-center">
              <div className="flex min-w-0 flex-col items-center gap-2">
                <div
                  className={`relative grid h-12 w-12 shrink-0 place-items-center rounded-full text-sm font-extrabold transition-all duration-300 sm:h-14 sm:w-14 sm:text-base ${
                    done
                      ? "bg-primary text-primary-foreground"
                      : active
                        ? "bg-primary text-primary-foreground ring-4 ring-primary/25"
                        : "border-2 border-border bg-muted text-muted-foreground"
                  } ${justDone || active ? "booking-pulse-ring" : ""} ${
                    justDone ? "booking-complete-flash" : ""
                  }`}
                >
                  {done ? (
                    <Check
                      size={22}
                      strokeWidth={3}
                      className={justDone ? "booking-check-pop" : ""}
                      aria-hidden="true"
                    />
                  ) : (
                    step.num
                  )}
                </div>
                <span
                  className={`max-w-[5.5rem] text-center text-[11px] font-bold uppercase tracking-wide sm:max-w-none sm:text-xs ${
                    active || done ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className="relative mx-2 h-1.5 flex-1 overflow-hidden rounded-full bg-border sm:mx-4">
                  <div
                    className={`absolute inset-y-0 left-0 rounded-full bg-primary transition-all duration-500 ${
                      currentStep > step.num ? "w-full booking-progress-fill" : "w-0"
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-center text-sm font-semibold text-muted-foreground">
        {t("bookingStepOf", { current: currentStep, total: totalSteps })} —{" "}
        {steps[currentStep - 1]?.label}
      </p>
    </div>
  );
}
