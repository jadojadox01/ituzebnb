"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

export default function AdminBlockedDatesPage() {
  const [blocked, setBlocked] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [form, setForm] = useState({
    room_id: "",
    start_date: "",
    end_date: "",
    reason: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const [blockedRes, roomsRes] = await Promise.all([
      fetch("/api/blocked-dates"),
      fetch("/api/rooms"),
    ]);
    const blockedData = await blockedRes.json();
    const roomsData = await roomsRes.json();
    if (blockedData.blocked_dates) setBlocked(blockedData.blocked_dates);
    if (roomsData.rooms) setRooms(roomsData.rooms);
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/blocked-dates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room_id: form.room_id || null,
          start_date: form.start_date,
          end_date: form.end_date,
          reason: form.reason,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to add blocked dates");
        return;
      }
      setForm({ room_id: "", start_date: "", end_date: "", reason: "" });
      await load();
    } catch {
      setError("Failed to add blocked dates");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Remove this blocked date range?")) return;
    await fetch(`/api/blocked-dates?id=${id}`, { method: "DELETE" });
    await load();
  };

  return (
    <div>
      <h1 className="text-2xl font-extrabold">Blocked dates</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Block dates for a specific room or all rooms to prevent double bookings.
      </p>

      <form onSubmit={handleAdd} className="mt-6 grid gap-4 rounded-xl border border-border bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
        {error && (
          <p className="sm:col-span-2 lg:col-span-4 rounded-md bg-red-50 p-3 text-sm font-semibold text-red-700">
            {error}
          </p>
        )}
        <label className="grid gap-1.5">
          <span className="text-sm font-bold">Room (optional)</span>
          <select
            value={form.room_id}
            onChange={(e) => setForm({ ...form, room_id: e.target.value })}
            className="min-h-10 rounded-md border border-input px-3 text-sm"
          >
            <option value="">All rooms</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.title}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5">
          <span className="text-sm font-bold">Start date</span>
          <input
            type="date"
            required
            value={form.start_date}
            onChange={(e) => setForm({ ...form, start_date: e.target.value })}
            className="min-h-10 rounded-md border border-input px-3 text-sm"
          />
        </label>
        <label className="grid gap-1.5">
          <span className="text-sm font-bold">End date</span>
          <input
            type="date"
            required
            min={form.start_date}
            value={form.end_date}
            onChange={(e) => setForm({ ...form, end_date: e.target.value })}
            className="min-h-10 rounded-md border border-input px-3 text-sm"
          />
        </label>
        <label className="grid gap-1.5 sm:col-span-2 lg:col-span-1">
          <span className="text-sm font-bold">Reason</span>
          <input
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            placeholder="Maintenance, private event..."
            className="min-h-10 rounded-md border border-input px-3 text-sm"
          />
        </label>
        <div className="flex items-end sm:col-span-2 lg:col-span-4">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex min-h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-bold text-primary-foreground disabled:opacity-60"
          >
            <Plus size={16} /> Add blocked dates
          </button>
        </div>
      </form>

      <div className="mt-8 overflow-x-auto rounded-xl border border-border bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-border bg-gray-50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Room</th>
              <th className="px-4 py-3">Start</th>
              <th className="px-4 py-3">End</th>
              <th className="px-4 py-3">Reason</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {blocked.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No blocked dates yet.
                </td>
              </tr>
            ) : (
              blocked.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">{row.room?.title || "All rooms"}</td>
                  <td className="px-4 py-3">{row.start_date}</td>
                  <td className="px-4 py-3">{row.end_date}</td>
                  <td className="px-4 py-3">{row.reason || "—"}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleDelete(row.id)}
                      className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-1 text-xs font-bold text-red-700 hover:bg-red-100"
                    >
                      <Trash2 size={14} /> Remove
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
