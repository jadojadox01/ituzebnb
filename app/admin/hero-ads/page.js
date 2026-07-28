"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { FileUploadField } from "@/components/FileUploadField";

export default function AdminHeroAds() {
  const [ads, setAds] = useState([]);
  const [form, setForm] = useState({ title: "", subtitle: "", image: "", link: "", active: 1, sort_order: 0 });
  const [editing, setEditing] = useState(null);

  const load = () => {
    fetch("/api/hero-ads?all=1")
      .then((r) => r.json())
      .then((d) => {
        if (d.ads) setAds(d.ads);
      });
  };

  useEffect(load, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.image) {
      alert("Please upload a hero image.");
      return;
    }

    const url = "/api/hero-ads";
    const method = editing ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing ? { ...form, id: editing, sort_order: Number(form.sort_order) } : { ...form, sort_order: Number(form.sort_order) }),
    });
    if (res.ok) {
      setForm({ title: "", subtitle: "", image: "", link: "", active: 1, sort_order: 0 });
      setEditing(null);
      load();
    }
  };

  const handleEdit = (ad) => {
    setForm(ad);
    setEditing(ad.id);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this hero slide?")) return;
    const res = await fetch("/api/hero-ads", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) load();
  };

  return (
    <div>
      <div>
        <h1 className="text-2xl font-extrabold">Hero section</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage homepage hero slides. Each slide can have its own image, title, subtitle, and link.
          Fallback text comes from Settings → Homepage hero when a slide has no title.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 rounded-lg border border-border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-extrabold">{editing ? "Edit slide" : "Add hero slide"}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-semibold">
            Title
            <input
              className="min-h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Optional — overrides homepage hero headline"
            />
          </label>
          <label className="grid gap-1.5 text-sm font-semibold">
            Subtitle
            <input
              className="min-h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
              value={form.subtitle}
              onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
              placeholder="Optional — overrides homepage hero subtitle"
            />
          </label>
          <label className="grid gap-1.5 text-sm font-semibold">
            Link
            <input
              className="min-h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
              value={form.link}
              onChange={(e) => setForm({ ...form, link: e.target.value })}
              placeholder="/houses or full URL"
            />
          </label>
          <label className="grid gap-1.5 text-sm font-semibold">
            Sort order
            <input
              type="number"
              className="min-h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
              value={form.sort_order}
              onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
            />
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold sm:col-span-2">
            <input
              type="checkbox"
              checked={Number(form.active) === 1}
              onChange={(e) => setForm({ ...form, active: e.target.checked ? 1 : 0 })}
              className="accent-primary"
            />
            Active on homepage
          </label>
          <div className="sm:col-span-2">
            <FileUploadField
              label="Hero image"
              folder="hero"
              accept="image/*"
              value={form.image}
              onChange={(url) => setForm({ ...form, image: url })}
              hint="Upload a high-quality photo for this hero slide."
            />
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <button type="submit" className="rounded-md bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground">
            {editing ? "Update slide" : "Add slide"}
          </button>
          {editing && (
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setForm({ title: "", subtitle: "", image: "", link: "", active: 1, sort_order: 0 });
              }}
              className="rounded-md border border-border px-6 py-2.5 text-sm font-semibold"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ads.length === 0 ? (
          <p className="col-span-full py-8 text-center text-sm text-muted-foreground">
            No hero slides yet. Add your first slide above.
          </p>
        ) : (
          ads.map((ad) => (
            <div key={ad.id} className="rounded-lg border border-border bg-white p-4 shadow-sm">
              {ad.image && <img src={ad.image} alt={ad.title} className="h-32 w-full rounded-md object-cover" />}
              <h3 className="mt-3 font-extrabold">{ad.title || "Untitled slide"}</h3>
              {ad.subtitle && <p className="mt-1 text-xs text-muted-foreground">{ad.subtitle}</p>}
              <div className="mt-3 flex items-center justify-between">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                    ad.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {ad.active ? "Active" : "Inactive"}
                </span>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(ad)} className="rounded-md p-1.5 text-blue-600 hover:bg-blue-50">
                    <Edit2 size={15} />
                  </button>
                  <button onClick={() => handleDelete(ad.id)} className="rounded-md p-1.5 text-red-600 hover:bg-red-50">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
