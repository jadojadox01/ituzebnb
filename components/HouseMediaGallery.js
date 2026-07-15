"use client";

import Image from "next/image";
import Link from "next/link";
import { CalendarCheck, ChevronLeft, ChevronRight, Expand, Play, X } from "lucide-react";
import { useState } from "react";

export function HouseMediaGallery({ listing, canBook }) {
  const images = listing.images?.length ? listing.images : [listing.image];
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const activeImage = images[activeIndex];

  function showPrevious() {
    setActiveIndex((index) => (index === 0 ? images.length - 1 : index - 1));
  }

  function showNext() {
    setActiveIndex((index) => (index === images.length - 1 ? 0 : index + 1));
  }

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-lg border border-border bg-muted shadow-smooth">
        <button type="button" onClick={() => setIsFullscreen(true)} className="focus-ring block w-full" aria-label={`Open ${listing.title} image fullscreen`}>
          <Image
            src={activeImage}
            alt={`${listing.title} photo ${activeIndex + 1}`}
            width={1200}
            height={820}
            priority
            className="aspect-[16/10] w-full object-cover"
          />
        </button>
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-black/60 to-transparent p-4">
          {canBook ? (
            <Link href="/register" className="focus-ring inline-flex items-center gap-2 rounded-md bg-secondary px-4 py-3 text-sm font-extrabold text-secondary-foreground shadow-sm transition hover:brightness-105">
              <CalendarCheck size={16} aria-hidden="true" />
              Book now
            </Link>
          ) : (
            <span className="rounded-md bg-white/95 px-4 py-3 text-sm font-bold text-muted-foreground">
              {listing.status}
            </span>
          )}
          <div className="flex gap-2">
            <button type="button" onClick={() => setIsFullscreen(true)} className="focus-ring grid h-10 w-10 place-items-center rounded-md bg-white text-primary shadow-sm" aria-label="Open image fullscreen">
              <Expand size={18} aria-hidden="true" />
            </button>
            <button type="button" onClick={showPrevious} className="focus-ring grid h-10 w-10 place-items-center rounded-md bg-white text-primary shadow-sm" aria-label="Show previous image">
              <ChevronLeft size={20} aria-hidden="true" />
            </button>
            <button type="button" onClick={showNext} className="focus-ring grid h-10 w-10 place-items-center rounded-md bg-white text-primary shadow-sm" aria-label="Show next image">
              <ChevronRight size={20} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {images.map((image, index) => (
          <button
            key={image}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={`focus-ring relative overflow-hidden rounded-md border bg-muted ${activeIndex === index ? "border-primary" : "border-border"}`}
            aria-label={`Show image ${index + 1}`}
          >
            <Image src={image} alt={`${listing.title} thumbnail ${index + 1}`} width={260} height={170} className="aspect-[4/3] w-full object-cover" />
          </button>
        ))}
      </div>

      <button type="button" className="focus-ring flex w-full items-center justify-between rounded-lg border border-border bg-card p-4 text-left shadow-sm transition hover:border-primary/40">
        <span>
          <span className="block font-extrabold">Video tour</span>
          <span className="mt-1 block text-sm text-muted-foreground">Preview placeholder for a future property walkthrough.</span>
        </span>
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground">
          <Play size={18} fill="currentColor" aria-hidden="true" />
        </span>
      </button>

      {isFullscreen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/90 p-4" role="dialog" aria-modal="true" aria-label={`${listing.title} fullscreen image`}>
          <button type="button" onClick={() => setIsFullscreen(false)} className="focus-ring absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-md bg-white text-foreground shadow-sm" aria-label="Close fullscreen image">
            <X size={22} aria-hidden="true" />
          </button>
          <button type="button" onClick={showPrevious} className="focus-ring absolute left-4 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-md bg-white text-primary shadow-sm" aria-label="Show previous image">
            <ChevronLeft size={22} aria-hidden="true" />
          </button>
          <Image
            src={activeImage}
            alt={`${listing.title} fullscreen photo ${activeIndex + 1}`}
            width={1500}
            height={1000}
            className="max-h-[86vh] w-auto max-w-full rounded-lg object-contain"
          />
          <button type="button" onClick={showNext} className="focus-ring absolute right-4 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-md bg-white text-primary shadow-sm" aria-label="Show next image">
            <ChevronRight size={22} aria-hidden="true" />
          </button>
          <p className="absolute bottom-4 rounded-full bg-white/90 px-4 py-2 text-sm font-bold text-foreground">
            {activeIndex + 1} / {images.length}
          </p>
        </div>
      ) : null}
    </div>
  );
}
