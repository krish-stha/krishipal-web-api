// frontend/lib/api/auth.ts
import { api } from "./axios";
import { endpoints } from "./endpoints";
import { setAuthCookies } from "@/lib/cookie";

type LoginResponse = {
  success: boolean;
  token: string;
  user: {
    _id?: string;
    id?: string;
    email: string;
    fullName: string;
    role: "user" | "admin";
  };
};

export async function loginApi(email: string, password: string) {
  const res = await api.post<LoginResponse>(endpoints.auth.login, { email, password });

  const data = res.data;

  // normalize user shape
  const userData = {
    id: data.user._id || data.user.id || "",
    email: data.user.email,
    name: data.user.fullName,
    role: data.user.role,
  };

  // save cookies
  setAuthCookies(userData, data.token);

  return userData; // return user for AuthContext
}
