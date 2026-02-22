import axios, { AxiosError } from "axios";
import { getToken, clearAuthCookies } from "@/lib/cookie";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_BASE_URL) {
  throw new Error("NEXT_PUBLIC_API_URL is missing in .env.local");
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  // ✅ IMPORTANT: token based auth, so keep credentials OFF
  withCredentials: false,
});

api.interceptors.request.use((config) => {
  const token = getToken();

  if (token) {
    config.headers = config.headers ?? {};
    config.headers["Authorization"] = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err: AxiosError<any>) => {
    if (err.response?.status === 401) clearAuthCookies();
    return Promise.reject(err);
  }
);
