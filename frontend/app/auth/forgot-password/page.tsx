"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Button } from "@/app/auth/components/ui/button";
import { Input } from "@/app/auth/components/ui/input";
import { forgotPasswordApi } from "@/lib/api/auth";
import { validationRules } from "@/lib/validation";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const emailError = validationRules.email.validate(email);
    if (emailError) {
      setError(emailError);
      return;
    }

    setLoading(true);
    try {
      await forgotPasswordApi(email);
      setDone(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to send reset link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Forgot Password</h1>
        <p className="mt-1 text-sm text-slate-600">
          Enter your email and we’ll send a reset link.
        </p>

        {done ? (
          <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-green-800">
            If this email exists, a reset link has been sent.
            <div className="mt-3">
              <Link href="/auth/login" className="text-green-700 font-medium hover:underline">
                Back to login
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <Input
                type="email"
                placeholder="Email"
                className="w-full bg-gray-50 border-gray-200"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send reset link"}
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
