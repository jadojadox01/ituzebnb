import { NextResponse } from "next/server";
import { searchAvailableRooms } from "@/lib/availabilityService";
import { nightsBetween } from "@/lib/availabilitySearch";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const checkIn = searchParams.get("check_in");
    const checkOut = searchParams.get("check_out");
    const adults = parseInt(searchParams.get("adults") || "1", 10);
    const children = parseInt(searchParams.get("children") || "0", 10);
    const roomsCount = parseInt(searchParams.get("rooms") || "1", 10);

    if (!checkIn || !checkOut) {
      return NextResponse.json({ error: "check_in and check_out are required" }, { status: 400 });
    }

    const nights = nightsBetween(checkIn, checkOut);
    if (nights < 1) {
      return NextResponse.json({ error: "Check-out must be after check-in" }, { status: 400 });
    }

    const today = new Date().toISOString().slice(0, 10);
    if (checkIn < today) {
      return NextResponse.json({ error: "Check-in cannot be in the past" }, { status: 400 });
    }

    const result = await searchAvailableRooms({
      checkIn,
      checkOut,
      adults: Math.max(1, adults),
      children: Math.max(0, children),
      roomsCount: Math.max(1, roomsCount),
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
