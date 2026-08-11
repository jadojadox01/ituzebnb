/** Date overlap and availability search for the booking widget. */

export function parseDateOnly(value) {
  const d = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function nightsBetween(checkIn, checkOut) {
  const start = parseDateOnly(checkIn);
  const end = parseDateOnly(checkOut);
  if (!start || !end || end <= start) return 0;
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
}

/** True when ranges [aStart,aEnd) and [bStart,bEnd) overlap (exclusive checkout). */
export function datesOverlap(aStart, aEnd, bStart, bEnd) {
  const a0 = parseDateOnly(aStart);
  const a1 = parseDateOnly(aEnd);
  const b0 = parseDateOnly(bStart);
  const b1 = parseDateOnly(bEnd);
  if (!a0 || !a1 || !b0 || !b1) return false;
  return a0 < b1 && b0 < a1;
}

export function bookingBlocksDates(booking, checkIn, checkOut) {
  if (!booking) return false;
  if (["cancelled", "completed"].includes(String(booking.status || "").toLowerCase())) {
    return false;
  }
  return datesOverlap(booking.check_in, booking.check_out, checkIn, checkOut);
}

export function blockedRangeCovers(block, checkIn, checkOut) {
  if (!block) return false;
  return datesOverlap(block.start_date, block.end_date, checkIn, checkOut);
}

export function totalGuests(adults = 1, children = 0) {
  return Math.max(1, Number(adults || 0) + Number(children || 0));
}

export function roomFitsGuests(room, adults, children) {
  const guests = totalGuests(adults, children);
  return guests <= Number(room.capacity || 1);
}

export function normalizeImages(images) {
  if (Array.isArray(images) && images.length) return images;
  if (typeof images === "string" && images.trim()) {
    return images.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [];
}
