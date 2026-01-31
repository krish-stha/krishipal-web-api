"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  ShoppingCart,
  PackageSearch,
  Tag,
  Settings,
  Boxes,
} from "lucide-react";

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="px-4 pt-5 pb-2 text-[11px] font-bold tracking-widest text-slate-400">
      {title}
    </div>
  );
}

function NavItem({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: any;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      className={[
        "mx-2 flex items-center rounded-xl px-3 py-2 text-sm transition",
        active
          ? "bg-green-50 text-green-800 ring-1 ring-green-100"
          : "text-slate-700 hover:bg-slate-100",
      ].join(" ")}
    >
      <Icon className="h-4 w-4 mr-3" />
      <span className="font-medium">{label}</span>
    </Link>
  );
}

export function AdminSidebar() {
  return (
    <div className="py-4">
      {/* Mini card (clean, no “pending” text) */}
      <div className="px-4">
        <div className="rounded-2xl border bg-slate-50 p-4">
          <div className="text-sm font-semibold text-slate-900">
            Ecommerce Admin
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Manage store, customers, and system settings.
          </div>
        </div>
      </div>

      <SectionTitle title="OVERVIEW" />
      <nav className="space-y-1">
        <NavItem href="/admin/dashboard" label="Dashboard" icon={LayoutDashboard} />
      </nav>

      <SectionTitle title="STORE" />
      <nav className="space-y-1">
        <NavItem href="/admin/items" label="Items" icon={ShoppingBag} />
        <NavItem href="/admin/categories" label="Categories" icon={Tag} />
        <NavItem href="/admin/inventory" label="Inventory" icon={Boxes} />
        <NavItem href="/admin/cart" label="Cart" icon={ShoppingCart} />
        <NavItem href="/admin/orders" label="Orders" icon={PackageSearch} />
      </nav>

      <SectionTitle title="CUSTOMERS" />
      <nav className="space-y-1">
        <NavItem href="/admin/users" label="Users" icon={Users} />
      </nav>

      <SectionTitle title="SYSTEM" />
      <nav className="space-y-1">
        <NavItem href="/admin/settings" label="Settings" icon={Settings} />
      </nav>
    </div>
  );
}
