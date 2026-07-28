export const DEFAULT_SITE_NAME = "ITUZE B&B";

export const DEFAULT_SETTINGS = {
  site_name: DEFAULT_SITE_NAME,
  site_logo: "",
  site_description:
    "A welcoming bed & breakfast with comfortable rooms and straightforward online booking.",
  hero_title: "Your stay in Kigali, made simple",
  hero_subtitle:
    "Browse available rooms, compare nightly rates, and book your stay in a few easy steps.",
  hero_card_title: "Book with confidence",
  hero_card_text: "Real rooms, live availability, and secure Mobile Money checkout.",
  rooms_section_subtitle:
    "Every listing below comes from your live inventory — no placeholders, no fake availability.",
  about_section_title: "A stay that feels considered",
  guests_expect_text:
    "Comfortable rooms, clear nightly rates in RWF, and a booking flow you can complete in minutes.",
  cta_title: "Ready to reserve your room?",
  cta_subtitle: "Create an account, pick your dates, and pay with Mobile Money when you are ready.",
  about_text:
    "ITUZE B&B offers comfortable rooms in Kigali with clear pricing, warm hospitality, and an easy online booking experience.",
  mission: "To give every guest a calm, authentic stay with transparent booking and reliable service.",
  vision: "To be a trusted bed & breakfast for travelers who value comfort and simplicity.",
  contact_heading: "Get in touch",
  contact_subtitle: "Questions about a room, booking, or your stay? Reach out and we will follow up.",
  contact_phone: "+250 789 367 984, +250 733 722 113, +32 477 302 277",
  contact_email: "ituzeairbnb@gmail.com",
  contact_address: "Kigali, Rwanda",
  footer_copyright: `© ${new Date().getFullYear()} ITUZE B&B. All rights reserved.`,
};

export function settingValue(settings, key) {
  const value = settings?.[key];
  if (value !== undefined && value !== null && String(value).trim() !== "") {
    return String(value);
  }
  return DEFAULT_SETTINGS[key] ?? "";
}
