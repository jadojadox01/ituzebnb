import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

function getJwtSecret() {
  const secret = String(process.env.JWT_SECRET || "").trim();
  if (secret) return secret;

  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET is required in production");
  }

  // Local/dev fallback only
  return "ituze-bnb-dev-only-secret";
}

export function signToken(payload) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "7d" });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, getJwtSecret());
  } catch {
    return null;
  }
}

export async function getAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("ituze_token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function requireAuth() {
  const user = await getAuth();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function requireAdmin() {
  const user = await getAuth();
  if (!user || user.role !== "admin") {
    throw new Error("Forbidden: Admins only");
  }
  return user;
}

export function createSessionCookie(token) {
  return {
    name: "ituze_token",
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  };
}
