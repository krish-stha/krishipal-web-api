"use client";

import { useEffect, useMemo, useState } from "react";
import Cookies from "js-cookie";
import { Button } from "@/app/auth/components/ui/button";
import { useAuth } from "@/lib/contexts/auth-contexts";

type CookieUser = {
  name?: string;
  fullName?: string;
  email?: string;

  profile_picture?: string; // filename from backend
  profilePicture?: string; // full url (optional)
};

const COOKIE_KEY = "krishipal_user";
const USER_UPDATED_EVENT = "krishipal_user_updated";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

function normalizePhotoUrl(photo: string | null): string | null {
  if (!photo) return null;
  if (photo.startsWith("http://") || photo.startsWith("https://")) return photo;

  // filename only
  if (!photo.includes("/")) return `${BACKEND_URL}/public/profile_photo/${photo}`;

  if (photo.startsWith("public/")) return `${BACKEND_URL}/${photo}`;
  if (photo.startsWith("/public/")) return `${BACKEND_URL}${photo}`;

  if (photo.startsWith("profile_photo/")) return `${BACKEND_URL}/public/${photo}`;
  if (photo.startsWith("/profile_photo/")) return `${BACKEND_URL}/public${photo}`;

  if (!photo.startsWith("/")) return `${BACKEND_URL}/${photo}`;
  return `${BACKEND_URL}${photo}`;
}

function withCacheBust(url: string | null) {
  if (!url) return null;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}t=${Date.now()}`;
}

function getCookieUser(): CookieUser | null {
  const raw = Cookies.get(COOKIE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function getProfilePhoto(u: CookieUser | null): string | null {
  if (!u) return null;
  const raw = u.profilePicture || u.profile_picture || null;
  return normalizePhotoUrl(raw);
}

function initials(name?: string, email?: string) {
  const n = (name || "").trim();
  if (n) return n[0].toUpperCase();
  const e = (email || "").trim();
  if (e) return e[0].toUpperCase();
  return "U";
}

export default function ProfileButton() {
  const { user } = useAuth();

  const [cookieName, setCookieName] = useState("");
  const [cookieEmail, setCookieEmail] = useState("");
  const [cookiePhoto, setCookiePhoto] = useState<string | null>(null);

  const syncFromCookie = () => {
    const cu = getCookieUser();
    setCookieName((cu as any)?.fullName || cu?.name || "");
    setCookieEmail(cu?.email || "");
    setCookiePhoto(withCacheBust(getProfilePhoto(cu)));
  };

  useEffect(() => {
    syncFromCookie();
    window.addEventListener(USER_UPDATED_EVENT, syncFromCookie);
    return () => window.removeEventListener(USER_UPDATED_EVENT, syncFromCookie);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email]);

  const avatarInitial = useMemo(
    () => initials(cookieName, cookieEmail || user?.email),
    [cookieName, cookieEmail, user?.email]
  );

  return (
    <Button className="h-9 bg-green-600 hover:bg-green-700 text-white gap-2">
      <span className="h-7 w-7 rounded-full overflow-hidden bg-white/20 ring-1 ring-white/30 flex items-center justify-center">
        {cookiePhoto ? (
          <img
            src={cookiePhoto}
            alt="Profile"
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-[11px] font-semibold">{avatarInitial}</span>
        )}
      </span>

      <span className="max-w-[220px] truncate">{user?.email}</span>
    </Button>
  );
}
