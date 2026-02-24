"use client";

import Link from "next/link";
import Image from "next/image";
import { ExternalLink, LogOut, Search } from "lucide-react";
import { Button } from "@/app/auth/components/ui/button";
import { useAuth } from "@/lib/contexts/auth-contexts";
import Cookies from "js-cookie";
import { useEffect, useMemo, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import UserProfilePanel from "@/app/user/profile/UserProfilePanel";

// ✅ public settings hook (same as Header.tsx)
import { usePublicSettings } from "@/lib/api/hooks/usePublicSettings";

type CookieUser = {
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

const COOKIE_KEY = "krishipal_user";
const USER_UPDATED_EVENT = "krishipal_user_updated";
const PROFILE_CLOSE_EVENT = "krishipal_profile_close";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

// ---------------- helpers (same as Header.tsx) ----------------
function normalizePhotoUrl(photo: string | null): string | null {
  if (!photo) return null;

  if (photo.startsWith("http://") || photo.startsWith("https://")) return photo;

  if (!photo.includes("/"))
    return `${BACKEND_URL}/public/profile_photo/${photo}`;

  if (photo.startsWith("public/")) return `${BACKEND_URL}/${photo}`;
  if (photo.startsWith("/public/")) return `${BACKEND_URL}${photo}`;

  if (photo.startsWith("profile_photo/"))
    return `${BACKEND_URL}/public/${photo}`;
  if (photo.startsWith("/profile_photo/"))
    return `${BACKEND_URL}/public${photo}`;

  if (!photo.startsWith("/")) return `${BACKEND_URL}/${photo}`;
  return `${BACKEND_URL}${photo}`;
}

function withCacheBust(url: string | null): string | null {
  if (!url) return null;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}t=${Date.now()}`;
}

function getCookieUser(): CookieUser | null {
  const raw = Cookies.get(COOKIE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CookieUser;
  } catch {
    return null;
  }
}

function getProfilePhoto(u: CookieUser | null): string | null {
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

function initials(name?: string, email?: string) {
  const n = (name || "").trim();
  if (n) return n[0].toUpperCase();
  const e = (email || "").trim();
  if (e) return e[0].toUpperCase();
  return "U";
}

function isRemoteUrl(src: string) {
  return src.startsWith("http://") || src.startsWith("https://");
}

function resolveStoreLogo(storeLogo?: string | null) {
  const v = String(storeLogo || "").trim();
  if (!v) return "/images/krishipal_logo.png";

  if (v.startsWith("http://") || v.startsWith("https://")) return v;
  if (v.startsWith("/")) return v;

  return `${BACKEND_URL}/public/store_logo/${v}`;
}
// -------------------------------------------------------------

export function AdminHeader() {
  const { user, logout, isLoading } = useAuth();

  const [profileOpen, setProfileOpen] = useState(false);

  const [cookieName, setCookieName] = useState("");
  const [cookieEmail, setCookieEmail] = useState("");
  const [cookiePhoto, setCookiePhoto] = useState<string | null>(null);

  // ✅ public settings (store name/logo)
  const settings: any = usePublicSettings();
  const storeName =
    String(settings?.storeName || "KrishiPal").trim() || "KrishiPal";
  const storeLogo = resolveStoreLogo(settings?.storeLogo);

  const syncFromCookie = () => {
    const cu = getCookieUser();
    setCookieName(cu?.name || "");
    setCookieEmail(cu?.email || "");
    setCookiePhoto(withCacheBust(getProfilePhoto(cu)));
  };

  useEffect(() => {
    syncFromCookie();

    const handler = () => syncFromCookie();
    window.addEventListener(USER_UPDATED_EVENT, handler);
    return () => window.removeEventListener(USER_UPDATED_EVENT, handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email]);

  useEffect(() => {
    const close = () => setProfileOpen(false);
    window.addEventListener(PROFILE_CLOSE_EVENT, close);
    return () => window.removeEventListener(PROFILE_CLOSE_EVENT, close);
  }, []);

  const avatarInitial = useMemo(
    () => initials(cookieName, cookieEmail || user?.email),
    [cookieName, cookieEmail, user?.email]
  );

  return (
    <header className="sticky top-0 z-50 border-b bg-white">
      <div className="h-16 px-4 md:px-6 flex items-center justify-between gap-3">
        {/* Left */}
        <Link href="/admin/users" className="flex items-center gap-3 shrink-0">
          <Image
            src={storeLogo}
            alt={`${storeName} Logo`}
            width={36}
            height={36}
            className="object-contain"
            unoptimized={isRemoteUrl(storeLogo)} // ✅ quick fix for remote logo
          />
          <div className="leading-tight">
            <div className="text-sm font-semibold text-slate-900">
              {storeName}
            </div>
            <div className="text-xs font-medium text-green-700">Admin Panel</div>
          </div>
        </Link>

        {/* Center search */}
        <div className="hidden md:block w-full max-w-[520px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              placeholder="Search..."
              className="w-full rounded-xl border bg-slate-50 pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-200"
            />
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/" className="hidden sm:block">
            <Button variant="outline" className="h-9 gap-2">
              <ExternalLink className="h-4 w-4" />
              Back to Site
            </Button>
          </Link>

          {!isLoading && user && (
            <Sheet open={profileOpen} onOpenChange={setProfileOpen}>
              <SheetTrigger asChild>
                <Button
                  onClick={() => setProfileOpen(true)}
                  className="h-9 bg-green-600 hover:bg-green-700 text-white gap-2"
                >
                  <span className="h-7 w-7 rounded-full overflow-hidden bg-white/20 ring-1 ring-white/30 flex items-center justify-center">
                    {cookiePhoto ? (
                      <img
                        src={cookiePhoto}
                        alt="Profile"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-[11px] font-semibold">
                        {avatarInitial}
                      </span>
                    )}
                  </span>

                  <span className="truncate max-w-[220px]">{user.email}</span>
                </Button>
              </SheetTrigger>

              <SheetContent side="right" className="w-[380px] sm:w-[420px]">
                <SheetHeader>
                  <SheetTitle>My Profile</SheetTitle>
                </SheetHeader>

                <div className="mt-6 space-y-6">
                  <UserProfilePanel />

                  <Button
                    variant="outline"
                    onClick={() => {
                      setProfileOpen(false);
                      logout();
                    }}
                    className="w-full border-red-500 text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          )}

          {!isLoading && !user && (
            <Link href="/auth/login">
              <Button className="h-9 bg-green-600 hover:bg-green-700 text-white">
                Sign in
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}