"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/app/auth/components/ui/button";
import { Input } from "@/app/auth/components/ui/input";
import { resetPasswordApi } from "@/lib/api/auth";
import { Eye, EyeOff } from "lucide-react";
import { validationRules } from "@/lib/validation"; // adjust path if needed


export default function ResetPasswordPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const token = useMemo(() => sp.get("token") || "", [sp]);

  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Reset token is missing.");
      return;
    }
    const passwordError = validationRules.password.validate(password);
    if (passwordError) {
    setError(passwordError);
    return;
    }


    setLoading(true);
    try {
      await resetPasswordApi(token, password);
      setDone(true);

      // optional redirect after success
      setTimeout(() => router.push("/auth/login"), 800);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Reset Password</h1>
        <p className="mt-1 text-sm text-slate-600">Set your new password.</p>

        {!token && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            Token missing. Please use the reset link you received.
          </div>
        )}

        {done ? (
          <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-green-800">
            Password reset successful ✅ Redirecting to login...
            <div className="mt-3">
              <Link href="/auth/login" className="text-green-700 font-medium hover:underline">
                Go to login
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="relative">
              <Input
                type={show ? "text" : "password"}
                placeholder="New password"
                className="w-full bg-gray-50 border-gray-200 pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              >
                {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg disabled:opacity-50"
              disabled={loading || !token}
            >
              {loading ? "Resetting..." : "Reset password"}
            </Button>

            <div className="text-center">
              <Link href="/auth/login" className="text-green-600 hover:underline font-medium">
                Back to login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
