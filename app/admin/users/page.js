"use client";

import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Users } from "lucide-react";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "client",
  });

  const loadUsers = () => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((d) => {
        if (d.users) setUsers(d.users);
        else if (d.error) setError(d.error);
      });
  };

  useEffect(loadUsers, []);

  const resetForm = () => {
    setForm({ name: "", email: "", phone: "", password: "", role: "client" });
    setEditing(null);
    setShowForm(false);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const url = editing ? `/api/users/${editing}` : "/api/users";
    const method = editing ? "PUT" : "POST";
    const body = { ...form };
    if (editing && !body.password) delete body.password;

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not save user");
      return;
    }
    resetForm();
    loadUsers();
  };

  const handleEdit = (user) => {
    setForm({
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      password: "",
      role: user.role,
    });
    setEditing(user.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this user?")) return;
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not delete user");
      return;
    }
    loadUsers();
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create and manage guest and admin accounts.</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
        >
          <Plus size={16} /> Add user
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-6 rounded-lg border border-border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-extrabold">{editing ? "Edit user" : "New user"}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1.5 text-sm font-semibold">
              Name
              <input
                className="min-h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </label>
            <label className="grid gap-1.5 text-sm font-semibold">
              Email
              <input
                type="email"
                className="min-h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </label>
            <label className="grid gap-1.5 text-sm font-semibold">
              Phone
              <input
                className="min-h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </label>
            <label className="grid gap-1.5 text-sm font-semibold">
              Role
              <select
                className="min-h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="client">Guest</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <label className="grid gap-1.5 text-sm font-semibold sm:col-span-2">
              {editing ? "New password (leave blank to keep current)" : "Password"}
              <input
                type="password"
                className="min-h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required={!editing}
              />
            </label>
          </div>
          <div className="mt-4 flex gap-3">
            <button type="submit" className="rounded-md bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground">
              {editing ? "Update user" : "Create user"}
            </button>
            <button type="button" onClick={resetForm} className="rounded-md border border-border px-6 py-2.5 text-sm font-semibold">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="mt-6 overflow-x-auto rounded-lg border border-border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-gray-50 text-left">
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Phone</th>
              <th className="px-4 py-3 font-semibold">Role</th>
              <th className="px-4 py-3 font-semibold">Bookings</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  <Users className="mx-auto mb-2 opacity-40" size={28} />
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">{user.name}</td>
                  <td className="px-4 py-3">{user.email}</td>
                  <td className="px-4 py-3">{user.phone || "—"}</td>
                  <td className="px-4 py-3 capitalize">{user.role}</td>
                  <td className="px-4 py-3">{user._count?.bookings ?? 0}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(user)} className="rounded-md p-1.5 text-blue-600 hover:bg-blue-50">
                        <Edit2 size={15} />
                      </button>
                      <button onClick={() => handleDelete(user.id)} className="rounded-md p-1.5 text-red-600 hover:bg-red-50">
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
