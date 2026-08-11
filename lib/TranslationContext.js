"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import translations from "./translations";

const TranslationContext = createContext(null);

export function TranslationProvider({ children }) {
  const [language, setLanguage] = useState("en");

  useEffect(() => {
    const saved = localStorage.getItem("ituze_language");
    if (saved === "en" || saved === "fr") {
      setLanguage(saved);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("ituze_language", language);
    document.documentElement.lang = language;
  }, [language]);

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
    () => ({ language, setLanguage, toggleLanguage, t }),
    [language, toggleLanguage, t]
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
