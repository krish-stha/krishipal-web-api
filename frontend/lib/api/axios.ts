import axios, { AxiosError } from "axios";
import { getToken, clearAuthCookies } from "@/lib/cookie";

const FALLBACK_URL = "http://localhost:3001";
const ENV_URL = process.env.NEXT_PUBLIC_API_URL;

// ✅ Strict in production, safe in dev/test
if (!ENV_URL) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("NEXT_PUBLIC_API_URL is missing (production)");
  } else {
    // eslint-disable-next-line no-console
    console.warn(
      `[api] NEXT_PUBLIC_API_URL is missing; using fallback ${FALLBACK_URL}`
    );
  }
}

export const api = axios.create({
  baseURL: ENV_URL || FALLBACK_URL,
  // ✅ IMPORTANT: token based auth, so keep credentials OFF
  withCredentials: false,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as any)["Authorization"] = `Bearer ${token}`;
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