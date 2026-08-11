"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { BookingWidget } from "@/components/BookingWidget";
import { BookingSearchResults } from "@/components/BookingSearchResults";
import { BookingCheckout } from "@/components/BookingCheckout";
import { useTranslation } from "@/lib/TranslationContext";

function BookPageContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState({});
  const [results, setResults] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const params = useMemo(
    () => ({
      check_in: searchParams.get("check_in") || "",
      check_out: searchParams.get("check_out") || "",
      adults: searchParams.get("adults") || "2",
      children: searchParams.get("children") || "0",
      rooms: searchParams.get("rooms") || "1",
      room_id: searchParams.get("room_id") || "",
      step: searchParams.get("step") || "",
    }),
    [searchParams]
  );

  const runSearch = useCallback(async (overrides = {}) => {
    const p = { ...params, ...overrides };
    if (!p.check_in || !p.check_out) return;

    setLoading(true);
    setError("");
    setSelectedRoom(null);
    try {
      const qs = new URLSearchParams({
        check_in: p.check_in,
        check_out: p.check_out,
        adults: p.adults,
        children: p.children,
        rooms: p.rooms,
      });
      const res = await fetch(`/api/availability/search?${qs}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t("widgetSearchFailed"));
        setResults(null);
        return;
      }
      setResults(data);

      const roomId = p.room_id || params.room_id;
      if (roomId) {
        const match = data.rooms.find((r) => String(r.id) === String(roomId));
        if (match) setSelectedRoom(match);
      }
    } catch {
      setError(t("widgetSearchFailed"));
    } finally {
      setLoading(false);
    }
  }, [params, t]);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) setUser(d.user);
      })
      .catch(() => {});
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) setSettings(d.settings);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (params.check_in && params.check_out) {
      runSearch();
    }
  }, [params.check_in, params.check_out, params.adults, params.children, params.rooms, params.room_id, runSearch]);

  const showCheckout = Boolean(selectedRoom && params.step === "checkout");

  return (
    <main>
      <SiteHeader />
      <section className="border-b border-border bg-gradient-to-b from-primary/5 to-background">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="text-sm font-extrabold uppercase text-primary">{t("widgetBookNow")}</p>
          <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">{t("widgetPageTitle")}</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">{t("widgetPageSubtitle")}</p>
          <div className="mt-8">
            <BookingWidget
              variant="inline"
              navigateToBook={false}
              onSearch={async (p) => {
                const qs = new URLSearchParams(p).toString();
                window.history.replaceState(null, "", `/book?${qs}`);
                await runSearch(p);
              }}
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {showCheckout && selectedRoom ? (
          <div>
            <button
              type="button"
              onClick={() => {
                setSelectedRoom(null);
                window.history.replaceState(
                  null,
                  "",
                  `/book?${new URLSearchParams({
                    check_in: params.check_in,
                    check_out: params.check_out,
                    adults: params.adults,
                    children: params.children,
                    rooms: params.rooms,
                  }).toString()}`
                );
              }}
              className="mb-4 text-sm font-bold text-primary hover:underline"
            >
              ← {t("widgetBackToResults")}
            </button>
            <BookingCheckout room={selectedRoom} searchParams={params} user={user} />
          </div>
        ) : (
          <BookingSearchResults
            results={results}
            loading={loading}
            error={error}
            searchParams={params}
            onSelectRoom={(room) => {
              setSelectedRoom(room);
              const qs = new URLSearchParams({
                ...params,
                room_id: String(room.id),
                step: "checkout",
              }).toString();
              window.history.replaceState(null, "", `/book?${qs}`);
            }}
          />
        )}
      </section>
      <SiteFooter settings={settings} />
    </main>
  );
}

export default function BookPage() {
  return (
    <Suspense
      fallback={
        <main>
          <SiteHeader />
          <div className="flex min-h-[50vh] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        </main>
      }
    >
      <BookPageContent />
    </Suspense>
  );
}
