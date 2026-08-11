"use client";

import { useEffect, useMemo, useState } from "react";
import { Filter, Search, X } from "lucide-react";

function formatRwf(amount) {
  return `RWF ${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(amount || 0)}`;
}

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [roomFilter, setRoomFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [actionError, setActionError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const load = async () => {
    const res = await fetch("/api/bookings");
    const d = await res.json();
    if (d.bookings) {
      setBookings(d.bookings);
      setSelectedBooking((prev) => {
        if (!prev) return null;
        return d.bookings.find((b) => b.id === prev.id) || null;
      });
    }
  };

  useEffect(() => {
    load();
  }, []);

  const roomOptions = useMemo(() => {
    const titles = new Set(
      bookings.map((b) => b.room?.title || b.room_title).filter(Boolean)
    );
    return Array.from(titles).sort();
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    let list = [...bookings];

    if (statusFilter !== "all") {
      list = list.filter((b) => b.status === statusFilter);
    }
    if (paymentFilter !== "all") {
      list = list.filter((b) => b.payment_status === paymentFilter);
    }
    if (roomFilter !== "all") {
      list = list.filter((b) => (b.room?.title || b.room_title) === roomFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (b) =>
          b.booking_id?.toLowerCase().includes(q) ||
          (b.user?.name || b.user_name || "").toLowerCase().includes(q) ||
          (b.user?.email || b.user_email || "").toLowerCase().includes(q) ||
          (b.room?.title || b.room_title || "").toLowerCase().includes(q)
      );
    }

    return list;
  }, [bookings, statusFilter, paymentFilter, roomFilter, search]);

  const sortedBookings = useMemo(() => {
    const list = [...filteredBookings];
    list.sort((a, b) => {
      const aTime = new Date(a.created_at || 0).getTime() || 0;
      const bTime = new Date(b.created_at || 0).getTime() || 0;
      if (aTime !== bTime) return sortOrder === "newest" ? bTime - aTime : aTime - bTime;
      return sortOrder === "newest" ? (b.id || 0) - (a.id || 0) : (a.id || 0) - (b.id || 0);
    });
    return list;
  }, [filteredBookings, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(sortedBookings.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedBookings = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return sortedBookings.slice(start, start + pageSize);
  }, [sortedBookings, safePage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, paymentFilter, roomFilter, sortOrder, pageSize]);

  const updateBooking = async (id, patch) => {
    setActionError("");
    setActionLoading(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...patch }),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || "Failed to update booking");
        return false;
      }
      await load();
      return true;
    } catch {
      setActionError("Failed to update booking");
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const badgeClass = (s) =>
    s === "confirmed"
      ? "bg-green-100 text-green-700"
      : s === "checked_in"
        ? "bg-blue-100 text-blue-700"
        : s === "pending"
          ? "bg-yellow-100 text-yellow-700"
          : s === "cancelled"
            ? "bg-red-100 text-red-700"
            : "bg-gray-100 text-gray-700";

  const paymentBadge = (s) =>
    s === "paid"
      ? "bg-green-100 text-green-700"
      : s === "pending"
        ? "bg-amber-100 text-amber-700"
        : s === "failed"
          ? "bg-red-100 text-red-700"
          : "bg-gray-100 text-gray-700";

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setPaymentFilter("all");
    setRoomFilter("all");
    setSortOrder("newest");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    search.trim() || statusFilter !== "all" || paymentFilter !== "all" || roomFilter !== "all";

  const ActionButtons = ({ booking, compact = false }) => (
    <div className={`flex flex-wrap gap-1 ${compact ? "" : "gap-2"}`}>
      {booking.status === "pending" && (
        <>
          <button
            type="button"
            disabled={actionLoading}
            onClick={() => updateBooking(booking.id, { status: "confirmed" })}
            className="rounded-md bg-green-500 px-2 py-1 text-xs font-bold text-white hover:bg-green-600 disabled:opacity-60"
          >
            {booking.payment_status === "paid" ? "Approve" : "Confirm"}
          </button>
          <button
            type="button"
            disabled={actionLoading}
            onClick={() => updateBooking(booking.id, { action: "reject" })}
            className="rounded-md bg-red-500 px-2 py-1 text-xs font-bold text-white hover:bg-red-600 disabled:opacity-60"
          >
            Reject
          </button>
        </>
      )}
      {booking.payment_status !== "paid" && booking.status !== "cancelled" && booking.status !== "completed" && (
        <button
          type="button"
          disabled={actionLoading}
          onClick={() => updateBooking(booking.id, { payment_status: "paid" })}
          className="rounded-md bg-emerald-600 px-2 py-1 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          Mark Paid
        </button>
      )}
      {(booking.status === "confirmed" || (booking.status === "pending" && booking.payment_status === "paid")) && (
        <button
          type="button"
          disabled={actionLoading}
          onClick={() => updateBooking(booking.id, { action: "check_in" })}
          className="rounded-md bg-blue-500 px-2 py-1 text-xs font-bold text-white hover:bg-blue-600 disabled:opacity-60"
        >
          Check in
        </button>
      )}
      {booking.status === "checked_in" && (
        <button
          type="button"
          disabled={actionLoading}
          onClick={() => updateBooking(booking.id, { action: "check_out" })}
          className="rounded-md bg-indigo-600 px-2 py-1 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          Check out
        </button>
      )}
      {booking.status === "confirmed" && (
        <button
          type="button"
          disabled={actionLoading}
          onClick={() =>
            updateBooking(booking.id, {
              status: "completed",
              payment_status: booking.payment_status === "paid" ? "paid" : booking.payment_status,
            })
          }
          className="rounded-md bg-gray-600 px-2 py-1 text-xs font-bold text-white hover:bg-gray-700 disabled:opacity-60"
        >
          Complete
        </button>
      )}
      <a
        href={`/api/bookings/${booking.id}/invoice`}
        className="rounded-md border border-border bg-white px-2 py-1 text-xs font-bold hover:bg-gray-50"
        onClick={(e) => e.stopPropagation()}
      >
        Invoice PDF
      </a>
    </div>
  );

  return (
    <div>
      <h1 className="text-2xl font-extrabold">All Bookings</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        View and manage all client bookings. Click any booking to open full details.
      </p>

      {actionError && (
        <div className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {actionError}
        </div>
      )}

      <div className="mt-6 rounded-lg border border-border bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_repeat(3,minmax(140px,180px))_auto]">
          <label className="flex min-h-10 items-center gap-2 rounded-md border border-input bg-background px-3">
            <Search size={16} className="shrink-0 text-muted-foreground" />
            <input
              className="w-full bg-transparent text-sm outline-none"
              placeholder="Search booking ID, guest, email, room..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <select
            className="min-h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            className="min-h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
          >
            <option value="all">All payments</option>
            <option value="unpaid">Unpaid</option>
            <option value="pending">Payment pending</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
          </select>
          <select
            className="min-h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
            value={roomFilter}
            onChange={(e) => setRoomFilter(e.target.value)}
          >
            <option value="all">All rooms</option>
            {roomOptions.map((title) => (
              <option key={title} value={title}>
                {title}
              </option>
            ))}
          </select>
          <select
            className="min-h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex min-h-10 items-center justify-center gap-1 rounded-md border border-border px-3 text-sm font-bold hover:bg-gray-50"
            >
              <Filter size={14} />
              Clear
            </button>
          ) : (
            <div className="hidden min-h-10 items-center justify-center text-xs font-semibold text-muted-foreground lg:flex">
              {bookings.length} total
            </div>
          )}
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>
            Showing {sortedBookings.length === 0 ? 0 : (safePage - 1) * pageSize + 1}-
            {Math.min(safePage * pageSize, sortedBookings.length)} of {sortedBookings.length} filtered ({bookings.length} total)
          </p>
          <label className="inline-flex items-center gap-2">
            <span>Rows:</span>
            <select
              className="min-h-8 rounded-md border border-input bg-background px-2 text-xs outline-none focus:border-primary"
              value={pageSize}
              onChange={(e) => setPageSize(parseInt(e.target.value, 10))}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </label>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-gray-50 text-left">
              <th className="px-4 py-3 font-semibold">Booking ID</th>
              <th className="px-4 py-3 font-semibold">Guest</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Room</th>
              <th className="px-4 py-3 font-semibold">Check In</th>
              <th className="px-4 py-3 font-semibold">Check Out</th>
              <th className="px-4 py-3 font-semibold">Amount</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Payment</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedBookings.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">
                  {bookings.length === 0 ? "No bookings yet." : "No bookings match your filters."}
                </td>
              </tr>
            ) : (
              paginatedBookings.map((b) => (
                <tr
                  key={b.id}
                  className="cursor-pointer border-b border-border last:border-0 hover:bg-gray-50"
                  onClick={() => {
                    setActionError("");
                    setSelectedBooking(b);
                  }}
                >
                  <td className="px-4 py-3 font-mono text-xs">{b.booking_id}</td>
                  <td className="px-4 py-3">{b.user?.name || b.user_name}</td>
                  <td className="px-4 py-3 text-xs">{b.user?.email || b.user_email}</td>
                  <td className="px-4 py-3">{b.room?.title || b.room_title}</td>
                  <td className="px-4 py-3">{b.check_in}</td>
                  <td className="px-4 py-3">{b.check_out}</td>
                  <td className="px-4 py-3">{formatRwf(b.total_amount)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${badgeClass(b.status)}`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${paymentBadge(b.payment_status)}`}>
                      {b.payment_status}
                    </span>
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <ActionButtons booking={b} compact />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
        <p className="text-muted-foreground">
          Page {safePage} of {totalPages}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="rounded-md border border-border px-3 py-1.5 font-semibold disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="rounded-md border border-border px-3 py-1.5 font-semibold disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex bg-black/70 p-0 sm:p-3" onClick={() => setSelectedBooking(null)}>
          <div
            className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-white shadow-2xl sm:h-auto sm:max-h-[96vh] sm:rounded-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-4 py-4 sm:px-6">
              <div className="min-w-0">
                <h2 className="text-xl font-extrabold sm:text-2xl">Booking Details</h2>
                <p className="mt-1 break-all font-mono text-sm text-muted-foreground">{selectedBooking.booking_id}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-md hover:bg-gray-100"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
              <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-lg bg-gray-50 p-4 sm:col-span-2 lg:col-span-1">
                  <h3 className="text-sm font-bold uppercase text-muted-foreground">Guest Information</h3>
                  <p className="mt-2 text-lg font-extrabold">{selectedBooking.user?.name || selectedBooking.user_name}</p>
                  <p className="break-all text-sm text-muted-foreground">{selectedBooking.user?.email || selectedBooking.user_email}</p>
                  <p className="text-sm text-muted-foreground">{selectedBooking.user?.phone || selectedBooking.user_phone || "—"}</p>
                </div>

                <div className="rounded-lg bg-gray-50 p-4">
                  <h3 className="text-sm font-bold uppercase text-muted-foreground">Room Details</h3>
                  <p className="mt-2 text-lg font-extrabold">{selectedBooking.room?.title || selectedBooking.room_title}</p>
                  <p className="text-sm capitalize text-muted-foreground">
                    {selectedBooking.room?.room_type || selectedBooking.room_type} Room
                  </p>
                </div>

                <div className="rounded-lg bg-gray-50 p-4">
                  <h3 className="text-sm font-bold uppercase text-muted-foreground">Stay Period</h3>
                  <p className="mt-2 font-semibold">Check-in: {selectedBooking.check_in}</p>
                  <p className="font-semibold">Check-out: {selectedBooking.check_out}</p>
                  <p className="mt-1 text-sm text-muted-foreground">Guests: {selectedBooking.guests}</p>
                </div>

                <div className="rounded-lg bg-gray-50 p-4 sm:col-span-2 lg:col-span-3">
                  <h3 className="text-sm font-bold uppercase text-muted-foreground">Payment</h3>
                  <p className="mt-2 text-2xl font-extrabold sm:text-3xl">{formatRwf(selectedBooking.total_amount)}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${badgeClass(selectedBooking.status)}`}>
                      {selectedBooking.status}
                    </span>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${paymentBadge(selectedBooking.payment_status)}`}>
                      {selectedBooking.payment_status}
                    </span>
                    {selectedBooking.payment_method ? (
                      <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">
                        {selectedBooking.payment_method}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              {selectedBooking.special_requests && (
                <div className="mx-auto mt-4 max-w-5xl rounded-lg bg-gray-50 p-4">
                  <h3 className="text-sm font-bold uppercase text-muted-foreground">Special Requests</h3>
                  <p className="mt-2 whitespace-pre-wrap">{selectedBooking.special_requests}</p>
                </div>
              )}

              {selectedBooking.payment_details && (
                <div className="mx-auto mt-4 max-w-5xl rounded-lg bg-gray-50 p-4">
                  <h3 className="text-sm font-bold uppercase text-muted-foreground">Payment Details</h3>
                  <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-all text-xs text-muted-foreground">
                    {(() => {
                      try {
                        return JSON.stringify(JSON.parse(selectedBooking.payment_details), null, 2);
                      } catch {
                        return selectedBooking.payment_details;
                      }
                    })()}
                  </pre>
                </div>
              )}
            </div>

            <div className="shrink-0 border-t border-border px-4 py-4 sm:px-6">
              <div className="mx-auto flex max-w-5xl flex-wrap gap-2">
                <ActionButtons booking={selectedBooking} />
                <button
                  type="button"
                  onClick={() => setSelectedBooking(null)}
                  className="rounded-md border border-border px-4 py-2 text-sm font-bold hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
