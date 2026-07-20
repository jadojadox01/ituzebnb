"use client";

import Link from "next/link";
import { Home, UserPlus } from "lucide-react";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { useTranslation } from "@/lib/TranslationContext";

export default function RegisterPage() {
  const { t } = useTranslation();

  const roles = [
    { value: "tenant", label: t("registerRoleTenant"), description: t("registerRoleTenantDesc") },
    { value: "landlord", label: t("registerRoleLandlord"), description: t("registerRoleLandlordDesc") }
  ];

  return (
    <main>
      <SiteHeader />
      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div className="rounded-lg bg-primary p-6 text-primary-foreground shadow-smooth">
          <Home size={34} aria-hidden="true" />
          <h1 className="mt-5 text-4xl font-extrabold tracking-normal">{t("registerHeading")}</h1>
          <p className="mt-4 leading-7 text-white/80">{t("registerSubtitle")}</p>
        </div>

        <form className="rounded-lg border border-border bg-card p-6 shadow-smooth" aria-label={t("registerTitle")}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold">
              {t("registerName")}
              <input className="min-h-12 rounded-md border border-input bg-background px-3 font-normal outline-none focus:border-primary" placeholder={t("registerPlaceholderName")} />
            </label>
            <label className="grid gap-2 text-sm font-bold">
              {t("registerPhone")}
              <input className="min-h-12 rounded-md border border-input bg-background px-3 font-normal outline-none focus:border-primary" placeholder={t("registerPlaceholderPhone")} />
            </label>
          </div>
          <label className="mt-4 grid gap-2 text-sm font-bold">
            {t("registerEmail")}
            <input type="email" className="min-h-12 rounded-md border border-input bg-background px-3 font-normal outline-none focus:border-primary" placeholder={t("registerPlaceholderEmail")} />
          </label>
          <label className="mt-4 grid gap-2 text-sm font-bold">
            {t("registerPassword")}
            <input type="password" className="min-h-12 rounded-md border border-input bg-background px-3 font-normal outline-none focus:border-primary" placeholder={t("registerPlaceholderPassword")} />
          </label>

          <fieldset className="mt-5">
            <legend className="text-sm font-bold">{t("registerAccountType")}</legend>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {roles.map((role) => (
                <label key={role.value} className="cursor-pointer rounded-lg border border-border bg-background p-4 transition has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                  <input type="radio" name="role" value={role.value} defaultChecked={role.value === "tenant"} className="accent-primary" />
                  <span className="mt-3 block font-extrabold">{role.label}</span>
                  <span className="mt-1 block text-xs leading-5 text-muted-foreground">{role.description}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <button className="focus-ring mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-secondary px-5 text-sm font-extrabold text-secondary-foreground">
            <UserPlus size={16} aria-hidden="true" />
            {t("registerButton")}
          </button>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {t("registerHasAccount")} <Link href="/login" className="font-bold text-primary">{t("signIn")}</Link>
          </p>
        </form>
      </section>
      <SiteFooter />
    </main>
  );
}
