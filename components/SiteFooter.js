import Link from "next/link";
import { Facebook, Home, Instagram, Mail, MapPin, Phone, Twitter } from "lucide-react";

const footerLinks = [
  { label: "Home", href: "/" },
  { label: "Houses", href: "/houses" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" }
];

export function SiteFooter() {
  return (
    <footer className="border-t border-primary/20 bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.2fr_0.8fr_1fr] lg:px-8">
        <div>
          <Link href="/" className="focus-ring inline-flex items-center gap-2 rounded-md">
            <span className="grid h-10 w-10 place-items-center rounded-md bg-secondary text-secondary-foreground">
              <Home size={19} aria-hidden="true" />
            </span>
            <span className="text-xl font-extrabold">ITUZE BNB</span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-6 text-white/80">
            A Rwanda-first rental platform for browsing verified houses, comparing availability, and booking with confidence.
          </p>
        </div>

        <nav aria-label="Footer navigation">
          <p className="font-bold">Menu</p>
          <div className="mt-3 grid gap-2">
            {footerLinks.map((link) => (
              <Link key={link.href} href={link.href} className="focus-ring w-fit rounded-md text-sm text-white/80 transition hover:text-secondary">
                {link.label}
              </Link>
            ))}
          </div>
        </nav>

        <div>
          <p className="font-bold">Contact</p>
          <div className="mt-3 space-y-2 text-sm text-white/80">
            <p className="flex items-center gap-2"><MapPin size={16} aria-hidden="true" /> Kigali, Rwanda</p>
            <p className="flex items-center gap-2"><Phone size={16} aria-hidden="true" /> +250 788 000 000</p>
            <p className="flex items-center gap-2"><Mail size={16} aria-hidden="true" /> ituzeairbnb@gmail.com</p>
          </div>
          <div className="mt-4 flex gap-2">
            {[Facebook, Instagram, Twitter].map((Icon, index) => (
              <a key={index} href="#" className="focus-ring grid h-9 w-9 place-items-center rounded-md bg-white/10 transition hover:bg-secondary hover:text-secondary-foreground" aria-label="Social link">
                <Icon size={16} aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-white/20 px-4 py-4 text-center text-sm text-white/70">
        (c) 2026 ITUZE BNB. All rights reserved.
      </div>
    </footer>
  );
}
