"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import translations from "./translations";
import {
  convertFromRwf,
  formatMoney,
  getMonthlyPrice,
  getNightlyPrice,
  normalizeCurrency,
} from "@/lib/currency";

const TranslationContext = createContext(null);

export function TranslationProvider({ children }) {
  const [language, setLanguage] = useState("en");
  const [currency, setCurrencyState] = useState("RWF");
  const [fx, setFx] = useState({
    loading: true,
    ok: false,
    rwfPerUsd: null,
    updatedAt: null,
    error: "",
  });

  useEffect(() => {
    const savedLang = localStorage.getItem("ituze_language");
    if (savedLang === "en" || savedLang === "fr") {
      setLanguage(savedLang);
    }
    const savedCurrency = localStorage.getItem("ituze_currency");
    if (savedCurrency === "RWF" || savedCurrency === "USD") {
      setCurrencyState(savedCurrency);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("ituze_language", language);
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    localStorage.setItem("ituze_currency", currency);
  }, [currency]);

  useEffect(() => {
    let cancelled = false;

    const loadRates = async () => {
      try {
        const res = await fetch("/api/exchange-rates", { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok || !data.ok) {
          setFx({
            loading: false,
            ok: false,
            rwfPerUsd: null,
            updatedAt: null,
            error: data.error || "Could not load live rates",
          });
          return;
        }
        setFx({
          loading: false,
          ok: true,
          rwfPerUsd: Number(data.rwfPerUsd),
          updatedAt: data.updatedAt || null,
          error: "",
        });
      } catch {
        if (!cancelled) {
          setFx({
            loading: false,
            ok: false,
            rwfPerUsd: null,
            updatedAt: null,
            error: "Could not load live rates",
          });
        }
      }
    };

    loadRates();
    const interval = setInterval(loadRates, 30 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const setCurrency = useCallback((value) => {
    setCurrencyState(normalizeCurrency(value));
  }, []);

  const toggleCurrency = useCallback(() => {
    setCurrencyState((prev) => (prev === "USD" ? "RWF" : "USD"));
  }, []);

  const t = useCallback((key, vars = {}) => {
    let text = translations[language]?.[key] || translations.en[key] || key;
    Object.entries(vars).forEach(([name, value]) => {
      text = text.replaceAll(`{${name}}`, String(value ?? ""));
    });
    return text;
  }, [language]);

  const toggleLanguage = useCallback(() => {
    setLanguage((prev) => (prev === "en" ? "fr" : "en"));
  }, []);

  const convertRoomAmount = useCallback(
    (amountRwf, targetCurrency = currency) =>
      convertFromRwf(amountRwf, targetCurrency, fx.rwfPerUsd),
    [currency, fx.rwfPerUsd]
  );

  const displayNightly = useCallback(
    (room, targetCurrency = currency) =>
      getNightlyPrice(room, targetCurrency, fx.rwfPerUsd),
    [currency, fx.rwfPerUsd]
  );

  const displayMonthly = useCallback(
    (room, targetCurrency = currency) =>
      getMonthlyPrice(room, targetCurrency, fx.rwfPerUsd),
    [currency, fx.rwfPerUsd]
  );

  const formatDisplay = useCallback(
    (amountRwf, targetCurrency = currency) => {
      const converted = convertFromRwf(amountRwf, targetCurrency, fx.rwfPerUsd);
      if (converted == null && normalizeCurrency(targetCurrency) === "USD") {
        return formatMoney(amountRwf, "RWF");
      }
      return formatMoney(converted ?? amountRwf, targetCurrency);
    },
    [currency, fx.rwfPerUsd]
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      toggleLanguage,
      currency,
      setCurrency,
      toggleCurrency,
      t,
      fx,
      convertRoomAmount,
      displayNightly,
      displayMonthly,
      formatDisplay,
    }),
    [
      language,
      toggleLanguage,
      currency,
      setCurrency,
      toggleCurrency,
      t,
      fx,
      convertRoomAmount,
      displayNightly,
      displayMonthly,
      formatDisplay,
    ]
  );

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error("useTranslation must be used within a TranslationProvider");
  }
  return context;
}
