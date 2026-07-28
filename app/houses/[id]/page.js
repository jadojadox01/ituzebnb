"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Bath, BedDouble, MapPin, ShieldCheck } from "lucide-react";
import { HouseMediaGallery } from "@/components/HouseMediaGallery";
import { BookingWizard } from "@/components/BookingWizard";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { useTranslation } from "@/lib/TranslationContext";
import { tRoomType, tStatus } from "@/lib/i18n";

function formatRwf(amount) {
  return `RWF ${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(amount)}`;
}

function normalizeImages(images) {
  if (Array.isArray(images) && images.length > 0) return images;
  if (typeof images === "string" && images) return images.split(",").map(i => i.trim());
  return [];
}

export default function HouseDetailsPage() {
  const { t } = useTranslation();
  const params = useParams();
  const [listing, setListing] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => {
      if (d.user) setUser(d.user);
    }).catch(() => {});

    fetch(`/api/rooms/${params.id}`).then(r => r.json()).then(d => {
      if (d.room) {
        setListing(d.room);
      } else {
        // Fallback: try fetching all rooms and find by id
        fetch("/api/rooms").then(r => r.json()).then(all => {
          const found = all.rooms?.find(r => r.id.toString() === params.id || r.id === params.id);
          if (found) setListing(found);
        });
      }
    }).finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <main>
        <SiteHeader />
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
        <SiteFooter />
      </main>
    );
  }

  if (!listing) {
    return (
      <main>
        <SiteHeader />
        <div className="mx-auto max-w-7xl px-4 py-16 text-center">
          <h1 className="text-2xl font-extrabold">{t("roomNotFound")}</h1>
          <p className="mt-2 text-muted-foreground">{t("roomNotFoundText")}</p>
          <Link href="/houses" className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">{t("heroBrowseRooms")}</Link>
        </div>
        <SiteFooter />
      </main>
    );
  }

  const images = normalizeImages(listing.images);
  const galleryImages = images.length > 0 ? images : [];
  const status = listing.status || "available";
  const canBook = status !== "reserved" && status !== "booked" && status !== "Reserved" && status !== "Booked";
  const bedrooms = listing.bedrooms || listing.beds || 1;
  const bathrooms = listing.bathrooms || 1;
  const address = listing.address || listing.location || "Kigali, Rwanda";
  const price = listing.price || listing.price_daily || 0;
  const roomType = listing.type || listing.room_type || "Room";

  return (
    <main>
      <SiteHeader />
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/houses" className="focus-ring inline-flex items-center gap-2 rounded-md text-sm font-bold text-primary">
          <ArrowLeft size={16} aria-hidden="true" />
          {t("roomBackToHouses")}
        </Link>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:gap-8">
          <div className="min-w-0">
            <HouseMediaGallery listing={{ ...listing, images: galleryImages }} canBook={canBook} />
            <div className="mt-6">
              <p className="text-sm font-extrabold uppercase text-primary capitalize">{tRoomType(roomType, t)}</p>
              <h1 className="mt-2 text-2xl font-extrabold tracking-normal break-safe sm:text-3xl lg:text-4xl">{listing.title}</h1>
              <p className="mt-3 flex items-start gap-2 text-sm text-muted-foreground sm:text-base">
                <MapPin size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
                <span className="break-safe">{address}</span>
              </p>
              <p className="mt-5 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
                {listing.description || "A verified rental home with clear daily pricing, useful amenities, and a simple path to request a booking."}
              </p>
              {listing.amenities && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {(Array.isArray(listing.amenities) ? listing.amenities : typeof listing.amenities === "string" ? listing.amenities.split(",").map(a => a.trim()) : []).map((amenity) => (
                    <span key={amenity} className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">{amenity}</span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <aside className="h-fit rounded-lg border border-border bg-card p-4 shadow-smooth sm:p-5 lg:sticky lg:top-24">
            <p className="text-sm font-bold text-muted-foreground">{t("roomDailyRate")}</p>
            <p className="mt-1 text-3xl font-extrabold text-primary">{formatRwf(price)}</p>
            {listing.price_monthly > 0 && (
              <p className="text-sm text-muted-foreground">{t("roomMonthly")} {formatRwf(listing.price_monthly)}</p>
            )}

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-muted p-4">
                <BedDouble className="text-primary" size={20} aria-hidden="true" />
                <p className="mt-2 font-bold">{bedrooms} {bedrooms > 1 ? t("beds") : t("bed")}</p>
              </div>
              <div className="rounded-lg bg-muted p-4">
                <Bath className="text-primary" size={20} aria-hidden="true" />
                <p className="mt-2 font-bold">{bathrooms} {bathrooms > 1 ? t("bathrooms") : t("bathroom")}</p>
              </div>
            </div>

            <div className="mt-5 rounded-lg border border-primary/20 bg-primary/5 p-4">
              <p className="flex items-center gap-2 font-bold">
                <ShieldCheck className="text-primary" size={18} aria-hidden="true" />
                {t("roomStatusLabel")} {tStatus(status, t)}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {user ? t("roomBookLoggedIn") : t("roomBookGuest")}
              </p>
            </div>

            {canBook && <BookingWizard listing={listing} user={user} price={price} />}

            {!canBook && (
              <p className="mt-5 rounded-md bg-muted px-4 py-3 text-center text-sm font-bold text-muted-foreground">
                {t("roomCurrently", { status: tStatus(status, t) })}
              </p>
            )}
          </aside>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}