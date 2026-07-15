"use client";

import Image from "next/image";
import { CalendarCheck } from "lucide-react";
import { useEffect, useState } from "react";

const heroImages = [
  "/images/background1.jpeg",
  "/images/background2.jpeg",
  "/images/background3.jpeg",
  "/images/background4.jpeg"
];

const INTERVAL_MS = 5000;

function CarouselSlides({ activeIndex, className, imageClassName, sizes }) {
  return heroImages.map((src, index) => {
    const isActive = index === activeIndex;

    return (
      <div
        key={src}
        className={`absolute inset-0 transition-opacity duration-[1400ms] ease-in-out ${
          isActive ? "opacity-100" : "opacity-0"
        }`}
      >
        <Image
          src={src}
          alt=""
          fill
          priority={index === 0}
          sizes={sizes}
          className={`${className} ${imageClassName} ${
            isActive ? "scale-105" : "scale-100"
          }`}
        />
      </div>
    );
  });
}

export function HeroSection({ children }) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((current) => (current + 1) % heroImages.length);
    }, INTERVAL_MS);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative overflow-hidden border-b border-primary/20">
      <div className="absolute inset-0" aria-hidden="true">
        <CarouselSlides
          activeIndex={activeIndex}
          className="object-cover transition-transform duration-[7000ms] ease-out"
          imageClassName=""
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/15 to-transparent" />
      </div>

      <div className="absolute inset-x-0 top-0 z-10 h-2 bg-secondary" aria-hidden="true" />

      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-4.25rem)] max-w-7xl items-center gap-8 px-4 py-12 pb-16 sm:px-6 lg:grid-cols-[1.1fr_0.75fr] lg:gap-10 lg:px-8">
        {children}

        <div className="mx-auto w-full max-w-sm lg:max-w-none">
          <div className="overflow-hidden rounded-xl border border-white/40 bg-white/95 p-2 shadow-smooth backdrop-blur-sm">
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
              <CarouselSlides
                activeIndex={activeIndex}
                className="object-cover transition-transform duration-[7000ms] ease-out"
                imageClassName=""
                sizes="(min-width: 1024px) 30vw, 80vw"
              />
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-white/40 bg-white/95 p-4 shadow-smooth backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground">
                <CalendarCheck size={18} aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-bold text-foreground">Book available rooms</p>
                <p className="text-xs text-muted-foreground">Clear status before you request a visit</p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-center gap-2">
            {heroImages.map((src, index) => (
              <button
                key={src}
                type="button"
                aria-label={`Show background image ${index + 1}`}
                onClick={() => setActiveIndex(index)}
                className={`h-2 rounded-full transition-all duration-500 ${
                  index === activeIndex
                    ? "w-7 bg-secondary"
                    : "w-2 bg-white/60 hover:bg-white"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
