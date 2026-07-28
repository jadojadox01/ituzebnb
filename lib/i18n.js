import { DEFAULT_SETTINGS } from "@/lib/siteDefaults";

/** Admin setting with optional `_fr` field, then translation default, then English setting. */
export function localizedSetting(settings, key, language, t) {
  if (language === "fr") {
    const french = settings?.[`${key}_fr`];
    if (french !== undefined && String(french).trim() !== "") {
      return String(french);
    }
    const translatedDefault = t(`default_${key}`);
    if (translatedDefault && translatedDefault !== `default_${key}`) {
      return translatedDefault;
    }
  }

  const value = settings?.[key];
  if (value !== undefined && String(value).trim() !== "") {
    return String(value);
  }

  if (DEFAULT_SETTINGS[key]) return DEFAULT_SETTINGS[key];

  const fallback = t(`default_${key}`);
  return fallback !== `default_${key}` ? fallback : "";
}

export function tStatus(status, t) {
  const key = `status_${String(status || "").toLowerCase()}`;
  const label = t(key);
  return label !== key ? label : status;
}

export function tPaymentStatus(status, t) {
  const key = `payment_${String(status || "").toLowerCase()}`;
  const label = t(key);
  return label !== key ? label : status;
}

export function tRoomType(type, t) {
  const key = `roomType_${String(type || "").toLowerCase()}`;
  const label = t(key);
  return label !== key ? label : type;
}
