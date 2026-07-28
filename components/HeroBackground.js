"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { collectHeroImages } from "@/lib/roomUtils";

export default function HeroBackground() {
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
    }, 6000);
    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {images.length > 0 ? (
        images.map((image, index) => (
          <div
            key={`${image}-${index}`}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentImageIndex ? "opacity-100" : "opacity-0"
            }`}
          >
            <Image
              src={image}
              alt=""
              fill
              priority={index === 0}
              className="object-cover"
              quality={90}
            />
          </div>
        ))
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-accent to-primary/80" />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0f2f28]/88 via-[#0f2f28]/62 to-[#0f2f28]/48" />
    </div>
  );
}
