"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/app/auth/components/ui/button";

export default function EsewaFailurePage() {
  const sp = useSearchParams();
  const router = useRouter();
  const orderId = sp.get("orderId") || "";

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-lg w-full rounded-2xl border bg-white p-6 text-center">
        <div className="text-xl font-semibold text-red-700">Payment Failed</div>
        <p className="text-slate-600 mt-2">Your eSewa payment was not completed.</p>

        <div className="mt-5 flex gap-2 justify-center">
          <Button variant="outline" onClick={() => (orderId ? router.push(`/user/dashboard/orders/${orderId}`) : router.push("/user/dashboard/orders"))}>
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}