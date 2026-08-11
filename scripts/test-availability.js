/**
 * Lightweight unit checks for booking date overlap / nights helpers.
 * Run: npm run test:availability
 */
import {
  datesOverlap,
  nightsBetween,
  bookingBlocksDates,
  roomFitsGuests,
  totalGuests,
} from "../lib/availabilitySearch.js";

let passed = 0;
let failed = 0;

function assert(name, condition) {
  if (condition) {
    passed += 1;
    console.log(`PASS  ${name}`);
  } else {
    failed += 1;
    console.error(`FAIL  ${name}`);
  }
}

assert("nightsBetween basic", nightsBetween("2026-09-01", "2026-09-03") === 2);
assert("nightsBetween invalid", nightsBetween("2026-09-03", "2026-09-01") === 0);
assert(
  "overlap adjacent checkout/checkin false",
  !datesOverlap("2026-09-01", "2026-09-03", "2026-09-03", "2026-09-05")
);
assert("overlap partial true", datesOverlap("2026-09-01", "2026-09-05", "2026-09-03", "2026-09-07"));
assert("overlap contained true", datesOverlap("2026-09-01", "2026-09-10", "2026-09-04", "2026-09-06"));
assert(
  "cancelled booking does not block",
  !bookingBlocksDates(
    { status: "cancelled", check_in: "2026-09-01", check_out: "2026-09-05" },
    "2026-09-02",
    "2026-09-04"
  )
);
assert(
  "pending booking blocks overlap",
  bookingBlocksDates(
    { status: "pending", check_in: "2026-09-01", check_out: "2026-09-05" },
    "2026-09-02",
    "2026-09-04"
  )
);
assert("guest total", totalGuests(2, 1) === 3);
assert("capacity fit", roomFitsGuests({ capacity: 2 }, 2, 0));
assert("capacity reject", !roomFitsGuests({ capacity: 2 }, 2, 1));

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
