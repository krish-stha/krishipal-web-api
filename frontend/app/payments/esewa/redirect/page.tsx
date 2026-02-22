"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { initiateEsewaPayment } from "@/lib/api/payment";

export default function EsewaRedirectPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const ranRef = useRef(false);

  const [msg, setMsg] = useState("Preparing eSewa payment...");

  useEffect(() => {
    const orderId = sp.get("orderId") || "";
    if (!orderId) return;

    if (ranRef.current) return;
    ranRef.current = true;

    (async () => {
      try {
        setMsg("Contacting server...");
        const res = await initiateEsewaPayment(orderId);

        const formUrl = res?.data?.formUrl || res?.data?.data?.formUrl;
        const formFields = res?.data?.formFields || res?.data?.data?.formFields;

        if (!formUrl || !formFields) {
          throw new Error("Invalid initiate response");
        }

        // Create and submit form
        const form = document.createElement("form");
        form.method = "POST";
        form.action = formUrl;

        Object.keys(formFields).forEach((k) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = k;
          input.value = String(formFields[k] ?? "");
          form.appendChild(input);
        });

        document.body.appendChild(form);
        setMsg("Redirecting to eSewa...");
        form.submit();
      } catch (e: any) {
        setMsg(e?.response?.data?.message || e?.message || "Failed to initiate eSewa");
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