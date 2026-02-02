"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { getUser, clearAuthCookies, updateUserCookie } from "@/lib/cookie";
import { loginApi } from "@/lib/api/auth";
import { api } from "@/lib/api/axios";
import { endpoints } from "@/lib/api/endpoints";

interface User {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";

  // ✅ add so UI can use it if needed later
  profile_picture?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setUser(getUser());
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const u = await loginApi(email, password); // saves cookies internally
      setUser(u);

      // ✅ fetch full profile (includes profile_picture)
      try {
        const meRes = await api.get(endpoints.auth.me);
        const me = meRes?.data?.data ?? meRes?.data;

        const profile_picture: string | undefined = me?.profile_picture;

        // update cookie + notify header
        if (profile_picture) {
          updateUserCookie({
            profile_picture,
            name: me?.fullName ?? me?.name ?? u.name,
            email: me?.email ?? u.email,
          });
        }

        // update in-memory user too (optional but clean)
        setUser((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            name: me?.fullName ?? me?.name ?? prev.name,
            email: me?.email ?? prev.email,
            profile_picture: profile_picture ?? prev.profile_picture,
          };
        });
      } catch {
        // if /me fails, still allow login + redirect
      }

      // ✅ Redirect after login (your requirement)
      if (u.role === "admin") router.push("/admin/users");
      else router.push("/");
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    clearAuthCookies();
    router.push("/auth/login");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
