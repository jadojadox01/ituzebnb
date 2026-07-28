#!/usr/bin/env node
/**
 * Seed Neon / PostgreSQL with admin user, sample rooms, and default settings.
 * Usage: node scripts/seed-neon.js
 */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const DEFAULT_SETTINGS = {
  site_name: "ITUZE B&B",
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

const prisma = new PrismaClient();

async function main() {
  const adminCount = await prisma.user.count({ where: { email: "admin@ituzebnb.com" } });
  if (adminCount === 0) {
    const hashedPassword = bcrypt.hashSync("admin123", 10);
    await prisma.user.create({
      data: {
        name: "Admin",
        email: "admin@ituzebnb.com",
        password: hashedPassword,
        role: "admin",
      },
    });
    console.log("Admin user created: admin@ituzebnb.com / admin123");
  } else {
    console.log("Admin user already exists");
  }

  const roomCount = await prisma.room.count();
  if (roomCount === 0) {
    const rooms = [
      {
        title: "Single Room - Garden View",
        room_type: "single",
        price_daily: 25000,
        price_monthly: 450000,
        currency: "RWF",
        status: "available",
        description: "A cozy single room with garden views, perfect for solo travelers.",
        beds: 1,
        bathrooms: 1,
        location: "Kicukiro, Kigali",
        capacity: 1,
        amenities: "Free WiFi, Desk, Fan, Wardrobe",
        images: "/images/background1.jpeg",
      },
      {
        title: "Double Room - City View",
        room_type: "double",
        price_daily: 40000,
        price_monthly: 700000,
        currency: "RWF",
        status: "available",
        description: "Spacious double room with stunning city views and modern amenities.",
        beds: 1,
        bathrooms: 1,
        location: "Nyarugenge, Kigali",
        capacity: 2,
        amenities: "Free WiFi, TV, Desk, Fan, Wardrobe, Balcony",
        images: "/images/background2.jpeg",
      },
      {
        title: "Twin Bed Room - Family",
        room_type: "twin",
        price_daily: 50000,
        price_monthly: 900000,
        currency: "RWF",
        status: "available",
        description: "Perfect for friends or small families with two separate beds.",
        beds: 2,
        bathrooms: 1,
        location: "Gasabo, Kigali",
        capacity: 2,
        amenities: "Free WiFi, TV, Desk, Fan, Wardrobe, Garden Access",
        images: "/images/background3.jpeg",
      },
    ];

    for (const room of rooms) {
      await prisma.room.create({ data: room });
    }
    console.log("Sample rooms created");
  } else {
    console.log(`Rooms already exist (${roomCount})`);
  }

  const settingsCount = await prisma.setting.count();
  if (settingsCount === 0) {
    for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
      await prisma.setting.create({ data: { key, value: String(value) } });
    }
    console.log("Default settings created");
  } else {
    console.log("Settings already exist");
  }
}

main()
  .then(() => {
    console.log("Seed complete");
    return prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Seed failed:", error.message);
    await prisma.$disconnect();
    process.exit(1);
  });
