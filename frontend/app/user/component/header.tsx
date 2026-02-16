"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, LogOut, Package } from "lucide-react"; // ✅ added Package icon (optional)
import { Button } from "@/app/auth/components/ui/button";
import { useAuth } from "@/lib/contexts/auth-contexts";
import Cookies from "js-cookie";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/lib/contexts/cart-context";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import UserProfilePanel from "../profile/UserProfilePanel";

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
export const USER_UPDATED_EVENT = "krishipal_user_updated";

// ✅ NEW: close sheet event (UserProfilePanel dispatches this after save)
const PROFILE_CLOSE_EVENT = "krishipal_profile_close";

// ✅ IMPORTANT: use BACKEND_URL (NO /api) for images
const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

// ---------------- helpers ----------------
function normalizePhotoUrl(photo: string | null): string | null {
  if (!photo) return null;

  if (photo.startsWith("http://") || photo.startsWith("https://")) return photo;

  // filename only -> /public/profile_photo/<filename>
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
// -----------------------------------------

export function Header() {
  const { user, isLoading, logout } = useAuth();
  const { count } = useCart(); // ✅ FIX: now count exists

  // ✅ control sheet open/close
  const [profileOpen, setProfileOpen] = useState(false);

  const [cookieName, setCookieName] = useState("");
  const [cookieEmail, setCookieEmail] = useState("");
  const [cookiePhoto, setCookiePhoto] = useState<string | null>(null);

  const syncFromCookie = () => {
    const cu = getCookieUser();
    setCookieName(cu?.name || "");
    setCookieEmail(cu?.email || "");
    setCookiePhoto(withCacheBust(getProfilePhoto(cu)));
  };

  // ✅ refresh header avatar when cookie updated
  useEffect(() => {
    syncFromCookie();

    const handler = () => syncFromCookie();
    window.addEventListener(USER_UPDATED_EVENT, handler);

    return () => window.removeEventListener(USER_UPDATED_EVENT, handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email]);

  // ✅ close sheet after successful save (UserProfilePanel dispatches event)
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
    <header className="border-b bg-white sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/images/krishipal_logo.png"
            alt="KrishiPal Logo"
            width={50}
            height={50}
            className="object-contain"
          />
          <div className="text-2xl font-bold text-green-700">
            Krishi<span className="text-green-600">Pal</span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-gray-700 hover:text-green-600">
            Home
          </Link>
          <Link
            href="/user/dashboard/about"
            className="text-gray-700 hover:text-green-600"
          >
            About
          </Link>
          <Link
            href="/user/dashboard/blogs"
            className="text-gray-700 hover:text-green-600"
          >
            Blogs
          </Link>
          <Link
            href="/user/dashboard/contact"
            className="text-gray-700 hover:text-green-600"
          >
            Contact
          </Link>
          <Link
            href="/user/dashboard/shop"
            className="text-gray-700 hover:text-green-600"
          >
            Shop
          </Link>

          {/* ✅ ADD MY ORDERS HERE (Professional placement: after Shop) */}
          {user && (
            <Link
              href="/user/dashboard/orders"
              className="text-gray-700 hover:text-green-600"
            >
              My Orders
            </Link>
          )}

          <Link
            href="/user/dashboard/search"
            className="text-gray-700 hover:text-green-600"
          >
            Search
          </Link>

          {user?.role === "admin" && (
            <Link
              href="/admin/users"
              className="text-red-600 hover:text-red-700 font-semibold"
            >
              Admin Panel
            </Link>
          )}
        </nav>

        {/* Cart + Profile */}
        <div className="flex items-center gap-4">
          <Link href="/user/dashboard/cart" className="relative">
            <ShoppingCart className="h-6 w-6 text-gray-700" />
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {count}
            </span>
          </Link>

          {!isLoading && user && (
            <Sheet open={profileOpen} onOpenChange={setProfileOpen}>
              <SheetTrigger asChild>
                <Button
                  onClick={() => setProfileOpen(true)}
                  className="bg-green-600 hover:bg-green-700 text-white gap-2"
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
                  {/* ✅ OPTIONAL: Add My Orders in the profile panel too (mobile friendly) */}
                  <Link
                    href="/user/dashboard/orders"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 rounded-xl border bg-white px-4 py-3 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <Package className="h-4 w-4 text-slate-600" />
                    <span className="font-semibold">My Orders</span>
                    <span className="ml-auto text-xs text-slate-500">Track</span>
                  </Link>

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
              <Button className="bg-green-600 hover:bg-green-700 text-white">
                Sign in
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
