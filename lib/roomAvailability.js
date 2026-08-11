import prisma from "@/lib/prisma";

const STALE_RESERVED_MS = 2 * 60 * 60 * 1000; // 2 hours

export function normalizeRoomStatus(status) {
  return String(status || "available").trim().toLowerCase();
}

export function isRoomBookable(status) {
  const normalized = normalizeRoomStatus(status);
  return normalized === "available";
}

async function findBlockingBooking(roomId) {
  return prisma.booking.findFirst({
    where: {
      room_id: roomId,
      status: { notIn: ["cancelled", "completed"] },
    },
    orderBy: { created_at: "desc" },
  });
}

/**
 * Only clears orphaned system "reserved" holds (no active booking + old enough).
 * Never clears admin "unavailable" or "booked".
 */
export async function releaseStaleRoomReservation(roomId) {
  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room || normalizeRoomStatus(room.status) !== "reserved") return room;

  const blocking = await findBlockingBooking(roomId);
  if (blocking) return room;

  const ageMs = Date.now() - new Date(room.updated_at || room.created_at || 0).getTime();
  if (!Number.isFinite(ageMs) || ageMs < STALE_RESERVED_MS) {
    return room;
  }

  return prisma.room.update({
    where: { id: roomId },
    data: { status: "available" },
  });
}

export async function getBookableRoom(roomId) {
  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room) {
    return { error: "Room not found", status: 404 };
  }

  const status = normalizeRoomStatus(room.status);

  if (status === "unavailable") {
    return { error: "Room is not available", status: 400 };
  }

  if (status === "booked") {
    const paidBooking = await prisma.booking.findFirst({
      where: {
        room_id: roomId,
        payment_status: "paid",
        status: { in: ["pending", "confirmed", "checked_in"] },
      },
    });
    if (!paidBooking) {
      const ageMs = Date.now() - new Date(room.updated_at || room.created_at || 0).getTime();
      if (ageMs > STALE_RESERVED_MS) {
        const updated = await prisma.room.update({
          where: { id: roomId },
          data: { status: "available" },
        });
        return { room: updated };
      }
      return { error: "Room is not available", status: 400 };
    }
    return { error: "Room is not available", status: 400 };
  }

  if (status === "reserved") {
    const refreshed = await releaseStaleRoomReservation(roomId);
    if (isRoomBookable(refreshed.status)) {
      return { room: refreshed };
    }
    return { error: "Room is not available", status: 400 };
  }

  if (!isRoomBookable(room.status)) {
    return { error: "Room is not available", status: 400 };
  }

  return { room };
}

export async function reserveRoom(roomId) {
  return prisma.room.update({
    where: { id: roomId },
    data: { status: "reserved" },
  });
}

export async function releaseRoom(roomId) {
  const paidBooking = await prisma.booking.findFirst({
    where: {
      room_id: roomId,
      payment_status: "paid",
      status: { in: ["pending", "confirmed", "checked_in"] },
    },
  });
  if (paidBooking) return;

  const pendingPayment = await prisma.booking.findFirst({
    where: {
      room_id: roomId,
      payment_status: "pending",
      status: { notIn: ["cancelled"] },
    },
  });
  if (pendingPayment) return;

  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (room && normalizeRoomStatus(room.status) === "unavailable") return;

  await prisma.room.update({
    where: { id: roomId },
    data: { status: "available" },
  });
}
