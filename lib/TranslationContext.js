"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import translations from "./translations";
import { normalizeCurrency } from "@/lib/currency";

const TranslationContext = createContext(null);

export function TranslationProvider({ children }) {
  const [language, setLanguage] = useState("en");
  const [currency, setCurrencyState] = useState("RWF");

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

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      toggleLanguage,
      currency,
      setCurrency,
      toggleCurrency,
      t,
    }),
    [language, toggleLanguage, currency, setCurrency, toggleCurrency, t]
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
