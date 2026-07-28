"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogIn } from "lucide-react";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { useTranslation } from "@/lib/TranslationContext";

export default function LoginPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [registerHref, setRegisterHref] = useState("/register");

  useEffect(() => {
    const next = new URLSearchParams(window.location.search).get("next");
    if (next) {
      setRegisterHref(`/register?next=${encodeURIComponent(next)}`);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t("loginFailed"));
        return;
      }

      // Redirect based on role or return URL
      const next = new URLSearchParams(window.location.search).get("next");
      const safeNext =
        next && next.startsWith("/") && !next.startsWith("//") ? next : null;

      if (data.user.role === "admin") {
        router.push(safeNext || "/admin/dashboard");
      } else {
        router.push(safeNext || "/dashboard");
      }
    } catch (err) {
      setError(t("bookingErrorGeneric"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <SiteHeader />
      <section className="mx-auto grid min-h-[calc(100vh-17rem)] max-w-md place-items-center px-4 py-12">
        <form onSubmit={handleSubmit} className="w-full rounded-lg border border-border bg-card p-6 shadow-smooth" aria-label={t("loginTitle")}>
          <h1 className="text-3xl font-extrabold">{t("loginTitle")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("loginSubtitle")}</p>

          {error && (
            <div className="mt-4 rounded-md bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</div>
          )}

          <label className="mt-6 grid gap-2 text-sm font-bold">
            {t("loginEmail")}
            <input type="email" className="min-h-12 rounded-md border border-input bg-background px-3 font-normal outline-none focus:border-primary" placeholder={t("contactPlaceholderEmail")} value={email} onChange={e => setEmail(e.target.value)} required />
          </label>
          <label className="mt-4 grid gap-2 text-sm font-bold">
            {t("loginPassword")}
            <input type="password" className="min-h-12 rounded-md border border-input bg-background px-3 font-normal outline-none focus:border-primary" placeholder={t("loginPasswordPlaceholder")} value={password} onChange={e => setPassword(e.target.value)} required />
          </label>
          <button type="submit" disabled={loading} className="focus-ring mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-bold text-primary-foreground disabled:opacity-50">
            <LogIn size={16} aria-hidden="true" />
            {loading ? t("signingIn") : t("loginButton")}
          </button>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {t("loginNoAccount")}{" "}
            <Link href={registerHref} className="font-bold text-primary">
              {t("createAccount")}
            </Link>
          </p>
        </form>
      </section>
      <SiteFooter />
    </main>
  );
}