"use client";
import Cookies from "js-cookie";

export type CookieUser = {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
};

const cookieOptions = {
  expires: 1,
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};

export function setAuthCookies(user: CookieUser, token: string) {
  Cookies.set("krishipal_user", JSON.stringify(user), cookieOptions);
  Cookies.set("krishipal_token", token, cookieOptions);
}


export function getToken() {
  return Cookies.get("krishipal_token");
}

export function getUser(): CookieUser | null {
  const raw = Cookies.get("krishipal_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CookieUser;
  } catch {
    return null;
  }
}

export function clearAuthCookies() {
  Cookies.remove("krishipal_token", { path: "/" });
  Cookies.remove("krishipal_user", { path: "/" });
}

