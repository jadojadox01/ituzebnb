"use client";

import Link from "next/link";
import { Home } from "lucide-react";
import { useEffect, useState } from "react";
import { DEFAULT_SITE_NAME } from "@/lib/siteDefaults";

export function SiteLogo({ variant = "header", className = "" }) {
  const [settings, setSettings] = useState({ site_name: "", site_logo: "" });

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) {
          setSettings({
            site_name: d.settings.site_name || DEFAULT_SITE_NAME,
            site_logo: d.settings.site_logo || "",
          });
        }
      })
      .catch(() => {});
  }, []);

  const siteName = settings.site_name || DEFAULT_SITE_NAME;
  const isFooter = variant === "footer";

  return (
    <Link href="/" className={`focus-ring inline-flex items-center gap-2 rounded-md ${className}`}>
      {settings.site_logo ? (
        <img
          src={settings.site_logo}
          alt={siteName}
          className={`rounded-md object-contain ${
            isFooter ? "h-11 w-11 bg-white/10 p-1" : "h-10 w-10 border border-border bg-white p-0.5"
          }`}
        />
      ) : (
        <span
          className={`grid place-items-center rounded-md ${
            isFooter
              ? "h-10 w-10 bg-secondary text-secondary-foreground"
              : "h-10 w-10 bg-primary text-primary-foreground shadow-sm"
          }`}
        >
          <Home size={19} aria-hidden="true" />
        </span>
      )}
      <span
        className={`max-w-[9rem] truncate font-extrabold tracking-normal sm:max-w-[14rem] md:max-w-none ${
          isFooter ? "text-lg text-primary-foreground sm:text-xl" : "text-base text-primary sm:text-xl"
        }`}
      >
        {siteName}
      </span>
    </Link>
  );
}
