"use client";

import { Mail, MapPin, Phone, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { localizedSetting } from "@/lib/i18n";
import { useTranslation } from "@/lib/TranslationContext";

export default function ContactPage() {
  const { t, language } = useTranslation();
  const [settings, setSettings] = useState({});
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) setSettings(d.settings);
      });
  }, []);

  const heading = localizedSetting(settings, "contact_heading", language, t);
  const subtitle = localizedSetting(settings, "contact_subtitle", language, t);
  const address = settings.contact_address;
  const phone = settings.contact_phone;
  const email = settings.contact_email;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/contact-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t("contactSubmitFailed"));
        return;
      }

      setSent(true);
      setForm({ name: "", email: "", phone: "", message: "" });
    } catch {
      setError(t("contactSubmitFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main>
      <SiteHeader />
      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
        <div>
          <p className="text-sm font-extrabold uppercase text-primary">{t("contactTitle")}</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-normal sm:text-4xl">{heading}</h1>
          <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">{subtitle}</p>
          <div className="mt-8 space-y-3 text-sm">
            {address ? (
              <p className="flex items-start gap-3">
                <MapPin className="mt-0.5 shrink-0 text-primary" size={18} aria-hidden="true" />
                <span className="break-safe">{address}</span>
              </p>
            ) : null}
            {phone ? (
              <p className="flex items-center gap-3">
                <Phone className="shrink-0 text-primary" size={18} aria-hidden="true" /> {phone}
              </p>
            ) : null}
            {email ? (
              <p className="flex items-start gap-3">
                <Mail className="mt-0.5 shrink-0 text-primary" size={18} aria-hidden="true" />{" "}
                <a href={`mailto:${email}`} className="break-safe font-semibold text-primary hover:underline">
                  {email}
                </a>
              </p>
            ) : null}
          </div>
        </div>

        <form
          className="rounded-lg border border-border bg-card p-4 shadow-smooth sm:p-5"
          aria-label={t("contactFormLabel")}
          onSubmit={handleSubmit}
        >
          {sent ? (
            <p className="rounded-md bg-green-50 p-4 text-sm text-green-800">{t("contactThankYou")}</p>
          ) : (
            <>
              {error && (
                <div className="mb-4 rounded-md bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-bold">
                  {t("contactName")}
                  <input
                    required
                    className="min-h-12 rounded-md border border-input bg-background px-3 font-normal outline-none focus:border-primary"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </label>
                <label className="grid gap-2 text-sm font-bold">
                  {t("contactPhone")}
                  <input
                    className="min-h-12 rounded-md border border-input bg-background px-3 font-normal outline-none focus:border-primary"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </label>
              </div>
              <label className="mt-4 grid gap-2 text-sm font-bold">
                {t("contactEmail")}
                <input
                  type="email"
                  required
                  className="min-h-12 rounded-md border border-input bg-background px-3 font-normal outline-none focus:border-primary"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </label>
              <label className="mt-4 grid gap-2 text-sm font-bold">
                {t("contactMessage")}
                <textarea
                  required
                  className="min-h-36 rounded-md border border-input bg-background px-3 py-3 font-normal outline-none focus:border-primary"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                />
              </label>
              <button
                type="submit"
                disabled={submitting}
                className="focus-ring mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-bold text-primary-foreground disabled:opacity-60"
              >
                <Send size={16} aria-hidden="true" />
                {submitting ? t("contactSending") : t("contactSend")}
              </button>
            </>
          )}
        </form>
      </section>
      <SiteFooter settings={settings} />
    </main>
  );
}
