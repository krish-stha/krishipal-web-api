// "use client";

// import { useEffect, useRef, useState } from "react";
// import { useRouter, useSearchParams } from "next/navigation";
// import { verifyEsewaPayment } from "@/lib/api/payment"; // adjust path if yours differs

// export default function EsewaCallbackPage() {
//   const router = useRouter();
//   const sp = useSearchParams();
//   const ran = useRef(false);
//   const [msg, setMsg] = useState("Verifying payment...");

//   useEffect(() => {
//     if (ran.current) return;
//     ran.current = true;

//     const orderId = sp.get("orderId") || "";
//     const data = sp.get("data") || "";

//     console.log("CALLBACK PARAMS:", { orderId, data });

//     if (!orderId || !data) {
//       setMsg("Missing orderId/data");
//       router.replace(`/user/dashboard/orders/${orderId}?paid=0`);
//       return;
//     }

//     (async () => {
//       try {
//         const res = await verifyEsewaPayment({ orderId, data });
//         console.log("VERIFY RESPONSE:", res.data);
//         router.replace(`/user/dashboard/orders/${orderId}?paid=1`);
//       } catch (e) {
//         console.error("VERIFY FAILED:", e);
//         router.replace(`/user/dashboard/orders/${orderId}?paid=0`);
//       }
//     })();
//   }, [sp, router]);

//   return <div style={{ padd  ing: 24 }}>{msg}</div>;
// }