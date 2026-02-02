"use client";

import { useEffect, useMemo, useState } from "react";
import Cookies from "js-cookie";
import { Button } from "@/app/auth/components/ui/button";
import { useAuth } from "@/lib/contexts/auth-contexts";

const COOKIE_KEY = "krishipal_user";
const USER_UPDATED_EVENT = "krishipal_user_updated";
const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

function normalize(photo?: string | null) {
  if (!photo) return null;
  if (photo.startsWith("http")) return photo;
  return `${BACKEND_URL}/public/profile_photo/${photo}`;
}

function initials(name?: string, email?: string) {
  return (name?.[0] || email?.[0] || "U").toUpperCase();
}

export default function ProfileAvatarButton() {
  const { user } = useAuth();
  const [photo, setPhoto] = useState<string | null>(null);
  const [name, setName] = useState("");

  const sync = () => {
    const raw = Cookies.get(COOKIE_KEY);
    if (!raw) return;

    const u = JSON.parse(raw);
    setName(u.fullName || u.name || "");
    setPhoto(normalize(u.profile_picture));
  };

  useEffect(() => {
    sync();
    window.addEventListener(USER_UPDATED_EVENT, sync);
    return () => window.removeEventListener(USER_UPDATED_EVENT, sync);
  }, []);

  const fallback = useMemo(
    () => initials(name, user?.email),
    [name, user?.email]
  );

  return (
    <Button className="h-9 bg-green-600 hover:bg-green-700 text-white gap-2">
      <span className="h-7 w-7 rounded-full overflow-hidden bg-white/20 ring-1 ring-white/30 flex items-center justify-center">
        {photo ? (
          <img
            src={`${photo}?t=${Date.now()}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-[11px] font-semibold">{fallback}</span>
        )}
      </span>
      <span className="truncate max-w-[200px]">{user?.email}</span>
    </Button>
  );
}
