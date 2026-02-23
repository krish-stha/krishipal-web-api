"use client";

import { useEffect, useState } from "react";
import { getPublicSettings } from "@/lib/api/settings";

export function Footer() {
  const [storeName, setStoreName] = useState("KrishiPal");

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const res = await getPublicSettings(); // { success, data }
        const data = res?.data ?? res ?? {};
        const name = String(data?.storeName || "").trim();
        if (!alive) return;
        if (name) setStoreName(name);
      } catch {
        // keep default
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  return (
    <footer className="border-t bg-white mt-20">
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-gray-600">
          © 2025 {storeName}. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
}