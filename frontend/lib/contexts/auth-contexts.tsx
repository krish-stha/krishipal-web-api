"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"

/* =======================
   Types
======================= */

interface User {
  id: string
  email: string
  name: string
  role: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
}

/* =======================
   Context
======================= */

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/* =======================
   Cookie config
======================= */

const cookieOptions = {
  expires: 1, // 1 day
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
}

/* =======================
   Provider
======================= */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  /* Restore user from cookie on refresh */
  useEffect(() => {
    const storedUser = Cookies.get("krishipal_user")
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch {
        Cookies.remove("krishipal_user")
      }
    }
    setIsLoading(false)
  }, [])

  /* =======================
     Login
  ======================= */

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || "Login failed")
      }

      /* 🔐 SAVE ONLY REQUIRED DATA */
      const userData: User = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.fullName,
        role: data.user.role,
      }

      /* 🍪 Save in cookies */
      Cookies.set("krishipal_user", JSON.stringify(userData), cookieOptions)
      Cookies.set("krishipal_token", data.token, cookieOptions)

      setUser(userData)
      router.push("/")
    } catch (err: any) {
      throw new Error(err.message || "Login failed")
    } finally {
      setIsLoading(false)
    }
  }

  /* =======================
     Logout
  ======================= */

  const logout = () => {
    setUser(null)
    Cookies.remove("krishipal_user")
    Cookies.remove("krishipal_token")
    router.push("/auth/login")
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

/* =======================
   Hook
======================= */

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
