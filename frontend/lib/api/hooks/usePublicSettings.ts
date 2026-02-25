"use client";
import { useEffect, useState } from "react";
import { getPublicSettings } from "@/lib/api/settings";

export function usePublicSettings() {
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await getPublicSettings();
        if (!alive) return;
        setSettings(res?.data?.data || res?.data || null);
      } catch {
        if (!alive) return;
        setSettings(null);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return settings;
}