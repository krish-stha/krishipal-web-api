import type { ReactNode } from "react";
import { CartProvider } from "@/lib/contexts/cart-context";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <CartProvider>{children}</CartProvider>;
}
