import { Filter, Search } from "lucide-react";
import { PropertyCard } from "@/components/PropertyCard";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { listings } from "@/constants/listings";

export const metadata = {
  title: "Houses | ITUZE BNB",
  description: "Browse available rental houses in Rwanda with RWF pricing."
};

export default function HousesPage() {
  return (
    <main>
      <SiteHeader />
      <section className="border-b border-primary/20 bg-primary px-4 py-12 text-primary-foreground sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-bold uppercase">Houses</p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-normal">Browse verified rentals</h1>
          <p className="mt-3 max-w-2xl text-white/80">Filter by location, budget, bedrooms, room type, and availability.</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-border bg-card p-3 shadow-sm">
          <form className="grid gap-3 md:grid-cols-[1fr_180px_180px_auto]" aria-label="Filter houses">
            <label className="flex min-h-12 items-center gap-3 rounded-md border border-input bg-background px-3">
              <Search size={18} className="text-muted-foreground" aria-hidden="true" />
              <span className="sr-only">Search location</span>
              <input className="w-full bg-transparent text-sm outline-none" placeholder="District, sector, village" />
            </label>
            <select className="min-h-12 rounded-md border border-input bg-background px-3 text-sm outline-none">
              <option>Any type</option>
              <option>Single Room</option>
              <option>Double Room</option>
              <option>Twin Bed Room</option>
            </select>
            <select className="min-h-12 rounded-md border border-input bg-background px-3 text-sm outline-none">
              <option>Available</option>
              <option>Reserved</option>
              <option>Booked</option>
            </select>
            <button className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-secondary px-5 text-sm font-extrabold text-secondary-foreground">
              <Filter size={16} aria-hidden="true" />
              Filter
            </button>
          </form>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <PropertyCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
