"use client";

import Image from "next/image";
import Link from "next/link";
import { Bath, BedDouble, CalendarCheck, MapPin, Users } from "lucide-react";
import { useState } from "react";
import { formatRwf, isRoomBookable, normalizeRoomForCard } from "@/lib/roomUtils";
import { useTranslation } from "@/lib/TranslationContext";
import { tRoomType, tStatus } from "@/lib/i18n";

const statusStyles = {
  available: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  reserved: "bg-amber-100 text-amber-800 ring-amber-200",
  booked: "bg-rose-100 text-rose-800 ring-rose-200",
};

export function PropertyCard({ listing }) {
  const { t } = useTranslation();
  const [imgError, setImgError] = useState(false);
  const room = normalizeRoomForCard(listing);
  const imageUrl = room.images[0];
  const statusKey = String(room.status || "available").toLowerCase();
  const canBook = isRoomBookable(room.status);

  return (
    <article className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-smooth">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <Link href={`/houses/${room.id}`} className="focus-ring absolute inset-0 z-0" aria-label={`View ${room.title}`}>
          {imageUrl && !imgError ? (
            <Image
              src={imageUrl}
              alt={room.title}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-muted text-muted-foreground">
              <BedDouble size={48} />
            </div>
          )}
        </Link>
        <span className={`absolute left-3 top-3 z-10 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusStyles[statusKey] || "bg-gray-100 text-gray-700"}`}>
          {tStatus(room.status, t)}
        </span>
        {canBook && (
          <Link
            href={`/houses/${room.id}`}
            className="focus-ring absolute bottom-3 right-3 z-10 inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-bold text-secondary-foreground shadow-lg transition hover:brightness-105"
          >
            <CalendarCheck size={16} aria-hidden="true" />
            {t("bookNow")}
          </Link>
        )}
      </div>

      <div className="space-y-4 p-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-accent">{tRoomType(room.room_type, t)}</p>
          <h3 className="mt-1 text-xl font-semibold leading-tight">
            <Link href={`/houses/${room.id}`} className="focus-ring rounded-sm hover:text-primary">
              {room.title}
            </Link>
          </h3>
          {room.location ? (
            <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin size={15} aria-hidden="true" />
              {room.location}
            </p>
          ) : null}
        </div>

        {room.amenities.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {room.amenities.slice(0, 3).map((amenity) => (
              <span key={amenity} className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                {amenity}
              </span>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><BedDouble size={16} />{room.beds}</span>
            <span className="flex items-center gap-1.5"><Bath size={16} />{room.bathrooms}</span>
            <span className="flex items-center gap-1.5"><Users size={16} />{room.capacity}</span>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-lg font-bold text-primary">{formatRwf(room.price_daily)}</p>
            <p className="text-xs text-muted-foreground">{t("perNight")}</p>
          </div>
        </div>
      </div>
    </article>
  );
}
