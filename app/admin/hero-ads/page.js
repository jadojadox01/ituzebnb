"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { FileUploadField } from "@/components/FileUploadField";
import { parseJsonResponse } from "@/lib/clientUpload";

const emptyForm = {
  title: "",
  subtitle: "",
  image: "",
  link: "",
  active: 1,
  sort_order: 0,
};

export default function AdminHeroAds() {
  const [ads, setAds] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/hero-ads?all=1");
      const data = await parseJsonResponse(res);
      if (!res.ok) {
        setError(data.error || "Could not load hero slides.");
        return;
      }
      setAds(data.ads || []);
    } catch (err) {
      setError(err.message || "Could not load hero slides.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.image) {
      setError("Please upload a hero image.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title || "",
        subtitle: form.subtitle || "",
        image: form.image,
        link: form.link || "",
        active: Number(form.active) === 1 ? 1 : 0,
        sort_order: Number(form.sort_order) || 0,
      };
      if (editing) payload.id = editing;

      const res = await fetch("/api/hero-ads", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await parseJsonResponse(res);
      if (!res.ok) {
        setError(data.error || "Could not save hero slide.");
        return;
      }

      setForm(emptyForm);
      setEditing(null);
      await load();
    } catch (err) {
      setError(err.message || "Could not save hero slide.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (ad) => {
    setForm({
      title: ad.title || "",
      subtitle: ad.subtitle || "",
      image: ad.image || "",
      link: ad.link || "",
      active: Number(ad.active) === 1 ? 1 : 0,
      sort_order: ad.sort_order ?? 0,
    });
    setEditing(ad.id);
    setError("");
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this hero slide?")) return;
    setError("");
    try {
      const res = await fetch("/api/hero-ads", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await parseJsonResponse(res);
      if (!res.ok) {
        setError(data.error || "Could not delete slide.");
        return;
      }
      await load();
    } catch (err) {
      setError(err.message || "Could not delete slide.");
    }
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

      {error ? (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700" role="alert">
          {error}
        </p>
      ) : null}

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
              hint="Upload a high-quality photo. Large images are compressed automatically before upload."
            />
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-60"
          >
            {saving ? "Saving..." : editing ? "Update slide" : "Add slide"}
          </button>
          {editing && (
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setForm(emptyForm);
                setError("");
              }}
              className="rounded-md border border-border px-6 py-2.5 text-sm font-semibold"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <p className="col-span-full py-8 text-center text-sm text-muted-foreground">Loading slides...</p>
        ) : ads.length === 0 ? (
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
