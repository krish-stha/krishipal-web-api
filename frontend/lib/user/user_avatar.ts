// lib/user/user_avatar.ts
"use client";

import Cookies from "js-cookie";

export type CookieUser = {
  name?: string;
  email?: string;

  // backend key (filename)
  profile_picture?: string;

  // frontend convenience (full url)
  profilePicture?: string;

  // fallbacks
  profilePictureUrl?: string;
  avatar?: string;
  photo?: string;
  image?: string;
  profile_photo?: string;
};

export const COOKIE_KEY = "krishipal_user";
export const USER_UPDATED_EVENT = "krishipal_user_updated";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export function normalizePhotoUrl(photo: string | null): string | null {
  if (!photo) return null;

  if (photo.startsWith("http://") || photo.startsWith("https://")) return photo;

  // filename only -> /public/profile_photo
  if (!photo.includes("/")) return `${BACKEND_URL}/public/profile_photo/${photo}`;

  if (photo.startsWith("public/")) return `${BACKEND_URL}/${photo}`;
  if (photo.startsWith("/public/")) return `${BACKEND_URL}${photo}`;

  if (photo.startsWith("profile_photo/")) return `${BACKEND_URL}/public/${photo}`;
  if (photo.startsWith("/profile_photo/")) return `${BACKEND_URL}/public${photo}`;

  if (!photo.startsWith("/")) return `${BACKEND_URL}/${photo}`;
  return `${BACKEND_URL}${photo}`;
}

export function getCookieUser(): CookieUser | null {
  const raw = Cookies.get(COOKIE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getProfilePhoto(u: CookieUser | null): string | null {
  if (!u) return null;

  const raw =
    u.profilePicture ||
    u.profile_picture ||
    u.profilePictureUrl ||
    u.avatar ||
    u.photo ||
    u.image ||
    u.profile_photo ||
    null;

  return normalizePhotoUrl(raw);
}

export function initials(name?: string, email?: string) {
  const n = (name || "").trim();
  if (n) return n[0].toUpperCase();
  const e = (email || "").trim();
  if (e) return e[0].toUpperCase();
  return "U";
}
