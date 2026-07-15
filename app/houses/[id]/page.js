import Link from "next/link";
import { ArrowLeft, Bath, BedDouble, CalendarCheck, MapPin, ShieldCheck } from "lucide-react";
import { HouseMediaGallery } from "@/components/HouseMediaGallery";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { formatRwf, listings } from "@/constants/listings";

export function generateStaticParams() {
  return listings.map((listing) => ({ id: listing.id }));
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const listing = listings.find((item) => item.id === id);

  return {
    title: listing ? `${listing.title} | ITUZE BNB` : "House | ITUZE BNB",
    description: listing ? `${listing.title} in ${listing.sector}, ${listing.district}.` : "House details on ITUZE BNB."
  };
}

export default async function HouseDetailsPage({ params }) {
  const { id } = await params;
  const listing = listings.find((item) => item.id === id) || listings[0];
  const canBook = listing.status !== "Reserved" && listing.status !== "Booked" && listing.status !== "Inactive";

  return (
    <main>
      <SiteHeader />
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/houses" className="focus-ring inline-flex items-center gap-2 rounded-md text-sm font-bold text-primary">
          <ArrowLeft size={16} aria-hidden="true" />
          Back to houses
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <HouseMediaGallery listing={listing} canBook={canBook} />
            <div className="mt-6">
              <p className="text-sm font-extrabold uppercase text-primary">{listing.type}</p>
              <h1 className="mt-2 text-4xl font-extrabold tracking-normal">{listing.title}</h1>
              <p className="mt-3 flex items-center gap-2 text-muted-foreground">
                <MapPin size={18} aria-hidden="true" />
                {listing.sector}, {listing.district}, Rwanda
              </p>
              <p className="mt-5 max-w-3xl leading-7 text-muted-foreground">
                A verified rental home with clear monthly pricing, useful amenities, and a simple path to request a booking.
              </p>
            </div>
          </div>

          <aside className="h-fit rounded-lg border border-border bg-card p-5 shadow-smooth">
            <p className="text-sm font-bold text-muted-foreground">Monthly rent</p>
            <p className="mt-1 text-3xl font-extrabold text-primary">{formatRwf(listing.price)}</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-muted p-4">
                <BedDouble className="text-primary" size={20} aria-hidden="true" />
                <p className="mt-2 font-bold">{listing.bedrooms} Bedrooms</p>
              </div>
              <div className="rounded-lg bg-muted p-4">
                <Bath className="text-primary" size={20} aria-hidden="true" />
                <p className="mt-2 font-bold">{listing.bathrooms} Bathrooms</p>
              </div>
            </div>
            <div className="mt-5 rounded-lg border border-primary/20 bg-primary/5 p-4">
              <p className="flex items-center gap-2 font-bold">
                <ShieldCheck className="text-primary" size={18} aria-hidden="true" />
                Status: {listing.status}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Create an account to request booking and save this home.</p>
            </div>
            {canBook ? (
              <Link href="/register" className="focus-ring mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-secondary px-5 text-sm font-extrabold text-secondary-foreground">
                <CalendarCheck size={16} aria-hidden="true" />
                Book now
              </Link>
            ) : (
              <p className="mt-5 rounded-md bg-muted px-4 py-3 text-center text-sm font-bold text-muted-foreground">
                This house is currently {listing.status.toLowerCase()}.
              </p>
            )}
          </aside>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
