"use client";

import Link from "next/link";
import { Menu, UserPlus, X, LayoutDashboard } from "lucide-react";
import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/TranslationContext";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { SiteLogo } from "@/components/SiteLogo";

export function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const { t } = useTranslation();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) setUser(d.user);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const navItems = [
    { label: t("navHome"), href: "/" },
    { label: t("navBookNow"), href: "/book" },
    { label: t("navBookRoom"), href: "/houses" },
    { label: t("navAbout"), href: "/about" },
    { label: t("navContact"), href: "/contact" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-2.5 sm:gap-3 sm:px-6 sm:py-3 lg:px-8">
        <div className="min-w-0 flex-1">
          <SiteLogo variant="header" />
        </div>

        <nav aria-label="Main navigation" className="hidden items-center gap-5 lg:gap-7 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="focus-ring whitespace-nowrap rounded-md text-sm font-bold text-foreground/75 transition hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <LanguageSwitch />
          {user ? (
            <>
              <Link
                href={user.role === "admin" ? "/admin/dashboard" : "/dashboard"}
                className="focus-ring hidden items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-bold text-foreground/75 transition hover:border-primary/50 hover:text-primary sm:inline-flex"
              >
                <LayoutDashboard size={15} aria-hidden="true" />
                {t("dashboard")}
              </Link>
              <span className="hidden max-w-[8rem] truncate text-sm font-semibold text-muted-foreground lg:inline">
                {user.name}
              </span>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="focus-ring hidden rounded-md px-4 py-2 text-sm font-bold text-primary transition hover:bg-primary/10 sm:inline-flex"
              >
                {t("signIn")}
              </Link>
              <Link
                href="/register"
                className="focus-ring hidden items-center gap-2 rounded-md bg-secondary px-4 py-2 text-sm font-extrabold text-secondary-foreground shadow-sm transition hover:-translate-y-0.5 hover:brightness-105 sm:inline-flex"
              >
                <UserPlus size={16} aria-hidden="true" />
                {t("createAccount")}
              </Link>
            </>
          )}
          <button
            type="button"
            className="focus-ring grid h-10 w-10 shrink-0 place-items-center rounded-md border border-border bg-card text-primary md:hidden"
            aria-label={isOpen ? t("closeMenu") : t("openMenu")}
            aria-expanded={isOpen}
            onClick={() => setIsOpen((value) => !value)}
          >
            {isOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {isOpen ? (
        <nav
          aria-label="Mobile navigation"
          className="mx-auto grid max-h-[calc(100dvh-3.5rem)] max-w-7xl gap-1 overflow-y-auto border-t border-border px-3 py-3 sm:px-6 md:hidden"
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="focus-ring rounded-md px-3 py-3 text-sm font-bold text-foreground hover:bg-primary/10 hover:text-primary"
              onClick={() => setIsOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          {user ? (
            <>
              <Link
                href={user.role === "admin" ? "/admin/dashboard" : "/dashboard"}
                className="focus-ring rounded-md px-3 py-3 text-sm font-bold text-foreground hover:bg-primary/10 hover:text-primary"
                onClick={() => setIsOpen(false)}
              >
                {t("dashboard")}
              </Link>
              <button
                type="button"
                onClick={async () => {
                  await fetch("/api/auth/logout", { method: "POST" });
                  window.location.href = "/";
                }}
                className="focus-ring rounded-md px-3 py-3 text-left text-sm font-bold text-red-600 hover:bg-red-50"
              >
                {t("logout")}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="focus-ring rounded-md px-3 py-3 text-sm font-bold text-foreground hover:bg-primary/10 hover:text-primary"
                onClick={() => setIsOpen(false)}
              >
                {t("signIn")}
              </Link>
              <Link
                href="/register"
                className="focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-secondary px-3 py-3 text-sm font-extrabold text-secondary-foreground"
                onClick={() => setIsOpen(false)}
              >
                <UserPlus size={16} aria-hidden="true" />
                {t("createAccount")}
              </Link>
            </>
          )}
        </nav>
      ) : null}
    </header>
  );
}
