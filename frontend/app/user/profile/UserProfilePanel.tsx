"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Cookies from "js-cookie";
import { useAuth } from "@/lib/contexts/auth-contexts";
import { Input } from "@/app/auth/components/ui/input";
import { Button } from "@/app/auth/components/ui/button";
import { api } from "@/lib/api/axios";
import { endpoints } from "@/lib/api/endpoints";
import { Camera, Loader2, Trash2 } from "lucide-react";

type CookieUser = {
  id?: string;
  _id?: string;
  name?: string;
  fullName?: string;
  email?: string;
  role?: string;

  profile_picture?: string; // backend filename
  profilePicture?: string; // frontend full url

  profilePictureUrl?: string;
  avatar?: string;
  photo?: string;
  image?: string;
  profile_photo?: string;

  countryCode?: string;
  phone?: string;
  address?: string;
};

const COOKIE_KEY = "krishipal_user";
const USER_UPDATED_EVENT = "krishipal_user_updated";

// ✅ NEW: close sheet event
const PROFILE_CLOSE_EVENT = "krishipal_profile_close";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

function normalizePhotoUrl(photo: string | null): string | null {
  if (!photo) return null;

  if (photo.startsWith("http://") || photo.startsWith("https://")) return photo;

  // filename only -> backend serves from /public/profile_photo
  if (!photo.includes("/")) {
    return `${BACKEND_URL}/public/profile_photo/${photo}`;
  }

  if (photo.startsWith("./")) photo = photo.slice(2);

  if (photo.startsWith("public/")) return `${BACKEND_URL}/${photo}`;
  if (photo.startsWith("/public/")) return `${BACKEND_URL}${photo}`;

  if (photo.startsWith("profile_photo/")) return `${BACKEND_URL}/public/${photo}`;
  if (photo.startsWith("/profile_photo/")) return `${BACKEND_URL}/public${photo}`;

  if (!photo.startsWith("/")) return `${BACKEND_URL}/${photo}`;
  return `${BACKEND_URL}${photo}`;
}

function extractPhoto(obj: any): string | null {
  if (!obj) return null;

  return (
    obj.profile_picture ||
    obj.profilePicture ||
    obj.profilePictureUrl ||
    obj.avatar ||
    obj.photo ||
    obj.image ||
    obj.profile_photo ||
    obj?.data?.profile_picture ||
    obj?.data?.profilePicture ||
    null
  );
}

function initials(name?: string, email?: string) {
  const n = (name || "").trim();
  if (n) return n[0].toUpperCase();
  const e = (email || "").trim();
  if (e) return e[0].toUpperCase();
  return "U";
}

export default function UserProfilePanel() {
  const { user } = useAuth();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    countryCode: "",
    phone: "",
    address: "",
    password: "",
  });

  const [file, setFile] = useState<File | null>(null);
  const [cookiePhoto, setCookiePhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const raw = Cookies.get(COOKIE_KEY);
    if (!raw) return;

    try {
      const parsed: CookieUser = JSON.parse(raw);

      setForm((p) => ({
        ...p,
        fullName: (parsed as any)?.fullName || parsed?.name || "",
        email: parsed?.email || "",
        countryCode: (parsed as any)?.countryCode || "",
        phone: (parsed as any)?.phone || "",
        address: (parsed as any)?.address || "",
      }));

      setCookiePhoto(normalizePhotoUrl(extractPhoto(parsed)));
    } catch {
      // ignore
    }
  }, []);

  const previewUrl = useMemo(() => {
    if (!file) return null;
    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const avatarSrc = previewUrl || cookiePhoto;
  const initial = initials(form.fullName, form.email);

  const onChange = (k: string, v: string) =>
    setForm((p) => ({ ...p, [k]: v }));

  const clearSelectedPhoto = () => {
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = async () => {
    const userId = (user as any)?.id || (user as any)?._id;
    if (!userId) {
      alert("User id missing. Please logout and login again.");
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v) fd.append(k, v);
      });
      if (file) fd.append("profilePicture", file);

      const res = await api.put(endpoints.auth.update(userId), fd);

      const updated = res?.data?.data ?? res?.data ?? {};
      const filename =
        (updated?.profile_picture as string | undefined) ||
        (updated?.profilePicture as string | undefined) ||
        undefined;

      const currentRaw = Cookies.get(COOKIE_KEY);
      const current: CookieUser = currentRaw ? JSON.parse(currentRaw) : {};

      const nextFilename = filename ?? current.profile_picture;
      const nextUrl = nextFilename
        ? `${BACKEND_URL}/public/profile_photo/${nextFilename}`
        : current.profilePicture || normalizePhotoUrl(extractPhoto(current));

      setCookiePhoto(nextUrl ? `${nextUrl}?t=${Date.now()}` : null);

      const nextCookie: CookieUser = {
        ...current,

        _id: updated?._id || current?._id,
        id: updated?.id || current?.id,
        role: updated?.role || current?.role,

        name: updated?.fullName || updated?.name || form.fullName || current?.name,
        fullName: updated?.fullName || form.fullName || current?.fullName,
        email: updated?.email || form.email || current?.email,

        countryCode: updated?.countryCode || form.countryCode || current?.countryCode,
        phone: updated?.phone || form.phone || current?.phone,
        address: updated?.address || form.address || current?.address,

        profile_picture: nextFilename,
        profilePicture: nextUrl ?? undefined,
      };

      Cookies.set(COOKIE_KEY, JSON.stringify(nextCookie), { path: "/" });

      // ✅ update headers
      window.dispatchEvent(new Event(USER_UPDATED_EVENT));

      // ✅ close sheet (admin + user)
      window.dispatchEvent(new Event(PROFILE_CLOSE_EVENT));

      clearSelectedPhoto();
      alert("Profile updated ✅");
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="relative h-14 w-14 overflow-hidden rounded-full ring-2 ring-green-100 bg-slate-100 flex items-center justify-center">
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt="Profile"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="font-semibold text-slate-700">{initial}</span>
          )}
        </div>

        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-900 truncate">
            {form.fullName || "My Account"}
          </div>
          <div className="text-sm text-slate-500 truncate">
            {form.email || (user as any)?.email || "—"}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />

            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={() => fileRef.current?.click()}
            >
              <Camera className="h-4 w-4" />
              Upload photo
            </Button>

            {file && (
              <Button
                type="button"
                variant="outline"
                className="gap-2 border-red-300 text-red-600 hover:bg-red-50"
                onClick={clearSelectedPhoto}
              >
                <Trash2 className="h-4 w-4" />
                Remove
              </Button>
            )}

            <span className="text-xs text-slate-500">JPG/PNG recommended.</span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-white">
        <div className="border-b px-5 py-4">
          <div className="text-sm font-semibold text-slate-900">
            Personal information
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Update your contact and delivery details.
          </div>
        </div>

        <div className="px-5 py-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600">
                Full name
              </label>
              <Input
                value={form.fullName}
                onChange={(e) => onChange("fullName", e.target.value)}
                placeholder="Full Name"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600">
                Email
              </label>
              <Input
                value={form.email}
                onChange={(e) => onChange("email", e.target.value)}
                placeholder="Email"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600">
                Country code
              </label>
              <Input
                value={form.countryCode}
                onChange={(e) => onChange("countryCode", e.target.value)}
                placeholder="Country Code"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600">
                Phone
              </label>
              <Input
                value={form.phone}
                onChange={(e) => onChange("phone", e.target.value)}
                placeholder="Phone"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-semibold text-slate-600">
                Address
              </label>
              <Input
                value={form.address}
                onChange={(e) => onChange("address", e.target.value)}
                placeholder="Address"
              />
            </div>
          </div>

          <div className="mt-6 rounded-xl border bg-slate-50 p-4">
            <div className="text-sm font-semibold text-slate-900">Security</div>
            <div className="text-xs text-slate-500 mt-1">
              Leave this empty if you don’t want to change your password.
            </div>

            <div className="mt-4 space-y-2">
              <label className="text-xs font-semibold text-slate-600">
                New password
              </label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => onChange("password", e.target.value)}
                placeholder="New Password"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
