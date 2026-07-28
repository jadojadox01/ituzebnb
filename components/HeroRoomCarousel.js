"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { collectHeroImages } from "@/lib/roomUtils";

export default function HeroRoomCarousel() {
  const [images, setImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    Promise.all([
      fetch("/api/hero-ads").then((r) => r.json()),
      fetch("/api/rooms").then((r) => r.json()),
    ]).then(([adsData, roomsData]) => {
      const heroImages = collectHeroImages(roomsData.rooms || [], adsData.ads || []);
      setImages(heroImages);
    });
  }, []);

  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [images.length]);

  if (images.length === 0) {
    return (
      <div className="flex h-full min-h-[280px] items-center justify-center rounded-2xl bg-muted text-sm font-medium text-muted-foreground">
        Add rooms or hero ads in admin to showcase your B&amp;B
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <div className="relative h-full min-h-[280px] w-full overflow-hidden rounded-2xl border border-white/20 bg-card shadow-2xl">
        {images.map((src, index) => (
          <div
            key={`${src}-${index}`}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              index === currentImageIndex ? "opacity-100" : "opacity-0"
            }`}
          >
            <Image
              src={src}
              alt={`Property photo ${index + 1}`}
              fill
              priority={index === 0}
              className="h-full w-full object-cover"
              quality={90}
            />
          </div>
        ))}
      </div>
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
          {images.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setCurrentImageIndex(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentImageIndex ? "w-7 bg-secondary" : "w-2 bg-white/50 hover:bg-white/80"
              }`}
              aria-label={`Show photo ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
