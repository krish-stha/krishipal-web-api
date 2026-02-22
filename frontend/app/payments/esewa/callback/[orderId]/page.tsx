"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { verifyEsewaPayment } from "@/lib/api/payment";

type Phase = "verifying" | "success" | "failed";

export default function EsewaCallbackPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const params = useParams<{ orderId: string }>();

  const ran = useRef(false);

  const orderId = useMemo(() => String(params?.orderId || ""), [params]);
  const data = useMemo(() => sp.get("data") || "", [sp]);

  const [phase, setPhase] = useState<Phase>("verifying");
  const [title, setTitle] = useState("Verifying your payment");
  const [subtitle, setSubtitle] = useState("Please wait… this usually takes a few seconds.");

  const goOrder = (paid: 0 | 1) => router.replace(`/user/dashboard/orders/${orderId}?paid=${paid}`);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    // Missing params
    if (!orderId || !data) {
      setPhase("failed");
      setTitle("Verification failed");
      setSubtitle("Missing payment information. Please try again from your order page.");
      setTimeout(() => goOrder(0), 1200);
      return;
    }

    (async () => {
      try {
        setPhase("verifying");
        setTitle("Verifying your payment");
        setSubtitle("Please wait…");

        await verifyEsewaPayment({ orderId, data });

        setPhase("success");
        setTitle("Payment verified!");
        setSubtitle("Redirecting you back to your order…");

        setTimeout(() => goOrder(1), 900);
      } catch (e) {
        console.error("VERIFY FAILED:", e);

        setPhase("failed");
        setTitle("Verification failed");
        setSubtitle("We couldn’t confirm your payment. If money was deducted, don’t worry—try again in a moment.");

        setTimeout(() => goOrder(0), 1200);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, data]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border bg-white shadow-sm p-6">
        <div className="flex items-start gap-4">
          <StatusIcon phase={phase} />

          <div className="flex-1">
            <h1 className="text-lg font-bold text-slate-900">{title}</h1>
            <p className="text-sm text-slate-600 mt-1">{subtitle}</p>

            <div className="mt-4 rounded-xl bg-slate-50 border p-3">
              <div className="text-xs text-slate-500">Order</div>
              <div className="font-mono text-sm text-slate-900 break-all">{orderId || "-"}</div>
            </div>

            {phase === "failed" && (
              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                <button
                  className="h-10 px-4 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50"
                  onClick={() => goOrder(0)}
                >
                  Back to Order
                </button>
                <button
                  className="h-10 px-4 rounded-xl bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => {
                    ran.current = false; // allow re-run
                    window.location.reload();
                  }}
                >
                  Try Again
                </button>
              </div>
            )}

            {phase === "verifying" && (
              <div className="mt-4">
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full w-1/2 animate-pulse bg-green-600 rounded-full" />
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  Don’t close this tab while verification is in progress.
                </div>
              </div>
            )}

            {phase === "success" && (
              <div className="mt-4 text-xs text-slate-500">
                If you’re not redirected automatically, click{" "}
                <button className="text-green-700 font-semibold hover:underline" onClick={() => goOrder(1)}>
                  here
                </button>
                .
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusIcon({ phase }: { phase: "verifying" | "success" | "failed" }) {
  if (phase === "verifying") {
    return (
      <div className="h-11 w-11 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center">
        <svg className="h-5 w-5 animate-spin text-amber-700" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 3a9 9 0 1 0 9 9"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
    );
  }

  if (phase === "success") {
    return (
      <div className="h-11 w-11 rounded-2xl bg-green-50 border border-green-200 flex items-center justify-center">
        <svg className="h-6 w-6 text-green-700" viewBox="0 0 24 24" fill="none">
          <path
            d="M20 6L9 17l-5-5"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className="h-11 w-11 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center">
      <svg className="h-6 w-6 text-red-700" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 9v5"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M12 17h.01"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M10.29 3.86l-7.4 12.8A2 2 0 0 0 4.6 20h14.8a2 2 0 0 0 1.71-3.34l-7.4-12.8a2 2 0 0 0-3.42 0z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}