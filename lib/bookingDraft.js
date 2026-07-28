const DRAFT_PREFIX = "ituze_booking_draft_";
const DRAFT_TTL_MS = 24 * 60 * 60 * 1000;

function draftKey(roomId) {
  return `${DRAFT_PREFIX}${roomId}`;
}

export function saveBookingDraft(roomId, { step, form }) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      draftKey(roomId),
      JSON.stringify({
        roomId: String(roomId),
        step,
        form,
        savedAt: Date.now(),
      })
    );
  } catch {
    // ignore quota / private mode errors
  }
}

export function loadBookingDraft(roomId) {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(draftKey(roomId));
    if (!raw) return null;

    const draft = JSON.parse(raw);
    if (String(draft.roomId) !== String(roomId)) return null;
    if (Date.now() - (draft.savedAt || 0) > DRAFT_TTL_MS) {
      clearBookingDraft(roomId);
      return null;
    }
    return draft;
  } catch {
    return null;
  }
}

export function clearBookingDraft(roomId) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(draftKey(roomId));
  } catch {
    // ignore
  }
}

export function bookingContinueUrl(roomPath) {
  const separator = roomPath.includes("?") ? "&" : "?";
  return `${roomPath}${separator}continueBooking=1`;
}
