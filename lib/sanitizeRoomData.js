function toInt(value, fallback = 0) {
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}

function toFloat(value, fallback = 0) {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : fallback;
}

/** Whitelist + coerce room fields for create/update (never pass id/timestamps/relations). */
export function sanitizeRoomData(data = {}) {
  return {
    title: String(data.title || "").trim(),
    room_type: String(data.room_type || "single").trim().toLowerCase(),
    price_daily: toFloat(data.price_daily, 0),
    price_monthly: toFloat(data.price_monthly, 0),
    currency: String(data.currency || "RWF").trim().toUpperCase(),
    status: (() => {
      const value = String(data.status || "available").trim().toLowerCase();
      const allowed = new Set(["available", "reserved", "booked", "unavailable"]);
      return allowed.has(value) ? value : "available";
    })(),
    description: String(data.description || ""),
    beds: toInt(data.beds, 1),
    bathrooms: toInt(data.bathrooms, 1),
    location: String(data.location || ""),
    capacity: toInt(data.capacity, 1),
    amenities: String(data.amenities || ""),
    images: String(data.images || ""),
    video_url: String(data.video_url || ""),
  };
}
