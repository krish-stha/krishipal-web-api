// app/admin/layout.tsx
import type { ReactNode } from "react";
import { AdminHeader } from "./components/AdminHeader";
import { AdminSidebar } from "./components/AdminSidebar";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <AdminHeader />

      <div className="flex">
        {/* Left Sidebar */}
        <aside className="hidden lg:block w-[280px] border-r bg-white">
          <div className="h-[calc(100vh-64px)] sticky top-16 overflow-y-auto">
            <AdminSidebar />
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          <div className="mx-auto max-w-[1400px] px-4 md:px-6 py-6">
            <div className="rounded-2xl border bg-white shadow-sm">
              <div className="p-5 md:p-7">{children}</div>
            </div>

            <div className="mt-4 text-xs text-slate-400">
              © {new Date().getFullYear()} KrishiPal Admin
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
