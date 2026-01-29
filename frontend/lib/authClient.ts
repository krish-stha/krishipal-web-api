"use client";
import Cookies from "js-cookie";

export function getToken() {
  return Cookies.get("krishipal_token");
}

export function getUser() {
  const raw = Cookies.get("krishipal_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as { id: string; email: string; name: string; role: string };
  } catch {
    return null;
  }
}
