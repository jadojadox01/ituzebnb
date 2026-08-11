"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, BedDouble, CalendarCheck, Settings, ImagePlus, LogOut, Menu, X, Home, CreditCard, Users, Mail, CalendarX
} from "lucide-react";
import { DEFAULT_SITE_NAME } from "@/lib/siteDefaults";

const sidebarLinks = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Rooms", href: "/admin/rooms", icon: BedDouble },
  { label: "Bookings", href: "/admin/bookings", icon: CalendarCheck },
  { label: "Blocked dates", href: "/admin/blocked-dates", icon: CalendarX },
  { label: "Messages", href: "/admin/messages", icon: Mail },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Settings", href: "/admin/settings", icon: Settings },
  { label: "Hero Section", href: "/admin/hero-ads", icon: ImagePlus },
  { label: "Payments", href: "/admin/payments", icon: CreditCard },
];

export default function AdminLayout({ children }) {
  const [user, setUser] = useState(null);
  const [siteName, setSiteName] = useState(DEFAULT_SITE_NAME);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [newMessages, setNewMessages] = useState(0);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me").then((res) => res.json()),
      fetch("/api/settings").then((res) => res.json()),
      fetch("/api/contact-messages").then((res) => res.json()).catch(() => ({})),
    ])
      .then(([authData, settingsData, messagesData]) => {
        if (authData.user && authData.user.role === "admin") {
          setUser(authData.user);
          if (settingsData.settings?.site_name) {
            setSiteName(settingsData.settings.site_name);
          }
          if (typeof messagesData.newCount === "number") {
            setNewMessages(messagesData.newCount);
          } else if (Array.isArray(messagesData.messages)) {
            setNewMessages(messagesData.messages.filter((m) => m.status === "new").length);
          }
        } else {
          router.push("/login");
        }
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router, pathname]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-3 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-border bg-white shadow-sm transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:relative lg:translate-x-0`}>
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground text-sm font-bold">A</span>
            <span className="text-sm font-extrabold">{siteName}</span>
          </Link>
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>
        <nav className="p-3 space-y-1">
          {sidebarLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground/70 hover:bg-gray-100 hover:text-foreground"
                }`}
              >
                <Icon size={18} />
                <span className="flex-1">{item.label}</span>
                {item.href === "/admin/messages" && newMessages > 0 ? (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      isActive ? "bg-white/20 text-white" : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {newMessages}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 border-t border-border p-3">
          <Link href="/" className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold text-foreground/70 hover:bg-gray-100 hover:text-foreground transition">
            <Home size={18} />
            View Site
          </Link>
          <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition">
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-white px-4 lg:px-6">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-foreground/70">{user?.name}</span>
            <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
              {user?.name?.charAt(0)?.toUpperCase()}
            </span>
          </div>
        </header>
        <main className="flex-1 overflow-x-auto p-3 sm:p-4 lg:p-6">
          <div className="mx-auto w-full max-w-7xl min-w-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}