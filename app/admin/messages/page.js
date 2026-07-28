"use client";

import { useEffect, useMemo, useState } from "react";
import { Mail, Phone, Trash2, X } from "lucide-react";

const statusStyles = {
  new: "bg-blue-100 text-blue-800",
  read: "bg-gray-100 text-gray-700",
  archived: "bg-amber-100 text-amber-800",
};

export default function AdminMessages() {
  const [messages, setMessages] = useState([]);
  const [selected, setSelected] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    fetch("/api/contact-messages")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) {
          setError(d.error || "Could not load messages");
          setMessages([]);
          return;
        }
        if (d.messages) setMessages(d.messages);
      })
      .catch(() => setError("Could not load messages"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = useMemo(() => {
    let list = [...messages];
    if (statusFilter !== "all") {
      list = list.filter((m) => m.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q) ||
          m.phone.toLowerCase().includes(q) ||
          m.message.toLowerCase().includes(q)
      );
    }
    return list;
  }, [messages, statusFilter, search]);

  const newCount = messages.filter((m) => m.status === "new").length;

  const updateStatus = async (id, status) => {
    const res = await fetch(`/api/contact-messages/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      load();
      if (selected?.id === id) {
        setSelected((prev) => (prev ? { ...prev, status } : null));
      }
    }
  };

  const deleteMessage = async (id) => {
    if (!confirm("Delete this message?")) return;
    const res = await fetch(`/api/contact-messages/${id}`, { method: "DELETE" });
    if (res.ok) {
      setSelected(null);
      load();
    }
  };

  const openMessage = (msg) => {
    setSelected(msg);
    if (msg.status === "new") {
      updateStatus(msg.id, "read");
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold">Contact messages</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Messages sent from the public contact page appear here automatically.
            {newCount > 0 && (
              <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-800">
                {newCount} new
              </span>
            )}
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      <div className="mt-6 rounded-lg border border-border bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[1fr_180px]">
          <input
            className="min-h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
            placeholder="Search name, email, phone, or message..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="min-h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="new">New</option>
            <option value="read">Read</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-gray-50 text-left">
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold">From</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Phone</th>
              <th className="px-4 py-3 font-semibold">Message</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  Loading messages...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  No contact messages yet.
                </td>
              </tr>
            ) : (
              filtered.map((m) => (
                <tr
                  key={m.id}
                  className="cursor-pointer border-b border-border last:border-0 hover:bg-gray-50"
                  onClick={() => openMessage(m)}
                >
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                    {new Date(m.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-medium">{m.name}</td>
                  <td className="px-4 py-3 text-xs">{m.email}</td>
                  <td className="px-4 py-3 text-xs">{m.phone || "—"}</td>
                  <td className="max-w-xs truncate px-4 py-3">{m.message}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold capitalize ${statusStyles[m.status] || ""}`}>
                      {m.status}
                    </span>
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-1">
                      {m.status !== "archived" && (
                        <button
                          onClick={() => updateStatus(m.id, "archived")}
                          className="rounded-md border border-border px-2 py-1 text-xs font-bold hover:bg-gray-50"
                        >
                          Archive
                        </button>
                      )}
                      <button
                        onClick={() => deleteMessage(m.id)}
                        className="rounded-md p-1.5 text-red-600 hover:bg-red-50"
                        aria-label="Delete message"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setSelected(null)}>
          <div
            className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelected(null)}
              className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-md hover:bg-gray-100"
            >
              <X size={18} />
            </button>

            <h2 className="text-2xl font-extrabold">{selected.name}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{new Date(selected.created_at).toLocaleString()}</p>

            <div className="mt-4 space-y-2 text-sm">
              <p className="flex items-center gap-2">
                <Mail size={16} className="text-primary" />
                <a href={`mailto:${selected.email}`} className="font-semibold text-primary hover:underline">
                  {selected.email}
                </a>
              </p>
              {selected.phone ? (
                <p className="flex items-center gap-2">
                  <Phone size={16} className="text-primary" />
                  <a href={`tel:${selected.phone}`} className="hover:underline">
                    {selected.phone}
                  </a>
                </p>
              ) : null}
            </div>

            <div className="mt-5 rounded-lg bg-gray-50 p-4">
              <h3 className="text-sm font-bold uppercase text-muted-foreground">Message</h3>
              <p className="mt-2 whitespace-pre-wrap leading-6">{selected.message}</p>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {selected.status !== "read" && selected.status !== "archived" && (
                <button
                  onClick={() => updateStatus(selected.id, "read")}
                  className="rounded-md border border-border px-4 py-2 text-sm font-bold hover:bg-gray-50"
                >
                  Mark as read
                </button>
              )}
              {selected.status !== "archived" && (
                <button
                  onClick={() => updateStatus(selected.id, "archived")}
                  className="rounded-md bg-amber-500 px-4 py-2 text-sm font-bold text-white"
                >
                  Archive
                </button>
              )}
              <button
                onClick={() => deleteMessage(selected.id)}
                className="rounded-md bg-red-500 px-4 py-2 text-sm font-bold text-white"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
