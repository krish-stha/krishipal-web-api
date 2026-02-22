"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { verifyKhaltiPayment } from "@/lib/api/payment";

export default function KhaltiCallbackPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const [msg, setMsg] = useState("Preparing verification...");
  const ranRef = useRef(false); // ✅ prevents double-run

  useEffect(() => {
    // ✅ wait until search params are available
    const orderId = sp.get("orderId") || "";
    const pidx = sp.get("pidx") || "";

    if (!orderId || !pidx) {
      setMsg("Reading payment data...");
      return;
    }

    // ✅ avoid duplicate verify in React strict mode / rerenders
    if (ranRef.current) return;
    ranRef.current = true;

    (async () => {
      try {
        setMsg("Verifying payment with Khalti...");
        await verifyKhaltiPayment({ orderId, pidx });

        setMsg("Payment verified ✅ Redirecting...");
        // ✅ IMPORTANT: replace removes callback from browser history
        router.replace(`/user/dashboard/orders/${orderId}?paid=1`);
      } catch (e: any) {
        const m = e?.response?.data?.message || e?.message || "Verification failed";
        setMsg(m);

        setTimeout(() => {
          router.replace(`/user/dashboard/orders/${orderId}?paid=0`);
        }, 1200);
      }
    })();
  }, [sp, router]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-lg w-full rounded-2xl border bg-white p-6 text-center">
        <div className="text-xl font-semibold">Khalti Payment</div>
        <p className="text-slate-600 mt-2">{msg}</p>
        <p className="text-xs text-slate-400 mt-3">
          Please don’t close this tab.
        </p>
      </div>
    </div>
  );
}
