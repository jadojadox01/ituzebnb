export const listings = [
  {
    id: "single-room",
    title: "Single Room",
    district: "Gasabo",
    sector: "Kimironko",
    address: "KG 140B St, Kibagabaga",
    type: "Single Room",
    status: "Available",
    price: 22000,
    bedrooms: 1,
    bathrooms: 1,
    rating: 4.9,
    image: "/images/single (2).jpeg",
    images: [
      "/images/single (2).jpeg"
    ],
    amenities: ["Wi-Fi", "Private bathroom", "Daily cleaning"]
  },
  {
    id: "double-room",
    title: "Double Room",
    district: "Gasabo",
    sector: "Nyarutarama",
    address: "KG 140B St, Kibagabaga",
    type: "Double Room",
    status: "Available",
    price: 32000,
    bedrooms: 1,
    bathrooms: 1,
    rating: 4.8,
    image: "/images/double_room.jpeg",
    images: [
      "/images/double_room.jpeg"
    ],
    amenities: ["Wi-Fi", "Double bed", "City view"]
  },
  {
    id: "twin-bed-room",
    title: "Twin Bed Room",
    district: "Kicukiro",
    sector: "Gikondo",
    address: "KG 140B St, Kibagabaga",
    type: "Twin Bed Room",
    status: "Reserved",
    price: 28000,
    bedrooms: 1,
    bathrooms: 1,
    rating: 4.7,
    image: "/images/twin_room.jpeg",
    images: [
      "/images/twin_room.jpeg"
    ],
    amenities: ["Wi-Fi", "Twin beds", "Quiet street"]
  }
];

export function formatRwf(amount) {
  return `RWF ${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0
  }).format(amount)}`;
}

export const stats = [
  { label: "Verified rooms", value: "280+" },
  { label: "Districts covered", value: "12" },
  { label: "Avg. response", value: "18m" }
];
