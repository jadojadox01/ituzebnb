"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Mail, Phone, Save, User } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useTranslation } from "@/lib/TranslationContext";

export default function ProfilePage() {
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", password: "", currentPassword: "" });
  const router = useRouter();

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me").then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
    ])
      .then(([authData, settingsData]) => {
        if (!authData.user) {
          router.push("/login");
          return;
        }
        if (authData.user.role === "admin") {
          router.push("/admin/dashboard");
          return;
        }
        setUser(authData.user);
        setForm({
          name: authData.user.name,
          phone: authData.user.phone || "",
          password: "",
          currentPassword: "",
        });
        if (settingsData.settings) setSettings(settingsData.settings);
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setSaved(false);

    const res = await fetch("/api/auth/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || t("profileUpdateFailed"));
      return;
    }
    setUser(data.user);
    setForm((prev) => ({ ...prev, password: "", currentPassword: "" }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <main className="min-h-screen">
      <SiteHeader />

      <section className="border-b border-border bg-primary px-4 py-10 text-primary-foreground sm:px-6">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-secondary">{t("profileGuestAccount")}</p>
          <h1 className="mt-2 text-3xl font-bold">{t("profileTitle")}</h1>
          <p className="mt-2 text-primary-foreground/80">{t("profileSubtitle")}</p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
              {user.name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold">{user.name}</h2>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="mt-6 space-y-6 rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-bold">{t("profileEditAccount")}</h3>

          {error && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</div>}
          {saved && <div className="rounded-xl bg-green-50 p-3 text-sm text-green-800">{t("profileSaved")}</div>}

          <label className="grid gap-2 text-sm font-semibold">
            {t("profileFullName")}
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <input
                className="min-h-11 w-full rounded-xl border border-input bg-background pl-10 pr-3 text-sm outline-none focus:border-primary"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
          </label>

          <label className="grid gap-2 text-sm font-semibold">
            {t("profilePhoneMomo")}
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <input
                className="min-h-11 w-full rounded-xl border border-input bg-background pl-10 pr-3 text-sm outline-none focus:border-primary"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="0781234567"
              />
            </div>
          </label>

          <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
            <p className="flex items-center gap-2 font-semibold text-foreground">
              <Mail size={16} /> {t("profileEmail")}
            </p>
            <p className="mt-1">{user.email}</p>
            <p className="mt-1 flex items-center gap-2">
              <Calendar size={16} /> {t("profileMemberSince")}{" "}
              {user.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}
            </p>
          </div>

          <label className="grid gap-2 text-sm font-semibold">
            {t("profileNewPassword")}
            <input
              type="password"
              className="min-h-11 rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder={t("profileNewPasswordPlaceholder")}
            />
          </label>

          {form.password && (
            <label className="grid gap-2 text-sm font-semibold">
              {t("profileCurrentPassword")}
              <input
                type="password"
                className="min-h-11 rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary"
                value={form.currentPassword}
                onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                required
              />
            </label>
          )}

          <div className="flex flex-wrap gap-3">
            <button type="submit" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground">
              <Save size={16} />
              {t("profileSave")}
            </button>
            <Link href="/dashboard" className="rounded-full border border-border px-5 py-2.5 text-sm font-bold hover:bg-muted">
              {t("backToDashboard")}
            </Link>
          </div>
        </form>
      </div>

      <SiteFooter settings={settings} />
    </main>
  );
}
