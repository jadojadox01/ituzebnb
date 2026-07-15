"use client";

import Link from "next/link";
import { Home, Menu, UserPlus, X } from "lucide-react";
import { useState } from "react";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Book Room", href: "/houses" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" }
];

export function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-primary/20 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="focus-ring flex items-center gap-2 rounded-md">
          <span className="grid h-10 w-10 place-items-center rounded-md bg-primary text-primary-foreground shadow-sm">
            <Home size={19} aria-hidden="true" />
          </span>
          <span className="text-lg font-extrabold tracking-normal text-primary sm:text-xl">ITUZE BNB</span>
        </Link>

        <nav aria-label="Main navigation" className="hidden items-center gap-7 md:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="focus-ring rounded-md text-sm font-bold text-foreground/75 transition hover:text-primary">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/login" className="focus-ring hidden rounded-md px-4 py-2 text-sm font-bold text-primary transition hover:bg-primary/10 sm:inline-flex">
            Sign In
          </Link>
          <Link href="/register" className="focus-ring hidden items-center gap-2 rounded-md bg-secondary px-4 py-2 text-sm font-extrabold text-secondary-foreground shadow-sm transition hover:-translate-y-0.5 hover:brightness-105 sm:inline-flex">
            <UserPlus size={16} aria-hidden="true" />
            Create Account
          </Link>
          <button
            type="button"
            className="focus-ring grid h-10 w-10 place-items-center rounded-md border border-border bg-card text-primary md:hidden"
            aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isOpen}
            onClick={() => setIsOpen((value) => !value)}
          >
            {isOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
        </div>
      </div>
      {isOpen ? (
        <nav aria-label="Mobile navigation" className="mx-auto grid max-w-7xl gap-2 border-t border-border px-4 py-3 sm:px-6 md:hidden">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="focus-ring rounded-md px-3 py-3 text-sm font-bold text-foreground hover:bg-primary/10 hover:text-primary" onClick={() => setIsOpen(false)}>
              {item.label}
            </Link>
          ))}
          <Link href="/login" className="focus-ring rounded-md px-3 py-3 text-sm font-bold text-foreground hover:bg-primary/10 hover:text-primary" onClick={() => setIsOpen(false)}>
            Sign In
          </Link>
          <Link href="/register" className="focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-secondary px-3 py-3 text-sm font-extrabold text-secondary-foreground" onClick={() => setIsOpen(false)}>
            <UserPlus size={16} aria-hidden="true" />
            Create Account
          </Link>
        </nav>
      ) : null}
    </header>
  );
}
