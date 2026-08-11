"use client";

import Image from "next/image";
import Link from "next/link";
import { Bath, BedDouble, MapPin, Users } from "lucide-react";
import { useTranslation } from "@/lib/TranslationContext";
import { formatRwf } from "@/lib/roomUtils";
import { tRoomType } from "@/lib/i18n";

function RoomCard({ room, searchParams, onSelect }) {
  const { t, language } = useTranslation();
  const image = room.images?.[0] || "/images/background1.jpeg";
  const qs = new URLSearchParams({
    ...searchParams,
    room_id: String(room.id),
  }).toString();

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:shadow-md">
      <div className="relative aspect-[16/10] bg-muted">
        <Image src={image} alt={room.title} fill className="object-cover" sizes="(min-width:768px) 50vw, 100vw" />
      </div>
      <div className="p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-primary">
              {tRoomType(room.room_type, language)}
            </p>
            <h3 className="mt-1 text-lg font-extrabold">{room.title}</h3>
            {room.location ? (
              <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin size={14} aria-hidden="true" /> {room.location}
              </p>
            ) : null}
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">{t("widgetPerNight")}</p>
            <p className="text-lg font-extrabold text-primary">{formatRwf(room.price_daily)}</p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <BedDouble size={14} /> {room.beds} {t("beds")}
          </span>
          <span className="inline-flex items-center gap-1">
            <Bath size={14} /> {room.bathrooms} {t("baths")}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users size={14} /> {t("guestsCount", { count: room.capacity })}
          </span>
        </div>

        <div className="mt-4 rounded-xl bg-muted/50 p-3 text-sm">
          <div className="flex justify-between">
            <span>{t("widgetNights", { count: room.nights })}</span>
            <span>{formatRwf(room.subtotal)}</span>
          </div>
          {room.taxAmount > 0 && (
            <div className="mt-1 flex justify-between text-muted-foreground">
              <span>{t("widgetTaxes")}</span>
              <span>{formatRwf(room.taxAmount)}</span>
            </div>
          )}
          <div className="mt-2 flex justify-between border-t border-border pt-2 font-bold">
            <span>{t("widgetTotal")}</span>
            <span className="text-primary">{formatRwf(room.total)}</span>
          </div>
        </div>

        {onSelect ? (
          <button
            type="button"
            onClick={() => onSelect(room)}
            className="focus-ring mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground"
          >
            {t("widgetContinueBooking")}
          </button>
        ) : (
          <Link
            href={`/book?${qs}&step=checkout`}
            className="focus-ring mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground"
          >
            {t("widgetContinueBooking")}
          </Link>
        )}
      </div>
    </article>
  );
}

export function BookingSearchResults({ results, loading, error, searchParams, onSelectRoom }) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm font-semibold text-red-700">
        {error}
      </div>
    );
  }

  if (!results) return null;

  if (!results.rooms?.length) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <p className="text-lg font-bold">{t("widgetNoRooms")}</p>
        <p className="mt-2 text-sm text-muted-foreground">{t("widgetNoRoomsHint")}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-xl font-extrabold">{t("widgetAvailableRooms")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("widgetResultsCount", { count: results.total_found })} · {results.nights}{" "}
            {results.nights === 1 ? t("widgetNight") : t("widgetNightsLabel")}
          </p>
        </div>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        {results.rooms.map((room) => (
          <RoomCard
            key={room.id}
            room={room}
            searchParams={searchParams}
            onSelect={onSelectRoom}
          />
        ))}
      </div>
    </div>
  );
}
