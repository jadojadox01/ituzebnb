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
  const currency = (() => {
    const value = String(data.currency || "RWF").trim().toUpperCase();
    return value === "USD" || value === "RWF" ? value : "RWF";
  })();

  return {
    title: String(data.title || "").trim(),
    room_type: String(data.room_type || "single").trim().toLowerCase(),
    price_daily: toFloat(data.price_daily, 0),
    price_monthly: toFloat(data.price_monthly, 0),
    price_daily_usd: toFloat(data.price_daily_usd, 0),
    price_monthly_usd: toFloat(data.price_monthly_usd, 0),
    currency,
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
