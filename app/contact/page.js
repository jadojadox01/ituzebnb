import { Mail, MapPin, Phone, Send } from "lucide-react";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata = {
  title: "Contact | ITUZE BNB",
  description: "Contact ITUZE BNB for house rental support in Rwanda."
};

export default function ContactPage() {
  return (
    <main>
      <SiteHeader />
      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
        <div>
          <p className="text-sm font-extrabold uppercase text-primary">Contact</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-normal">Talk to ITUZE BNB.</h1>
          <p className="mt-4 leading-7 text-muted-foreground">Questions about a house, booking request, or landlord access? Send a message and the team can follow up.</p>
          <div className="mt-8 space-y-3 text-sm">
            <p className="flex items-center gap-3"><MapPin className="text-primary" size={18} aria-hidden="true" /> Kigali, Rwanda</p>
            <p className="flex items-center gap-3"><Phone className="text-primary" size={18} aria-hidden="true" /> +250 788 000 000</p>
            <p className="flex items-center gap-3"><Mail className="text-primary" size={18} aria-hidden="true" /> hello@ituzebnb.rw</p>
          </div>
        </div>

        <form className="rounded-lg border border-border bg-card p-5 shadow-smooth" aria-label="Contact form">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold">
              Full name
              <input className="min-h-12 rounded-md border border-input bg-background px-3 font-normal outline-none focus:border-primary" placeholder="Your name" />
            </label>
            <label className="grid gap-2 text-sm font-bold">
              Phone
              <input className="min-h-12 rounded-md border border-input bg-background px-3 font-normal outline-none focus:border-primary" placeholder="+250..." />
            </label>
          </div>
          <label className="mt-4 grid gap-2 text-sm font-bold">
            Email
            <input className="min-h-12 rounded-md border border-input bg-background px-3 font-normal outline-none focus:border-primary" placeholder="you@example.com" />
          </label>
          <label className="mt-4 grid gap-2 text-sm font-bold">
            Message
            <textarea className="min-h-36 rounded-md border border-input bg-background px-3 py-3 font-normal outline-none focus:border-primary" placeholder="How can we help?" />
          </label>
          <button className="focus-ring mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-bold text-primary-foreground">
            <Send size={16} aria-hidden="true" />
            Send message
          </button>
        </form>
      </section>
      <SiteFooter />
    </main>
  );
}
