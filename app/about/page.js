import { CheckCircle2, Home, MessageCircle } from "lucide-react";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata = {
  title: "About | ITUZE BNB",
  description: "Learn about ITUZE BNB's Rwanda-first house rental platform."
};

export default function AboutPage() {
  return (
    <main>
      <SiteHeader />
      <section className="bg-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="text-sm font-extrabold uppercase text-primary">About ITUZE BNB</p>
            <h1 className="mt-3 text-4xl font-extrabold tracking-normal sm:text-5xl">A rental platform designed for Rwanda.</h1>
          </div>
          <div className="space-y-5 text-lg leading-8 text-muted-foreground">
            <p>ITUZE BNB helps tenants discover homes with clear pricing in RWF, reliable availability, and a booking flow that feels simple from phone to desktop.</p>
            <p>Our goal is simple: make rental search feel organized, trustworthy, and easy to use on any device.</p>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-muted/60 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-3">
          {[
            { icon: CheckCircle2, title: "Verified listings", text: "Homes presented with availability, location, and monthly rent clarity." },
            { icon: Home, title: "Easy browsing", text: "Compare houses, apartments, and villas without losing the details that matter." },
            { icon: MessageCircle, title: "Simple contact", text: "Ask questions and start a booking conversation from the listing experience." }
          ].map((item) => (
            <article key={item.title} className="rounded-lg border border-border bg-card p-5 shadow-sm">
              <item.icon className="text-primary" size={24} aria-hidden="true" />
              <h2 className="mt-4 text-xl font-extrabold">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p>
            </article>
          ))}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
