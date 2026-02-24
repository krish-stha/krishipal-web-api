"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/app/auth/components/ui/card";
import { Button } from "@/app/auth/components/ui/button";
import {
  adminGetAbout,
  adminUpdateAbout,
  adminUploadMissionImage,
  adminUploadVisionImage,
} from "@/lib/api/admin/about";

type Social = { label: string; url: string };

function backendPublic(pathname: string) {
  const base = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/$/, "");
  if (!pathname) return "";
  if (pathname.startsWith("http://") || pathname.startsWith("https://")) return pathname;
  if (pathname.startsWith("/")) return `${base}${pathname}`;
  return `${base}/public/${pathname}`;
}

export default function AdminAboutPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [heroTitle, setHeroTitle] = useState("");
  const [heroDescription, setHeroDescription] = useState("");

  const [missionTitle, setMissionTitle] = useState("");
  const [missionBody, setMissionBody] = useState("");
  const [missionImage, setMissionImage] = useState("");

  const [visionTitle, setVisionTitle] = useState("");
  const [visionBody, setVisionBody] = useState("");
  const [visionImage, setVisionImage] = useState("");

  const [published, setPublished] = useState(true);
  const [socials, setSocials] = useState<Social[]>([]);

  const missionPreview = useMemo(() => {
    if (!missionImage) return "";
    return backendPublic(`about/${missionImage}`);
  }, [missionImage]);

  const visionPreview = useMemo(() => {
    if (!visionImage) return "";
    return backendPublic(`about/${visionImage}`);
  }, [visionImage]);

  const fetchDoc = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminGetAbout();
      const doc = res?.data ?? res;

      setHeroTitle(doc?.heroTitle || "");
      setHeroDescription(doc?.heroDescription || "");

      setMissionTitle(doc?.missionTitle || "");
      setMissionBody(doc?.missionBody || "");
      setMissionImage(doc?.missionImage || "");

      setVisionTitle(doc?.visionTitle || "");
      setVisionBody(doc?.visionBody || "");
      setVisionImage(doc?.visionImage || "");

      setPublished(Boolean(doc?.published));
      setSocials(Array.isArray(doc?.socials) ? doc.socials : []);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to load about data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoc();
  }, []);

  const save = async () => {
    setLoading(true);
    setError("");
    try {
      await adminUpdateAbout({
        heroTitle,
        heroDescription,
        missionTitle,
        missionBody,
        visionTitle,
        visionBody,
        published,
        socials,
      });
      await fetchDoc();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Save failed");
    } finally {
      setLoading(false);
    }
  };

  const uploadMission = async (file: File) => {
    setLoading(true);
    setError("");
    try {
      const res = await adminUploadMissionImage(file);
      const doc = res?.data ?? res;
      setMissionImage(doc?.missionImage || "");
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const uploadVision = async (file: File) => {
    setLoading(true);
    setError("");
    try {
      const res = await adminUploadVisionImage(file);
      const doc = res?.data ?? res;
      setVisionImage(doc?.visionImage || "");
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const addSocial = () => setSocials((prev) => [...prev, { label: "", url: "" }]);
  const removeSocial = (idx: number) => setSocials((prev) => prev.filter((_, i) => i !== idx));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">About Page</h1>
          <p className="text-sm text-slate-600">Manage the public About page content shown to users.</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" disabled={loading} onClick={fetchDoc}>
            Refresh
          </Button>
          <Button className="bg-green-600 hover:bg-green-700 text-white" disabled={loading} onClick={save}>
            Save Changes
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-slate-900">Visibility</div>
          </div>

          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
            <span>Published (visible to users)</span>
          </label>
        </CardContent>
      </Card>

      {/* HERO */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="font-semibold text-slate-900">Hero section</div>

          <div>
            <label className="text-xs font-semibold text-slate-600">Title</label>
            <input
              className="mt-1 w-full h-11 rounded-xl border px-4 text-sm"
              value={heroTitle}
              onChange={(e) => setHeroTitle(e.target.value)}
              placeholder="About KrishiPal"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600">Description</label>
            <textarea
              className="mt-1 w-full rounded-xl border px-4 py-3 text-sm min-h-[100px]"
              value={heroDescription}
              onChange={(e) => setHeroDescription(e.target.value)}
              placeholder="Short intro shown on top of About page..."
            />
          </div>
        </CardContent>
      </Card>

      {/* MISSION */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="font-semibold text-slate-900">Mission section</div>

          <div className="grid md:grid-cols-2 gap-4 items-start">
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600">Title</label>
                <input
                  className="mt-1 w-full h-11 rounded-xl border px-4 text-sm"
                  value={missionTitle}
                  onChange={(e) => setMissionTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Body</label>
                <textarea
                  className="mt-1 w-full rounded-xl border px-4 py-3 text-sm min-h-[140px]"
                  value={missionBody}
                  onChange={(e) => setMissionBody(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Image</label>
                <input
                  className="mt-1 block w-full text-sm"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadMission(f);
                  }}
                />
                <p className="mt-1 text-[11px] text-slate-500">Uploads to: /public/about/</p>
              </div>
            </div>

            <div className="rounded-2xl border bg-slate-50 overflow-hidden">
              <div className="p-3 text-xs text-slate-600 border-b">Preview</div>
              <div className="relative h-[280px]">
                {missionPreview ? (
                  <Image src={missionPreview} alt="Mission" fill className="object-cover" unoptimized />
                ) : (
                  <div className="h-full flex items-center justify-center text-sm text-slate-400">No image uploaded</div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* VISION */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="font-semibold text-slate-900">Vision section</div>

          <div className="grid md:grid-cols-2 gap-4 items-start">
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600">Title</label>
                <input
                  className="mt-1 w-full h-11 rounded-xl border px-4 text-sm"
                  value={visionTitle}
                  onChange={(e) => setVisionTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Body</label>
                <textarea
                  className="mt-1 w-full rounded-xl border px-4 py-3 text-sm min-h-[140px]"
                  value={visionBody}
                  onChange={(e) => setVisionBody(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Image</label>
                <input
                  className="mt-1 block w-full text-sm"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadVision(f);
                  }}
                />
                <p className="mt-1 text-[11px] text-slate-500">Uploads to: /public/about/</p>
              </div>
            </div>

            <div className="rounded-2xl border bg-slate-50 overflow-hidden">
              <div className="p-3 text-xs text-slate-600 border-b">Preview</div>
              <div className="relative h-[280px]">
                {visionPreview ? (
                  <Image src={visionPreview} alt="Vision" fill className="object-cover" unoptimized />
                ) : (
                  <div className="h-full flex items-center justify-center text-sm text-slate-400">No image uploaded</div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SOCIALS */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-slate-900">Social links (optional)</div>
            <Button variant="outline" onClick={addSocial} disabled={loading}>
              Add link
            </Button>
          </div>

          {socials.length === 0 ? (
            <div className="text-sm text-slate-500">No social links added.</div>
          ) : (
            <div className="space-y-3">
              {socials.map((s, idx) => (
                <div key={idx} className="grid md:grid-cols-5 gap-2 items-center">
                  <input
                    className="md:col-span-2 h-11 rounded-xl border px-4 text-sm"
                    placeholder="Label (e.g. Facebook)"
                    value={s.label}
                    onChange={(e) => {
                      const v = e.target.value;
                      setSocials((prev) => prev.map((x, i) => (i === idx ? { ...x, label: v } : x)));
                    }}
                  />
                  <input
                    className="md:col-span-3 h-11 rounded-xl border px-4 text-sm"
                    placeholder="URL (https://...)"
                    value={s.url}
                    onChange={(e) => {
                      const v = e.target.value;
                      setSocials((prev) => prev.map((x, i) => (i === idx ? { ...x, url: v } : x)));
                    }}
                  />

                  <div className="md:col-span-5 flex justify-end">
                    <Button
                      variant="outline"
                      className="border-red-500 text-red-600 hover:bg-red-50"
                      disabled={loading}
                      onClick={() => removeSocial(idx)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}