// frontend/lib/api/axios.ts
import axios, { AxiosError } from "axios";
import { getToken, clearAuthCookies } from "@/lib/cookie";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_BASE_URL) {
  throw new Error("NEXT_PUBLIC_API_URL is missing in .env.local");
}

export const api = axios.create({
  baseURL: API_BASE_URL,
});

/* ============================
   Request Interceptor
============================ */
api.interceptors.request.use((config) => {
  const token = getToken();

  if (token) {
    // ensure headers exists
    config.headers = config.headers ?? {};
    config.headers["Authorization"] = `Bearer ${token}`;
  }

  // Don't set Content-Type for FormData
  return config;
});

/* ============================
   Response Interceptor
============================ */
api.interceptors.response.use(
  (res) => res,
  (err: AxiosError<any>) => {
    const status = err.response?.status;

    if (status === 401) {
      clearAuthCookies();
    }

    return Promise.reject(err);
  }
);
