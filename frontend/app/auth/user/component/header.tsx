"use client"

import Link from "next/link"
import { ShoppingCart, LogOut, User } from "lucide-react"
import { Button } from "@/app/auth/components/ui/button"
import Image from "next/image"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/auth/components/ui/dropdown-menu"
import { useAuth } from "@/lib/contexts/auth-contexts"

export function Header() {
  const { user, logout, isLoading } = useAuth()

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
          <Link href="/" className="text-gray-700 hover:text-green-600 transition-colors">
            Home
          </Link>
          <Link href="/auth/user/dashboard/about" className="text-gray-700 hover:text-green-600 transition-colors">
            About
          </Link>
          <Link href="/auth/user/dashboard/blogs" className="text-gray-700 hover:text-green-600 transition-colors">
            Blogs
          </Link>
          <Link href="/auth/user/dashboard/contact" className="text-gray-700 hover:text-green-600 transition-colors">
            Contact
          </Link>
          <Link href="/auth/user/dashboard/shop" className="text-gray-700 hover:text-green-600 transition-colors">
            Shop
          </Link>
          <Link href="/auth/user/dashboard/search" className="text-gray-700 hover:text-green-600 transition-colors">
            Search
          </Link>
        </nav>

        {/* Cart and User */}
        <div className="flex items-center gap-4">
          {/* Shopping Cart */}
          <Link href="/auth/user/dashboard/cart" className="relative">
            <ShoppingCart className="h-6 w-6 text-gray-700" />
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              0
            </span>
          </Link>

          {/* User Login / Dropdown */}
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
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
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
                  <Button className="bg-green-600 hover:bg-green-700 text-white">
                    Sign in
                  </Button>
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  )
}
