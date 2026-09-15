"use client";

import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { FileUploadField } from "@/components/FileUploadField";
import { formatMoney } from "@/lib/currency";

const AMENITY_OPTIONS = [
  "Free WiFi", "Private Bathroom", "Valley View", "Daily Cleaning",
  "TV", "Air Conditioning", "Balcony", "Garden Access",
  "Mini Bar", "Kitchenette", "River View", "Mountain View",
  "Parking", "Breakfast Included", "Wardrobe", "Desk",
];

const emptyForm = {
  title: "",
  room_type: "single",
  price_daily: "",
  price_monthly: "",
  price_daily_usd: "",
  price_monthly_usd: "",
  currency: "RWF",
  status: "available",
  description: "",
  beds: 1,
  bathrooms: 1,
  location: "",
  capacity: 1,
  amenities: "",
  images: "",
  video_url: "",
};

export default function AdminRooms() {
  const [rooms, setRooms] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [imagePaths, setImagePaths] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const loadRooms = () => {
    fetch("/api/rooms", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.rooms) setRooms(d.rooms);
      });
  };

  useEffect(loadRooms, []);

  const resetForm = () => {
    setForm(emptyForm);
    setImagePaths([]);
    setEditing(null);
    setShowForm(false);
    setError("");
    setSaving(false);
  };

  const toggleAmenity = (amenity) => {
    const current = String(form.amenities || "")
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean);
    const updated = current.includes(amenity)
      ? current.filter((a) => a !== amenity)
      : [...current, amenity];
    setForm({ ...form, amenities: updated.join(", ") });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    const payload = {
      title: form.title,
      room_type: form.room_type,
      price_daily: Number(form.price_daily) || 0,
      price_monthly: Number(form.price_monthly) || 0,
      price_daily_usd: Number(form.price_daily_usd) || 0,
      price_monthly_usd: Number(form.price_monthly_usd) || 0,
      currency: form.currency,
      status: form.status,
      description: form.description || "",
      beds: Number(form.beds) || 1,
      bathrooms: Number(form.bathrooms) || 1,
      location: form.location || "",
      capacity: Number(form.capacity) || 1,
      amenities: form.amenities || "",
      images: imagePaths.join(", "),
      video_url: form.video_url || "",
    };

    if (!payload.price_daily && !payload.price_daily_usd) {
      setError("Set at least a daily price in RWF or USD.");
      setSaving(false);
      return;
    }

    try {
      const url = editing ? `/api/rooms/${editing}` : "/api/rooms";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not save room. Please try again.");
        return;
      }
      if (data.room) {
        setRooms((prev) => {
          const exists = prev.some((r) => r.id === data.room.id);
          if (!exists) return [data.room, ...prev];
          return prev.map((r) => (r.id === data.room.id ? data.room : r));
        });
      }
      resetForm();
      loadRooms();
    } catch {
      setError("Could not save room. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (room) => {
    setForm({
      title: room.title || "",
      room_type: room.room_type || "single",
      price_daily: room.price_daily ?? "",
      price_monthly: room.price_monthly ?? "",
      price_daily_usd: room.price_daily_usd ?? "",
      price_monthly_usd: room.price_monthly_usd ?? "",
      currency: room.currency || "RWF",
      status: room.status || "available",
      description: room.description || "",
      beds: room.beds ?? 1,
      bathrooms: room.bathrooms ?? 1,
      location: room.location || "",
      capacity: room.capacity ?? 1,
      amenities: room.amenities || "",
      images: room.images || "",
      video_url: room.video_url || "",
    });
    setEditing(room.id);
    setShowForm(true);
    setError("");
    setImagePaths(
      room.images
        ? String(room.images).split(",").map((i) => i.trim()).filter(Boolean)
        : []
    );
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this room?")) return;
    setDeletingId(id);
    setError("");
    try {
      let res = await fetch(`/api/rooms/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      let data = await res.json().catch(() => ({}));

      if (res.status === 409 && data.requiresForce) {
        const ok = confirm(
          `${data.error || "This room has existing bookings."}\n\nDelete the room and all related bookings? This cannot be undone.`
        );
        if (!ok) return;
        res = await fetch(`/api/rooms/${id}?force=1`, {
          method: "DELETE",
          credentials: "include",
        });
        data = await res.json().catch(() => ({}));
      }

      if (!res.ok) {
        setError(data.error || "Could not delete room.");
        return;
      }
      setRooms((prev) => prev.filter((r) => r.id !== id));
      loadRooms();
    } catch {
      setError("Could not delete room. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const statusColors = {
    available: "bg-green-100 text-green-700",
    reserved: "bg-yellow-100 text-yellow-700",
    booked: "bg-red-100 text-red-700",
    unavailable: "bg-gray-200 text-gray-800",
  };

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">Rooms management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create rooms with RWF and USD rates, photos, and availability status.
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-sm"
        >
          <Plus size={16} /> Add room
        </button>
      </div>

      {error ? (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      {showForm && (
        <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-smooth">
          <h2 className="text-lg font-extrabold">{editing ? "Edit room" : "Add new room"}</h2>
          <form onSubmit={handleSubmit} className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="grid gap-1.5 text-sm font-semibold">
              Title
              <input className="min-h-10 rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </label>
            <label className="grid gap-1.5 text-sm font-semibold">
              Room type
              <select className="min-h-10 rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary" value={form.room_type} onChange={(e) => setForm({ ...form, room_type: e.target.value })}>
                <option value="single">Single</option>
                <option value="double">Double</option>
                <option value="twin">Twin</option>
              </select>
            </label>
            <label className="grid gap-1.5 text-sm font-semibold">
              Default display currency
              <select className="min-h-10 rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                <option value="RWF">RWF</option>
                <option value="USD">USD</option>
              </select>
            </label>

            <div className="rounded-xl border border-border bg-muted/30 p-4 sm:col-span-2 lg:col-span-3">
              <p className="text-sm font-extrabold text-primary">Nightly & monthly rates</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Guests can switch RWF / USD on the site. Mobile Money checkout always uses the RWF nightly rate.
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <label className="grid gap-1.5 text-sm font-semibold">
                  Daily (RWF)
                  <input type="number" min="0" step="100" className="min-h-10 rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary" value={form.price_daily} onChange={(e) => setForm({ ...form, price_daily: e.target.value })} />
                </label>
                <label className="grid gap-1.5 text-sm font-semibold">
                  Monthly (RWF)
                  <input type="number" min="0" step="100" className="min-h-10 rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary" value={form.price_monthly} onChange={(e) => setForm({ ...form, price_monthly: e.target.value })} />
                </label>
                <label className="grid gap-1.5 text-sm font-semibold">
                  Daily (USD)
                  <input type="number" min="0" step="0.01" className="min-h-10 rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary" value={form.price_daily_usd} onChange={(e) => setForm({ ...form, price_daily_usd: e.target.value })} />
                </label>
                <label className="grid gap-1.5 text-sm font-semibold">
                  Monthly (USD)
                  <input type="number" min="0" step="0.01" className="min-h-10 rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary" value={form.price_monthly_usd} onChange={(e) => setForm({ ...form, price_monthly_usd: e.target.value })} />
                </label>
              </div>
            </div>

            <label className="grid gap-1.5 text-sm font-semibold">
              Status
              <select className="min-h-10 rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="available">Available</option>
                <option value="reserved">Reserved (temporary hold)</option>
                <option value="booked">Booked</option>
                <option value="unavailable">Unavailable (manual block)</option>
              </select>
            </label>
            <label className="grid gap-1.5 text-sm font-semibold">
              Beds
              <input type="number" className="min-h-10 rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary" value={form.beds} onChange={(e) => setForm({ ...form, beds: e.target.value })} />
            </label>
            <label className="grid gap-1.5 text-sm font-semibold">
              Bathrooms
              <input type="number" className="min-h-10 rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary" value={form.bathrooms} onChange={(e) => setForm({ ...form, bathrooms: e.target.value })} />
            </label>
            <label className="grid gap-1.5 text-sm font-semibold">
              Location
              <input className="min-h-10 rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </label>
            <label className="grid gap-1.5 text-sm font-semibold">
              Capacity
              <input type="number" className="min-h-10 rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
            </label>

            <div className="sm:col-span-2 lg:col-span-3">
              <p className="mb-2 text-sm font-semibold">Amenities</p>
              <div className="flex flex-wrap gap-2">
                {AMENITY_OPTIONS.map((amenity) => {
                  const selected = String(form.amenities || "")
                    .split(",")
                    .map((a) => a.trim())
                    .includes(amenity);
                  return (
                    <button
                      key={amenity}
                      type="button"
                      onClick={() => toggleAmenity(amenity)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                        selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/50"
                      }`}
                    >
                      {amenity}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <FileUploadField
                label="Room photos"
                folder="rooms"
                accept="image/*"
                multiple
                value={imagePaths}
                onChange={setImagePaths}
                hint="Upload one or more photos for this room."
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <FileUploadField
                label="Video tour (optional)"
                folder="videos"
                accept="video/*"
                value={form.video_url}
                onChange={(url) => setForm({ ...form, video_url: url })}
                hint="Upload an MP4 or WebM walkthrough. Leave empty if not available."
              />
            </div>

            <label className="grid gap-1.5 text-sm font-semibold sm:col-span-2 lg:col-span-3">
              Description
              <textarea className="min-h-20 rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </label>

            <div className="flex gap-3 sm:col-span-2 lg:col-span-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-60"
              >
                {saving ? "Saving..." : editing ? "Update room" : "Create room"}
              </button>
              <button type="button" onClick={resetForm} className="rounded-full border border-border px-6 py-2.5 text-sm font-semibold">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left">
              <th className="px-4 py-3 font-semibold">Title</th>
              <th className="px-4 py-3 font-semibold">Type</th>
              <th className="px-4 py-3 font-semibold">RWF / night</th>
              <th className="px-4 py-3 font-semibold">USD / night</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rooms.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No rooms found. Add your first room!
                </td>
              </tr>
            ) : (
              rooms.map((room) => (
                <tr key={room.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">{room.title}</td>
                  <td className="px-4 py-3 capitalize">{room.room_type}</td>
                  <td className="px-4 py-3">{formatMoney(room.price_daily, "RWF")}</td>
                  <td className="px-4 py-3">{room.price_daily_usd ? formatMoney(room.price_daily_usd, "USD") : "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${statusColors[room.status] || "bg-gray-100"}`}>
                      {room.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(room)} className="rounded-md p-1.5 text-blue-600 hover:bg-blue-50" aria-label="Edit room">
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(room.id)}
                        disabled={deletingId === room.id}
                        className="rounded-md p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-50"
                        aria-label="Delete room"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
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
