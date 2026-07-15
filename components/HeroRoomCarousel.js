'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

export default function HeroRoomCarousel() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const roomImages = [
    {
      src: '/images/background1.jpeg',
      alt: 'Background 1',
    },
    {
      src: '/images/background2.jpeg',
      alt: 'Background 2',
    },
    {
      src: '/images/background3.jpeg',
      alt: 'Background 3',
    },
    {
      src: '/images/background4.jpeg',
      alt: 'Background 4',
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % roomImages.length);
    }, 4000); // Change image every 4 seconds

    return () => clearInterval(interval);
  }, [roomImages.length]);

  return (
    <div className="relative h-full w-full">
      <div className="relative h-full w-full overflow-hidden rounded-lg border border-border bg-card">
        {roomImages.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              index === currentImageIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              priority={index === 0}
              className="h-full w-full object-cover"
              quality={90}
            />
          </div>
        ))}
      </div>

      {/* Image indicators */}
      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
        {roomImages.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentImageIndex(index)}
            className={`h-2 rounded-full transition-all ${
              index === currentImageIndex
                ? 'w-6 bg-white shadow-lg'
                : 'w-2 bg-white/50 hover:bg-white/70'
            }`}
            aria-label={`Show image ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
