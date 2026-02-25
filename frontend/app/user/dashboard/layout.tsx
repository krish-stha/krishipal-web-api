"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CartProvider } from "@/lib/contexts/cart-context";
import { useAuth } from "@/lib/contexts/auth-contexts";

const PUBLIC_DASHBOARD_ROUTES = [
  "/user/dashboard/about",
  "/user/dashboard/contact",
  "/user/dashboard/blogs",
  "/user/dashboard/shop",
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isPublic = PUBLIC_DASHBOARD_ROUTES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  useEffect(() => {
    if (isLoading) return;

    // allow public dashboard pages without login
    if (isPublic) return;

    // protect everything else under dashboard
    if (!user) {
      const ok = window.confirm("Need to login first. Go to login?");
      if (ok) router.replace(`/auth/login?next=${encodeURIComponent(pathname)}`);
      else router.replace("/"); // or "/shop"
    }
  }, [isLoading, isPublic, user, pathname, router]);

  // optional loading / block render
  if (!isPublic && !user) return null;

  return <> {children}</>;
}