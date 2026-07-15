import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarCheck, Filter, Home, MapPinned, Search, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { PropertyCard } from "@/components/PropertyCard";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { listings, stats } from "@/constants/listings";

const filters = ["District", "Price", "Bedrooms", "Property Type"];

export default function HomePage() {
  return (
    <main>
      <SiteHeader />

      <section className="relative overflow-hidden border-b border-primary/20 bg-[linear-gradient(180deg,#0071dc_0%,#0053b5_100%)]">
        <div className="absolute inset-x-0 top-0 h-2 bg-secondary" aria-hidden="true" />
        <div className="relative mx-auto grid min-h-[calc(100vh-4.25rem)] max-w-7xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:px-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-sm font-bold text-white shadow-sm backdrop-blur">
              <Home size={16} aria-hidden="true" />
              Rwanda rentals with clear RWF pricing
            </div>
            <h1 className="mt-5 max-w-2xl text-4xl font-extrabold leading-[1.04] tracking-normal text-white sm:text-5xl lg:text-6xl">
              Find your next home faster, cleaner, and with confidence.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-white/90 sm:text-lg">
              Search verified houses, compare monthly rent in RWF, and book available homes from a clean mobile-friendly experience.
            </p>

            <div id="search" className="mt-7 rounded-lg border border-white/25 bg-white p-4 shadow-smooth">
              <form className="grid gap-3 lg:grid-cols-[1.25fr_0.95fr_auto]" aria-label="Search houses">
                <label className="grid gap-1.5 rounded-md border border-input bg-background px-3 py-2">
                  <span className="flex items-center gap-2 text-xs font-extrabold uppercase text-muted-foreground">
                    <Search size={15} aria-hidden="true" />
                    Search by location
                  </span>
                  <input className="min-h-8 w-full bg-transparent text-sm font-semibold outline-none placeholder:font-normal placeholder:text-muted-foreground" placeholder="District, sector, or village" />
                </label>
                <label className="grid gap-1.5 rounded-md border border-input bg-background px-3 py-2">
                  <span className="flex items-center gap-2 text-xs font-extrabold uppercase text-muted-foreground">
                    <SlidersHorizontal size={15} aria-hidden="true" />
                    Maximum budget
                  </span>
                  <select className="min-h-8 w-full bg-transparent text-sm font-semibold outline-none">
                    <option>Any budget</option>
                    <option>Under RWF 500,000</option>
                    <option>RWF 500,000 - 1,000,000</option>
                    <option>RWF 1,000,000+</option>
                  </select>
                </label>
                <button className="focus-ring inline-flex min-h-14 items-center justify-center gap-2 rounded-md bg-secondary px-6 text-sm font-extrabold text-secondary-foreground transition hover:-translate-y-0.5 hover:brightness-105">
                  Search
                  <ArrowRight size={17} aria-hidden="true" />
                </button>
              </form>
            </div>

            <div className="mt-5 grid max-w-xl grid-cols-3 overflow-hidden rounded-lg border border-white bg-white shadow-sm">
              {stats.map((stat) => (
                <div key={stat.label} className="border-r border-border p-3 last:border-r-0 sm:p-4">
                  <p className="text-xl font-extrabold text-primary sm:text-2xl">{stat.value}</p>
                  <p className="mt-1 text-xs font-semibold text-muted-foreground sm:text-sm">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative rounded-xl bg-white/95 p-3 shadow-smooth">
            <div className="overflow-hidden rounded-lg border border-border bg-card">
              <Image
                src="https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=1400&q=80"
                alt="Modern bright rental house living room"
                width={900}
                height={1080}
                priority
                className="aspect-[4/3] h-full w-full object-cover sm:aspect-[5/4] lg:aspect-[5/6]"
              />
            </div>
            <div className="absolute -bottom-5 left-4 right-4 rounded-lg border border-border bg-white p-4 shadow-smooth sm:left-8 sm:right-auto sm:w-80">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-md bg-primary text-primary-foreground">
                  <CalendarCheck size={20} aria-hidden="true" />
                </span>
                <div>
                  <p className="font-bold">Book available homes</p>
                  <p className="text-sm text-muted-foreground">Clear status before you request a visit</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="houses" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-normal text-primary">
              <MapPinned size={16} aria-hidden="true" />
              Featured homes
            </p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-normal sm:text-4xl">A cleaner way to compare homes.</h2>
          </div>
          <div className="flex flex-wrap gap-2" aria-label="Quick filters">
            {filters.map((filter) => (
              <button key={filter} className="focus-ring inline-flex h-10 items-center gap-2 rounded-md border border-border bg-card px-3 text-sm font-semibold transition hover:border-primary/50 hover:text-primary">
                <Filter size={15} aria-hidden="true" />
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <PropertyCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-card">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <h2 className="text-3xl font-extrabold tracking-normal">Ready to find your next place?</h2>
            <p className="mt-3 leading-7 text-muted-foreground">
              Create an account to save houses, request bookings, and keep your rental search organized.
            </p>
            <Link href="/register" className="focus-ring mt-5 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition hover:-translate-y-0.5">
              Create account
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              "Save favorite homes",
              "Request a booking",
              "Contact property owners"
            ].map((item) => (
              <div key={item} className="rounded-lg border border-border bg-background p-4">
                <ShieldCheck className="text-primary" size={20} aria-hidden="true" />
                <p className="mt-3 font-semibold">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
