"use client";

import Link from "next/link";
import { LogIn } from "lucide-react";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { useTranslation } from "@/lib/TranslationContext";

export default function LoginPage() {
  const { t } = useTranslation();

  return (
    <main>
      <SiteHeader />
      <section className="mx-auto grid min-h-[calc(100vh-17rem)] max-w-md place-items-center px-4 py-12">
        <form className="w-full rounded-lg border border-border bg-card p-6 shadow-smooth" aria-label={t("loginTitle")}>
          <h1 className="text-3xl font-extrabold">{t("loginTitle")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("loginSubtitle")}</p>
          <label className="mt-6 grid gap-2 text-sm font-bold">
            {t("loginEmail")}
            <input type="email" className="min-h-12 rounded-md border border-input bg-background px-3 font-normal outline-none focus:border-primary" placeholder={t("contactPlaceholderEmail")} />
          </label>
          <label className="mt-4 grid gap-2 text-sm font-bold">
            {t("loginPassword")}
            <input type="password" className="min-h-12 rounded-md border border-input bg-background px-3 font-normal outline-none focus:border-primary" placeholder={t("loginPasswordPlaceholder")} />
          </label>
          <button className="focus-ring mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-bold text-primary-foreground">
            <LogIn size={16} aria-hidden="true" />
            {t("loginButton")}
          </button>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {t("loginNoAccount")} <Link href="/register" className="font-bold text-primary">{t("createAccount")}</Link>
          </p>
        </form>
      </section>
      <SiteFooter />
    </main>
  );
}
