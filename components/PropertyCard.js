import Image from "next/image";
import Link from "next/link";
import { Bath, BedDouble, CalendarCheck, Eye, Heart, MapPin } from "lucide-react";
import { formatRwf } from "@/constants/listings";

const statusStyles = {
  Available: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Reserved: "bg-amber-50 text-amber-700 ring-amber-200",
  Booked: "bg-rose-50 text-rose-700 ring-rose-200",
  Inactive: "bg-slate-100 text-slate-600 ring-slate-200"
};

export function PropertyCard({ listing }) {
  const canBook = listing.status !== "Reserved" && listing.status !== "Booked" && listing.status !== "Inactive";

  return (
    <article className="group overflow-hidden rounded-lg border border-border bg-card shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-smooth">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <Link href={`/houses/${listing.id}`} className="focus-ring absolute inset-0 z-0" aria-label={`View details for ${listing.title}`}>
          <Image
            src={listing.image}
            alt={`${listing.title} exterior`}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        </Link>
        <span className={`absolute left-3 top-3 z-10 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusStyles[listing.status]}`}>
          {listing.status}
        </span>
        <button className="focus-ring absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-md bg-white/95 text-foreground shadow-sm transition hover:text-accent" aria-label={`Save ${listing.title}`}>
          <Heart size={18} aria-hidden="true" />
        </button>
        {canBook ? (
          <Link href={`/houses/${listing.id}`} className="focus-ring absolute bottom-3 left-3 z-10 inline-flex items-center gap-2 rounded-md bg-secondary px-3 py-2 text-sm font-extrabold text-secondary-foreground shadow-sm transition hover:brightness-105">
            <CalendarCheck size={16} aria-hidden="true" />
            Book now
          </Link>
        ) : null}
      </div>

      <div className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold leading-tight">
              <Link href={`/houses/${listing.id}`} className="focus-ring rounded-sm hover:text-primary">
                {listing.title}
              </Link>
            </h3>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin size={15} aria-hidden="true" />
              {listing.address}
            </p>
          </div>
          <span className="shrink-0 rounded-md bg-muted px-2 py-1 text-sm font-semibold text-muted-foreground">
            {listing.rating} rating
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {listing.amenities.map((amenity) => (
            <span key={amenity} className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              {amenity}
            </span>
          ))}
        </div>

        <div className="flex flex-col gap-4 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <BedDouble size={16} aria-hidden="true" />
              {listing.bedrooms}
            </span>
            <span className="flex items-center gap-1.5">
              <Bath size={16} aria-hidden="true" />
              {listing.bathrooms}
            </span>
          </div>
          <p className="text-right">
            <span className="text-lg font-bold">{formatRwf(listing.price)}</span>
            <span className="text-sm text-muted-foreground">/mo</span>
          </p>
        </div>
        <Link href={`/houses/${listing.id}`} className="focus-ring inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-primary/20 px-4 text-sm font-bold text-primary transition hover:bg-primary/10">
          <Eye size={16} aria-hidden="true" />
          View details
        </Link>
      </div>
    </article>
  );
}
