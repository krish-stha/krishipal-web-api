"use client";

import Link from "next/link";
import Image from "next/image";
import { LogOut, User } from "lucide-react";
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
    <header className="border-b bg-white sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/admin/users" className="flex items-center gap-3">
          <Image
            src="/images/krishipal_logo.png"
            alt="KrishiPal Logo"
            width={44}
            height={44}
            className="object-contain"
          />
          <div className="text-xl font-bold text-green-700">
            Admin<span className="text-green-600">Panel</span>
          </div>
        </Link>

        {/* Admin Nav */}
        <nav className="flex items-center gap-6">
          <Link href="/admin/users" className="text-gray-700 hover:text-green-600">
            Users
          </Link>
          <Link href="/" className="text-gray-700 hover:text-green-600">
            Back to Site
          </Link>
        </nav>

        {/* User dropdown */}
        {!isLoading && (
          <>
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700 text-white gap-2">
                    <User className="h-4 w-4" />
                    <span className="truncate">{user.email}</span>
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Admin Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  <DropdownMenuItem disabled>
                    <User className="mr-2 h-4 w-4" />
                    <span className="truncate">{user.email}</span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem onClick={logout} className="text-red-600 focus:text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/auth/login">
                <Button className="bg-green-600 hover:bg-green-700 text-white">
                  Sign in
                </Button>
              </Link>
            )}
          </>
        )}
      </div>
    </header>
  );
}
