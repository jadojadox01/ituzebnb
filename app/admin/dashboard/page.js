"use client";

import { useEffect, useState } from "react";
import { BedDouble, CalendarCheck, DollarSign, Mail, Users } from "lucide-react";
import Link from "next/link";
import { DEFAULT_SITE_NAME, settingValue } from "@/lib/siteDefaults";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ rooms: 0, bookings: 0, users: 0, revenue: 0, newMessages: 0 });
  const [recentBookings, setRecentBookings] = useState([]);
  const [recentMessages, setRecentMessages] = useState([]);
  const [siteName, setSiteName] = useState(DEFAULT_SITE_NAME);

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then((d) => {
      if (d.settings) setSiteName(settingValue(d.settings, "site_name"));
    });
    fetch("/api/rooms").then((r) => r.json()).then((d) => {
      if (d.rooms) setStats((s) => ({ ...s, rooms: d.rooms.length }));
    });
    fetch("/api/bookings").then((r) => r.json()).then((d) => {
      if (d.bookings) {
        setRecentBookings(d.bookings.slice(0, 5));
        setStats((s) => ({
          ...s,
          bookings: d.bookings.length,
          revenue: d.bookings.reduce(
            (sum, b) => sum + (b.payment_status === "paid" ? b.total_amount : 0),
            0
          ),
        }));
      }
    });
    fetch("/api/users")
      .then((r) => r.json())
      .then((d) => {
        if (d.users) setStats((s) => ({ ...s, users: d.users.length }));
      })
      .catch(() => {});
    fetch("/api/contact-messages")
      .then((r) => r.json())
      .then((d) => {
        if (d.messages) {
          setRecentMessages(d.messages.slice(0, 5));
          setStats((s) => ({
            ...s,
            newMessages:
              typeof d.newCount === "number"
                ? d.newCount
                : d.messages.filter((m) => m.status === "new").length,
          }));
        }
      })
      .catch(() => {});
  }, []);

  const cards = [
    { label: "Total Rooms", value: stats.rooms, icon: BedDouble, color: "bg-blue-500", href: "/admin/rooms" },
    { label: "Total Bookings", value: stats.bookings, icon: CalendarCheck, color: "bg-green-500", href: "/admin/bookings" },
    { label: "Revenue", value: `RWF ${stats.revenue.toLocaleString()}`, icon: DollarSign, color: "bg-yellow-500", href: "/admin/bookings" },
    { label: "New Messages", value: stats.newMessages, icon: Mail, color: "bg-indigo-500", href: "/admin/messages" },
    { label: "Users", value: stats.users || "—", icon: Users, color: "bg-purple-500", href: "/admin/users" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-extrabold">{siteName} — Dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Overview of rooms, bookings, messages, and revenue. Edit site text in{" "}
        <Link href="/admin/settings" className="font-bold text-primary hover:underline">
          Settings
        </Link>
        .
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.label}
              href={card.href}
              className="rounded-lg border border-border bg-white p-5 shadow-sm transition hover:border-primary/40 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">{card.label}</p>
                  <p className="mt-1 text-2xl font-extrabold">{card.value}</p>
                </div>
                <div className={`grid h-12 w-12 place-items-center rounded-lg ${card.color} text-white`}>
                  <Icon size={22} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-extrabold">Recent Bookings</h2>
            <Link href="/admin/bookings" className="text-sm font-bold text-primary">
              View all
            </Link>
          </div>
          <div className="mt-3 overflow-x-auto rounded-lg border border-border bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-gray-50 text-left">
                  <th className="px-4 py-3 font-semibold">Booking ID</th>
                  <th className="px-4 py-3 font-semibold">Guest</th>
                  <th className="px-4 py-3 font-semibold">Room</th>
                  <th className="px-4 py-3 font-semibold">Payment</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                      No bookings yet.
                    </td>
                  </tr>
                ) : (
                  recentBookings.map((b) => (
                    <tr key={b.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 font-mono text-xs">{b.booking_id}</td>
                      <td className="px-4 py-3">{b.user?.name || b.user_name || "—"}</td>
                      <td className="px-4 py-3">{b.room?.title || b.room_title || "—"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${
                            b.payment_status === "paid"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {b.payment_status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-extrabold">Contact Messages</h2>
            <Link href="/admin/messages" className="text-sm font-bold text-primary">
              Open inbox
            </Link>
          </div>
          <div className="mt-3 overflow-hidden rounded-lg border border-border bg-white">
            {recentMessages.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                No contact messages yet. Messages from the public Contact page appear here.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {recentMessages.map((m) => (
                  <li key={m.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold">{m.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{m.email}</p>
                        <p className="mt-1 line-clamp-2 text-sm text-foreground/80">{m.message}</p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          m.status === "new"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {m.status}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
