import prisma from "@/lib/prisma";
import { calculateBookingAmount } from "@/lib/bookingAmount";
import {
  blockedRangeCovers,
  bookingBlocksDates,
  normalizeImages,
  nightsBetween,
  roomFitsGuests,
  totalGuests,
} from "@/lib/availabilitySearch";
import { isRoomBookable, normalizeRoomStatus } from "@/lib/roomAvailability";

const DEFAULT_TAX_RATE = 0;

export async function getTaxRate() {
  try {
    const row = await prisma.setting.findUnique({ where: { key: "booking_tax_rate" } });
    const rate = Number(row?.value);
    return Number.isFinite(rate) && rate >= 0 ? rate : DEFAULT_TAX_RATE;
  } catch {
    return DEFAULT_TAX_RATE;
  }
}

export function calculatePricing(room, checkIn, checkOut, taxRate = 0) {
  const nights = nightsBetween(checkIn, checkOut);
  const subtotal = calculateBookingAmount(room, checkIn, checkOut);
  const taxAmount = Math.round(subtotal * (Number(taxRate) / 100));
  const total = subtotal + taxAmount;
  return { nights, subtotal, taxAmount, total, pricePerNight: room.price_daily };
}

export async function isRoomAvailableForDates(roomId, checkIn, checkOut) {
  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room) return { available: false, reason: "not_found" };

  const allBookings = await prisma.booking.findMany({
    where: {
      room_id: roomId,
      status: { notIn: ["cancelled", "completed"] },
    },
  });

  const conflict = allBookings.find((b) => bookingBlocksDates(b, checkIn, checkOut));
  if (conflict) {
    return { available: false, reason: "booked", room };
  }

  const blocks = await prisma.blockedDate.findMany({
    where: {
      OR: [{ room_id: roomId }, { room_id: null }],
    },
  });

  const blocked = blocks.find((b) => blockedRangeCovers(b, checkIn, checkOut));
  if (blocked) {
    return { available: false, reason: "blocked", room, block: blocked };
  }

  if (!isRoomBookable(normalizeRoomStatus(room.status))) {
    const hasFutureBooking = allBookings.length > 0;
    if (hasFutureBooking) {
      return { available: false, reason: "unavailable", room };
    }
  }

  return { available: true, room };
}

export async function searchAvailableRooms({
  checkIn,
  checkOut,
  adults = 1,
  children = 0,
  roomsCount = 1,
}) {
  const taxRate = await getTaxRate();
  const guests = totalGuests(adults, children);
  const rooms = await prisma.room.findMany({ orderBy: { price_daily: "asc" } });

  const results = [];

  for (const room of rooms) {
    if (!roomFitsGuests(room, adults, children)) continue;

    const availability = await isRoomAvailableForDates(room.id, checkIn, checkOut);
    if (!availability.available) continue;

    const pricing = calculatePricing(room, checkIn, checkOut, taxRate);
    results.push({
      id: room.id,
      title: room.title,
      room_type: room.room_type,
      location: room.location,
      beds: room.beds,
      bathrooms: room.bathrooms,
      capacity: room.capacity,
      amenities: room.amenities,
      images: normalizeImages(room.images),
      currency: room.currency,
      price_daily: room.price_daily,
      ...pricing,
      guests,
      rooms_count: Math.max(1, Number(roomsCount) || 1),
    });
  }

  return {
    check_in: checkIn,
    check_out: checkOut,
    adults: Number(adults) || 1,
    children: Number(children) || 0,
    rooms_count: Math.max(1, Number(roomsCount) || 1),
    tax_rate: taxRate,
    nights: nightsBetween(checkIn, checkOut),
    rooms: results,
    total_found: results.length,
  };
}
