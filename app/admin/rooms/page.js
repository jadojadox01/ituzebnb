"use client";

import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { FileUploadField } from "@/components/FileUploadField";

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

  const loadRooms = () => {
    fetch("/api/rooms").then((r) => r.json()).then((d) => {
      if (d.rooms) setRooms(d.rooms);
    });
  };

  useEffect(loadRooms, []);

  const resetForm = () => {
    setForm(emptyForm);
    setImagePaths([]);
    setEditing(null);
    setShowForm(false);
  };

  const toggleAmenity = (amenity) => {
    const current = form.amenities ? form.amenities.split(", ") : [];
    const updated = current.includes(amenity)
      ? current.filter((a) => a !== amenity)
      : [...current, amenity];
    setForm({ ...form, amenities: updated.join(", ") });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const imagesStr = imagePaths.join(", ");
    const url = editing ? `/api/rooms/${editing}` : "/api/rooms";
    const method = editing ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, images: imagesStr }),
    });
    if (res.ok) {
      resetForm();
      loadRooms();
    }
  };

  const handleEdit = (room) => {
    setForm(room);
    setEditing(room.id);
    setShowForm(true);
    setImagePaths(
      room.images
        ? room.images.split(",").map((i) => i.trim()).filter(Boolean)
        : []
    );
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this room?")) return;
    const res = await fetch(`/api/rooms/${id}`, { method: "DELETE" });
    if (res.ok) loadRooms();
  };

  const statusColors = {
    available: "bg-green-100 text-green-700",
    reserved: "bg-yellow-100 text-yellow-700",
    booked: "bg-red-100 text-red-700",
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">Rooms management</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create, update, and delete rooms with uploaded photos and videos.</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
        >
          <Plus size={16} /> Add room
        </button>
      </div>

      {showForm && (
        <div className="mt-6 rounded-lg border border-border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-extrabold">{editing ? "Edit room" : "Add new room"}</h2>
          <form onSubmit={handleSubmit} className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="grid gap-1.5 text-sm font-semibold">
              Title
              <input className="min-h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </label>
            <label className="grid gap-1.5 text-sm font-semibold">
              Room type
              <select className="min-h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary" value={form.room_type} onChange={(e) => setForm({ ...form, room_type: e.target.value })}>
                <option value="single">Single</option>
                <option value="double">Double</option>
                <option value="twin">Twin</option>
              </select>
            </label>
            <label className="grid gap-1.5 text-sm font-semibold">
              Price (daily)
              <input type="number" className="min-h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary" value={form.price_daily} onChange={(e) => setForm({ ...form, price_daily: e.target.value })} required />
            </label>
            <label className="grid gap-1.5 text-sm font-semibold">
              Price (monthly)
              <input type="number" className="min-h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary" value={form.price_monthly} onChange={(e) => setForm({ ...form, price_monthly: e.target.value })} />
            </label>
            <label className="grid gap-1.5 text-sm font-semibold">
              Currency
              <select className="min-h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                <option value="RWF">RWF</option>
                <option value="USD">USD</option>
              </select>
            </label>
            <label className="grid gap-1.5 text-sm font-semibold">
              Status
              <select className="min-h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="available">Available</option>
                <option value="reserved">Reserved</option>
                <option value="booked">Booked</option>
              </select>
            </label>
            <label className="grid gap-1.5 text-sm font-semibold">
              Beds
              <input type="number" className="min-h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary" value={form.beds} onChange={(e) => setForm({ ...form, beds: e.target.value })} />
            </label>
            <label className="grid gap-1.5 text-sm font-semibold">
              Bathrooms
              <input type="number" className="min-h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary" value={form.bathrooms} onChange={(e) => setForm({ ...form, bathrooms: e.target.value })} />
            </label>
            <label className="grid gap-1.5 text-sm font-semibold">
              Location
              <input className="min-h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </label>
            <label className="grid gap-1.5 text-sm font-semibold">
              Capacity
              <input type="number" className="min-h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
            </label>

            <div className="sm:col-span-2 lg:col-span-3">
              <p className="mb-2 text-sm font-semibold">Amenities</p>
              <div className="flex flex-wrap gap-2">
                {AMENITY_OPTIONS.map((amenity) => {
                  const selected = form.amenities.includes(amenity);
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
              <textarea className="min-h-20 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </label>

            <div className="flex gap-3 sm:col-span-2 lg:col-span-3">
              <button type="submit" className="rounded-md bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground">
                {editing ? "Update room" : "Create room"}
              </button>
              <button type="button" onClick={resetForm} className="rounded-md border border-border px-6 py-2.5 text-sm font-semibold">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="mt-6 overflow-x-auto rounded-lg border border-border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-gray-50 text-left">
              <th className="px-4 py-3 font-semibold">Title</th>
              <th className="px-4 py-3 font-semibold">Type</th>
              <th className="px-4 py-3 font-semibold">Daily</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rooms.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No rooms found. Add your first room!
                </td>
              </tr>
            ) : (
              rooms.map((room) => (
                <tr key={room.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">{room.title}</td>
                  <td className="px-4 py-3 capitalize">{room.room_type}</td>
                  <td className="px-4 py-3">{room.price_daily?.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${statusColors[room.status] || "bg-gray-100"}`}>
                      {room.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(room)} className="rounded-md p-1.5 text-blue-600 hover:bg-blue-50">
                        <Edit2 size={15} />
                      </button>
                      <button onClick={() => handleDelete(room.id)} className="rounded-md p-1.5 text-red-600 hover:bg-red-50">
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
