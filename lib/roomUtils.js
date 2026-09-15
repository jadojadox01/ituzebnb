import { formatMoney, getNightlyPrice, normalizeCurrency } from "@/lib/currency";

export function formatRwf(amount) {
  return formatMoney(amount, "RWF");
}

export { formatMoney };

export function getRoomImages(room) {
  if (!room) return [];
  if (Array.isArray(room.images) && room.images.length > 0) {
    return room.images.filter(Boolean);
  }
  if (typeof room.images === "string" && room.images.trim()) {
    return room.images.split(",").map((i) => i.trim()).filter(Boolean);
  }
  if (room.image) return [room.image];
  return [];
}

export function getRoomPrimaryImage(room) {
  const images = getRoomImages(room);
  return images[0] || null;
}

export function normalizeAmenities(amenities) {
  if (Array.isArray(amenities)) return amenities.filter(Boolean);
  if (typeof amenities === "string" && amenities.trim()) {
    return amenities.split(",").map((a) => a.trim()).filter(Boolean);
  }
  return [];
}

export function normalizeRoomForCard(room) {
  return {
    id: room.id?.toString?.() ?? room.id,
    title: room.title || "Room",
    room_type: room.room_type || room.type,
    price_daily: room.price_daily ?? room.price ?? 0,
    price_monthly: room.price_monthly || 0,
    price_daily_usd: room.price_daily_usd || 0,
    price_monthly_usd: room.price_monthly_usd || 0,
    currency: normalizeCurrency(room.currency || "RWF"),
    status: room.status || "available",
    description: room.description || "",
    beds: room.beds ?? room.bedrooms ?? 1,
    bathrooms: room.bathrooms ?? 1,
    location: room.location || room.address || "",
    capacity: room.capacity || 1,
    amenities: normalizeAmenities(room.amenities),
    images: getRoomImages(room),
  };
}

export function displayRoomPrice(room, currency = "RWF", rwfPerUsd) {
  const amount = getNightlyPrice(room, currency, rwfPerUsd);
  if (amount == null) return formatMoney(room?.price_daily, "RWF");
  return formatMoney(amount, currency);
}

export function isRoomBookable(status) {
  const s = String(status || "").toLowerCase();
  return s === "available";
}

export function collectHeroSlides(rooms = [], ads = []) {
  const activeAds = ads.filter((ad) => Number(ad.active) === 1 && ad.image);
  if (activeAds.length > 0) {
    return activeAds.map((ad) => ({
      image: ad.image,
      title: ad.title || "",
      subtitle: ad.subtitle || "",
      link: ad.link || "",
    }));
  }

  const fromRooms = rooms.flatMap((room) =>
    getRoomImages(room).map((image) => ({
      image,
      title: room.title || "",
      subtitle: room.location || "",
      link: `/houses/${room.id}`,
    }))
  );

  const seen = new Set();
  return fromRooms.filter((slide) => {
    if (!slide.image || seen.has(slide.image)) return false;
    seen.add(slide.image);
    return true;
  });
}

export function collectHeroImages(rooms = [], ads = []) {
  return collectHeroSlides(rooms, ads).map((slide) => slide.image);
}
