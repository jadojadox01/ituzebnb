export function calculateBookingAmount(room, checkIn, checkOut) {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    throw new Error("Invalid booking dates.");
  }
  const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  return Math.round(nights * Number(room.price_daily || 0));
}

export function assertBookingAmount(booking, requestedAmount) {
  const expected = calculateBookingAmount(
    booking.room || { price_daily: booking.total_amount },
    booking.check_in,
    booking.check_out
  );

  const submitted = Math.round(Number(requestedAmount));
  if (!submitted || submitted !== expected) {
    const error = new Error("Payment amount does not match order total.");
    error.code = "AMOUNT_MISMATCH";
    error.expected = expected;
    error.received = submitted;
    throw error;
  }

  return expected;
}
