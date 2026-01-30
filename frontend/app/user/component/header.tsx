"use client"

import Link from "next/link"
import { ShoppingCart, User, LogOut } from "lucide-react"
import { Button } from "@/app/auth/components/ui/button"
import Image from "next/image"
import { useAuth } from "@/lib/contexts/auth-contexts"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import UserProfilePanel from "../profile/UserProfilePanel"

export function Header() {
  const { user, isLoading, logout } = useAuth()

  return (
    <header className="border-b bg-white sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/images/krishipal_logo.png"
            alt="KrishiPal Logo"
            width={50}
            height={50}
            className="object-contain"
          />
          <div className="text-2xl font-bold text-green-700">
            Krishi<span className="text-green-600">Pal</span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-gray-700 hover:text-green-600">Home</Link>
          <Link href="/user/dashboard/about" className="text-gray-700 hover:text-green-600">About</Link>
          <Link href="/user/dashboard/blogs" className="text-gray-700 hover:text-green-600">Blogs</Link>
          <Link href="/user/dashboard/contact" className="text-gray-700 hover:text-green-600">Contact</Link>
          <Link href="/user/dashboard/shop" className="text-gray-700 hover:text-green-600">Shop</Link>
          <Link href="/user/dashboard/search" className="text-gray-700 hover:text-green-600">Search</Link>

          {user?.role === "admin" && (
            <Link
              href="/admin/users"
              className="text-red-600 hover:text-red-700 font-semibold"
            >
              Admin Panel
            </Link>
          )}
        </nav>

        {/* Cart + Profile */}
        <div className="flex items-center gap-4">
          <Link href="/user/dashboard/cart" className="relative">
            <ShoppingCart className="h-6 w-6 text-gray-700" />
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              0
            </span>
          </Link>

          {!isLoading && user && (
            <Sheet>
              <SheetTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700 text-white gap-2">
                  <User className="h-4 w-4" />
                  <span className="truncate">{user.email}</span>
                </Button>
              </SheetTrigger>

              <SheetContent side="right" className="w-[380px] sm:w-[420px]">
                <SheetHeader>
                  <SheetTitle>My Profile</SheetTitle>
                </SheetHeader>

                <div className="mt-6 space-y-6">
                  <UserProfilePanel />

                  {/* ✅ Logout button */}
                  <Button
                    variant="outline"
                    onClick={logout}
                    className="w-full border-red-500 text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          )}

          {!isLoading && !user && (
            <Link href="/auth/login">
              <Button className="bg-green-600 hover:bg-green-700 text-white">
                Sign in
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
