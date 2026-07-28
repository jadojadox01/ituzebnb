"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Home, UserPlus } from "lucide-react";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { useTranslation } from "@/lib/TranslationContext";

export default function RegisterPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", role: "tenant" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginHref, setLoginHref] = useState("/login");

  useEffect(() => {
    const next = new URLSearchParams(window.location.search).get("next");
    if (next) {
      setLoginHref(`/login?next=${encodeURIComponent(next)}`);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password, phone: form.phone })
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t("registrationFailed"));
        return;
      }

      const next = new URLSearchParams(window.location.search).get("next");
      const safeNext =
        next && next.startsWith("/") && !next.startsWith("//") ? next : null;
      router.push(safeNext || "/dashboard");
    } catch (err) {
      setError(t("bookingErrorGeneric"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <SiteHeader />
      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div className="rounded-lg bg-primary p-6 text-primary-foreground shadow-smooth">
          <Home size={34} aria-hidden="true" />
          <h1 className="mt-5 text-4xl font-extrabold tracking-normal">{t("registerHeading")}</h1>
          <p className="mt-4 leading-7 text-white/80">{t("registerSubtitle")}</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-card p-6 shadow-smooth" aria-label={t("registerTitle")}>
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold">
              {t("registerName")}
              <input className="min-h-12 rounded-md border border-input bg-background px-3 font-normal outline-none focus:border-primary" placeholder={t("registerPlaceholderName")} value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
            </label>
            <label className="grid gap-2 text-sm font-bold">
              {t("registerPhone")}
              <input className="min-h-12 rounded-md border border-input bg-background px-3 font-normal outline-none focus:border-primary" placeholder={t("registerPlaceholderPhone")} value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
            </label>
          </div>
          <label className="mt-4 grid gap-2 text-sm font-bold">
            {t("registerEmail")}
            <input type="email" className="min-h-12 rounded-md border border-input bg-background px-3 font-normal outline-none focus:border-primary" placeholder={t("registerPlaceholderEmail")} value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
          </label>
          <label className="mt-4 grid gap-2 text-sm font-bold">
            {t("registerPassword")}
            <input type="password" className="min-h-12 rounded-md border border-input bg-background px-3 font-normal outline-none focus:border-primary" placeholder={t("registerPlaceholderPassword")} value={form.password} onChange={e => setForm({...form, password: e.target.value})} required minLength={6} />
          </label>

          <button type="submit" disabled={loading} className="focus-ring mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-secondary px-5 text-sm font-extrabold text-secondary-foreground disabled:opacity-50">
            <UserPlus size={16} aria-hidden="true" />
            {loading ? t("creatingAccount") : t("registerButton")}
          </button>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {t("registerHasAccount")}{" "}
            <Link href={loginHref} className="font-bold text-primary">
              {t("signIn")}
            </Link>
          </p>
        </form>
      </section>
      <SiteFooter />
    </main>
  );
}