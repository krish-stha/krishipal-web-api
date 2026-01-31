// app/admin/components/AdminHeader.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { LogOut, User, ExternalLink, Search } from "lucide-react";
import { Button } from "@/app/auth/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/auth/components/ui/dropdown-menu";
import { useAuth } from "@/lib/contexts/auth-contexts";

export function AdminHeader() {
  const { user, logout, isLoading } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b bg-white">
      <div className="h-16 px-4 md:px-6 flex items-center justify-between gap-3">
        {/* Left: logo */}
        <Link href="/admin/users" className="flex items-center gap-3 shrink-0">
          <Image
            src="/images/krishipal_logo.png"
            alt="KrishiPal Logo"
            width={36}
            height={36}
            className="object-contain"
          />
          <div className="leading-tight">
            <div className="text-sm font-semibold text-slate-900">KrishiPal</div>
            <div className="text-xs font-medium text-green-700">Admin Panel</div>
          </div>
        </Link>

        {/* Center: search (UI only) */}
        <div className="hidden md:block w-full max-w-[520px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              placeholder="Search..."
              className="w-full rounded-xl border bg-slate-50 pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-200"
            />
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/" className="hidden sm:block">
            <Button variant="outline" className="h-9 gap-2">
              <ExternalLink className="h-4 w-4" />
              Back to Site
            </Button>
          </Link>

          {!isLoading && (
            <>
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="h-9 bg-green-600 hover:bg-green-700 text-white gap-2">
                      <User className="h-4 w-4" />
                      <span className="max-w-[220px] truncate">{user.email}</span>
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuLabel>Admin Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    <DropdownMenuItem disabled>
                      <User className="mr-2 h-4 w-4" />
                      <span className="truncate">{user.email}</span>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                      onClick={logout}
                      className="text-red-600 focus:text-red-600"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link href="/auth/login">
                  <Button className="h-9 bg-green-600 hover:bg-green-700 text-white">
                    Sign in
                  </Button>
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
