"use client";

import { useEffect, useState } from "react";
import { FileUploadField } from "@/components/FileUploadField";
import { DEFAULT_SETTINGS } from "@/lib/siteDefaults";

export default function AdminSettings() {
  const [settings, setSettings] = useState({ ...DEFAULT_SETTINGS });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) setSettings((prev) => ({ ...prev, ...d.settings }));
      });
  }, []);

  const handleSave = async () => {
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const field = (key, label, type = "input", rows = 3) => (
    <label className="grid gap-1.5 text-sm font-semibold">
      {label}
      {type === "textarea" ? (
        <textarea
          rows={rows}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          value={settings[key] || ""}
          onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
        />
      ) : (
        <input
          className="min-h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
          value={settings[key] || ""}
          onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
        />
      )}
    </label>
  );

  return (
    <div>
      <h1 className="text-2xl font-extrabold">Website settings</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Change your site name, homepage text, about page, contact details, and footer.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-extrabold">General</h2>
          <div className="mt-4 grid gap-4">
            {field("site_name", "Site name")}
            <FileUploadField
              label="Site logo"
              folder="logo"
              accept="image/*"
              value={settings.site_logo || ""}
              onChange={(url) => setSettings({ ...settings, site_logo: url })}
              hint="Upload your B&B logo for the header and footer."
            />
            {field("site_description", "Site tagline / description", "textarea", 3)}
            {field("footer_copyright", "Footer copyright line")}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-extrabold">Homepage hero (fallback text)</h2>
          <p className="mb-3 text-xs text-muted-foreground">
            Used when hero slides have no title. Manage slides and images under Hero Section.
          </p>
          <div className="grid gap-4">
            {field("hero_title", "Hero headline")}
            {field("hero_subtitle", "Hero subtitle", "textarea", 3)}
            {field("hero_card_title", "Hero card title")}
            {field("hero_card_text", "Hero card text", "textarea", 2)}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-extrabold">Homepage sections</h2>
          <div className="mt-4 grid gap-4">
            {field("rooms_section_subtitle", "Rooms section subtitle", "textarea", 2)}
            {field("about_section_title", "About section title")}
            {field("guests_expect_text", "What guests can expect", "textarea", 3)}
            {field("cta_title", "Call-to-action title")}
            {field("cta_subtitle", "Call-to-action subtitle", "textarea", 2)}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-extrabold">About & mission</h2>
          <div className="mt-4 grid gap-4">
            {field("about_text", "About text", "textarea", 4)}
            {field("mission", "Mission", "textarea", 3)}
            {field("vision", "Vision", "textarea", 3)}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-extrabold">Contact page</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {field("contact_heading", "Contact heading")}
            {field("contact_subtitle", "Contact subtitle", "textarea", 2)}
            {field("contact_phone", "Phone")}
            {field("contact_email", "Email")}
            {field("contact_address", "Address")}
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button onClick={handleSave} className="rounded-md bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground">
          Save settings
        </button>
        {saved && <span className="text-sm font-semibold text-green-600">Saved successfully</span>}
      </div>
    </div>
  );
}
