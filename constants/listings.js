export const listings = [
  {
    id: "kigali-garden-villa",
    title: "Kigali Garden Villa",
    district: "Gasabo",
    sector: "Kimironko",
    type: "Villa",
    status: "Available",
    price: 1500000,
    bedrooms: 4,
    bathrooms: 3,
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=80"
    ],
    amenities: ["Garden", "Parking", "Fiber internet"]
  },
  {
    id: "nyarutarama-apartment",
    title: "Nyarutarama View Apartment",
    district: "Gasabo",
    sector: "Nyarutarama",
    type: "Apartment",
    status: "Reserved",
    price: 1050000,
    bedrooms: 3,
    bathrooms: 2,
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1600607687644-c7171b42498b?auto=format&fit=crop&w=1400&q=80"
    ],
    amenities: ["Balcony", "Security", "City view"]
  },
  {
    id: "rebero-family-house",
    title: "Rebero Family House",
    district: "Kicukiro",
    sector: "Gikondo",
    type: "House",
    status: "Available",
    price: 820000,
    bedrooms: 3,
    bathrooms: 2,
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1600566752447-f4b7d27676de?auto=format&fit=crop&w=1400&q=80"
    ],
    amenities: ["Quiet street", "Storage", "Private yard"]
  }
];

export function formatRwf(amount) {
  return `RWF ${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0
  }).format(amount)}`;
}

export const stats = [
  { label: "Verified homes", value: "280+" },
  { label: "Districts covered", value: "12" },
  { label: "Avg. response", value: "18m" }
];
