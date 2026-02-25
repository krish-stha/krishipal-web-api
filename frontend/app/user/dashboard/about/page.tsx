"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Header } from "@/app/user/component/header";
import { Footer } from "@/app/user/component/footer";
import { getPublicSettings } from "@/lib/api/settings";
import { getPublicAbout } from "@/lib/api/about";

function backendPublic(pathname: string) {
  const base = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/$/, "");
  if (!pathname) return "";
  if (pathname.startsWith("http://") || pathname.startsWith("https://")) return pathname;
  if (pathname.startsWith("/")) return `${base}${pathname}`;
  return `${base}/public/${pathname}`;
}

export default function AboutPage() {
  const [storeName, setStoreName] = useState("KrishiPal");
  const [about, setAbout] = useState<any>(null);

  const missionImg = useMemo(() => {
    const fn = String(about?.missionImage || "");
    return fn ? backendPublic(`about/${fn}`) : "/images/farmers-working-in-green-rice-paddy-field.png";
  }, [about?.missionImage]);

  const visionImg = useMemo(() => {
    const fn = String(about?.visionImage || "");
    return fn ? backendPublic(`about/${fn}`) : "/images/modern-greenhouse-agricultural-technology.png";
  }, [about?.visionImage]);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const sres = await getPublicSettings();
        const sdata = sres?.data ?? sres ?? {};
        const name = String(sdata?.storeName || "").trim();
        if (alive && name) setStoreName(name);
      } catch {}

      try {
        const ares = await getPublicAbout(); // { success, data }
        const adata = ares?.data ?? ares ?? null;
        if (alive) setAbout(adata);
      } catch {
        if (alive) setAbout(null);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const heroTitle = about?.heroTitle || `About ${storeName}`;
  const heroDescription =
    about?.heroDescription ||
    `${storeName} is your go-to platform for all things agriculture. We provide products and resources to support your agricultural needs.`;

  const missionTitle = about?.missionTitle || "Our Mission";
  const missionBody = about?.missionBody || "Our mission is to empower farmers with quality products and expert support.";

  const visionTitle = about?.visionTitle || "Our Vision";
  const visionBody = about?.visionBody || "We envision a sustainable ecosystem where technology meets tradition in agriculture.";

  const socials = Array.isArray(about?.socials) ? about.socials : [];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-12">
          {/* HERO */}
          <div className="text-center mb-14">
            <h1 className="text-4xl font-bold mb-4">{heroTitle}</h1>
            <p className="text-gray-600 max-w-3xl mx-auto text-lg leading-relaxed">{heroDescription}</p>

            {socials.length > 0 ? (
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {socials.map((s: any, idx: number) => (
                  <a
                    key={idx}
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center rounded-full border px-4 py-2 text-sm hover:bg-slate-50"
                  >
                    {s.label || s.url}
                  </a>
                ))}
              </div>
            ) : null}
          </div>

          {/* MISSION */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div>
              <h2 className="text-3xl font-bold mb-6">{missionTitle}</h2>
              <p className="text-gray-700 leading-relaxed text-lg">{missionBody}</p>
            </div>
            <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-lg">
              <Image src={missionImg} alt="Mission" fill className="object-cover" unoptimized />
            </div>
          </div>

          {/* VISION */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-lg order-2 md:order-1">
              <Image src={visionImg} alt="Vision" fill className="object-cover" unoptimized />
            </div>
            <div className="order-1 md:order-2">
              <h2 className="text-3xl font-bold mb-6">{visionTitle}</h2>
              <p className="text-gray-700 leading-relaxed text-lg">{visionBody}</p>
            </div>
          </div>

          {/* OPTIONAL SECTION (nice professional ending) */}
          <div className="rounded-2xl border bg-white p-8 shadow-sm">
            <h3 className="text-2xl font-bold mb-3">What we do</h3>
            <p className="text-gray-700 leading-relaxed">
              We help farmers and growers discover trusted agriculture products, make smarter purchase decisions, and
              improve productivity through curated content and practical tools.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}