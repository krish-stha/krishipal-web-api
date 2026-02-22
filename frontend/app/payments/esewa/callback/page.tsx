"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { verifyEsewaPayment } from "@/lib/api/payment";

export default function EsewaCallbackPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const ranRef = useRef(false);

  const [msg, setMsg] = useState("Preparing verification...");

  useEffect(() => {
    const orderId = sp.get("orderId") || "";
    const data = sp.get("data") || "";

    if (!orderId) return;
    if (!data) {
      setMsg("Missing eSewa data...");
      router.replace(`/user/dashboard/orders/${orderId}?paid=0`);
      return;
    }

    if (ranRef.current) return;
    ranRef.current = true;

    (async () => {
      try {
        setMsg("Verifying payment with eSewa...");
        await verifyEsewaPayment({ orderId, data });

        setMsg("Payment verified ✅ Redirecting...");
        router.replace(`/user/dashboard/orders/${orderId}?paid=1`);
      } catch (e: any) {
        const m = e?.response?.data?.message || e?.message || "Verification failed";
        setMsg(m);
        setTimeout(() => router.replace(`/user/dashboard/orders/${orderId}?paid=0`), 1200);
      }
    })();
  }, [sp, router]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-lg w-full rounded-2xl border bg-white p-6 text-center">
        <div className="text-xl font-semibold">eSewa Payment</div>
        <p className="text-slate-600 mt-2">{msg}</p>
        <p className="text-xs text-slate-400 mt-3">Please don’t close this tab.</p>
      </div>
    </div>
  );
}