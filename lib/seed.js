import prisma from "./prisma";
import bcrypt from "bcryptjs";
import { DEFAULT_SETTINGS } from "./siteDefaults";

export async function seedDatabase() {
  // Check if admin exists
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
  }

  // Seed sample rooms if none exist
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
        beds: 1, bathrooms: 1, location: "Kicukiro, Kigali", capacity: 1,
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
        beds: 1, bathrooms: 1, location: "Nyarugenge, Kigali", capacity: 2,
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
        beds: 2, bathrooms: 1, location: "Gasabo, Kigali", capacity: 2,
        amenities: "Free WiFi, TV, Desk, Fan, Wardrobe, Garden Access",
        images: "/images/background3.jpeg",
      },
    ];

    for (const room of rooms) {
      await prisma.room.create({ data: room });
    }
    console.log("Sample rooms created");
  }

  // Seed default settings
  const settingsCount = await prisma.setting.count();
  if (settingsCount === 0) {
    for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
      await prisma.setting.create({ data: { key, value: String(value) } });
    }
    console.log("Default settings created");
  }
}