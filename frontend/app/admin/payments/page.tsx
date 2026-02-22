// "use client";

// import { useEffect, useState } from "react";
// import { Card } from "@/app/auth/components/ui/card";
// import { Button } from "@/app/auth/components/ui/button";
// import {
//   adminListPaymentLogs,
//   adminListRefunds,
//   adminApproveRefund,
//   adminRejectRefund,
//   adminMarkRefundProcessed,
// } from "@/lib/api/admin/payment";

// function rsFromPaisa(paisa: any) {
//   const v = Number(paisa ?? 0);
//   return `Rs. ${Number.isFinite(v) ? Math.round(v / 100) : 0}`;
// }

// export default function AdminPaymentsPage() {
//   const [tab, setTab] = useState<"logs" | "refunds">("logs");

//   // logs
//   const [logLoading, setLogLoading] = useState(false);
//   const [logError, setLogError] = useState("");
//   const [logSearch, setLogSearch] = useState("");
//   const [logPage, setLogPage] = useState(1);
//   const [logRows, setLogRows] = useState<any[]>([]);
//   const [logTotal, setLogTotal] = useState(0);

//   // refunds
//   const [rfLoading, setRfLoading] = useState(false);
//   const [rfError, setRfError] = useState("");
//   const [rfStatus, setRfStatus] = useState("");
//   const [rfPage, setRfPage] = useState(1);
//   const [rfRows, setRfRows] = useState<any[]>([]);
//   const [rfTotal, setRfTotal] = useState(0);

//   const limit = 20;

//   const loadLogs = async (p = logPage) => {
//     setLogLoading(true);
//     setLogError("");
//     try {
//       const res = await adminListPaymentLogs({
//         page: p,
//         limit,
//         search: logSearch.trim() || undefined,
//       });
//       setLogRows(res.data?.data || []);
//       setLogTotal(res.data?.meta?.total || 0);
//     } catch (e: any) {
//       setLogError(e?.response?.data?.message || e?.message || "Failed to load payment logs");
//       setLogRows([]);
//       setLogTotal(0);
//     } finally {
//       setLogLoading(false);
//     }
//   };

//   const loadRefunds = async (p = rfPage) => {
//     setRfLoading(true);
//     setRfError("");
//     try {
//       const res = await adminListRefunds({
//         page: p,
//         limit,
//         status: rfStatus || undefined,
//       });
//       setRfRows(res.data?.data || []);
//       setRfTotal(res.data?.meta?.total || 0);
//     } catch (e: any) {
//       setRfError(e?.response?.data?.message || e?.message || "Failed to load refunds");
//       setRfRows([]);
//       setRfTotal(0);
//     } finally {
//       setRfLoading(false);
//     }
//   };

//   useEffect(() => {
//     loadLogs(1);
//     loadRefunds(1);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   const logPages = Math.max(1, Math.ceil(logTotal / limit));
//   const rfPages = Math.max(1, Math.ceil(rfTotal / limit));

//   return (
//     <div className="p-6">
//       <div className="mb-6">
//         <div className="text-sm text-slate-500">Admin / Payments</div>
//         <h1 className="text-2xl font-bold text-slate-900">Payments</h1>
//         <p className="text-slate-600 mt-1">Payment logs, refunds, and audit trail.</p>
//       </div>

//       <div className="flex gap-2 mb-4">
//         <Button
//           variant={tab === "logs" ? undefined : "outline"}
//           className={tab === "logs" ? "bg-green-600 hover:bg-green-700 text-white" : "border-slate-300"}
//           onClick={() => setTab("logs")}
//         >
//           Payment Logs
//         </Button>
//         <Button
//           variant={tab === "refunds" ? undefined : "outline"}
//           className={tab === "refunds" ? "bg-green-600 hover:bg-green-700 text-white" : "border-slate-300"}
//           onClick={() => setTab("refunds")}
//         >
//           Refund Requests
//         </Button>
//       </div>

//       {tab === "logs" && (
//         <>
//           <Card className="rounded-2xl p-4 mb-4">
//             <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
//               <div className="flex gap-2 w-full md:w-[520px]">
//                 <input
//                   value={logSearch}
//                   onChange={(e) => setLogSearch(e.target.value)}
//                   placeholder="Search by orderId / pidx / transaction id..."
//                   className="flex-1 h-10 rounded-xl border bg-white px-3 outline-none focus:ring-2 focus:ring-green-200"
//                 />
//                 <Button
//                   className="h-10 bg-green-600 hover:bg-green-700 text-white"
//                   onClick={() => {
//                     setLogPage(1);
//                     loadLogs(1);
//                   }}
//                   disabled={logLoading}
//                 >
//                   Search
//                 </Button>
//               </div>
//               <div className="text-sm text-slate-600">
//                 Total logs: <b className="text-slate-900">{logTotal}</b>
//               </div>
//             </div>
//           </Card>

//           {logError && <div className="text-red-600 mb-4">{logError}</div>}

//           <Card className="rounded-2xl overflow-hidden">
//             <div className="overflow-auto">
//               <table className="min-w-[1100px] w-full text-sm">
//                 <thead className="bg-slate-50">
//                   <tr className="text-left">
//                     <th className="p-3 font-semibold">Time</th>
//                     <th className="p-3 font-semibold">Order</th>
//                     <th className="p-3 font-semibold">User</th>
//                     <th className="p-3 font-semibold">Gateway</th>
//                     <th className="p-3 font-semibold">Action</th>
//                     <th className="p-3 font-semibold">Status</th>
//                     <th className="p-3 font-semibold">Amount</th>
//                     <th className="p-3 font-semibold">Ref</th>
//                     <th className="p-3 font-semibold">Message</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {logLoading ? (
//                     <tr>
//                       <td className="p-4 text-slate-500" colSpan={9}>
//                         Loading...
//                       </td>
//                     </tr>
//                   ) : logRows.length === 0 ? (
//                     <tr>
//                       <td className="p-4 text-slate-500" colSpan={9}>
//                         No logs
//                       </td>
//                     </tr>
//                   ) : (
//                     logRows.map((r) => (
//                       <tr key={r._id} className="border-t">
//                         <td className="p-3 text-slate-600">{r.createdAt ? new Date(r.createdAt).toLocaleString() : "-"}</td>
//                         <td className="p-3 font-mono text-xs">{String(r.order?._id || r.order || "-").slice(-10)}</td>
//                         <td className="p-3">{r.user?.email || r.user?.fullName || "-"}</td>
//                         <td className="p-3">{r.gateway}</td>
//                         <td className="p-3">{r.action}</td>
//                         <td className="p-3">{r.status}</td>
//                         <td className="p-3 font-semibold text-green-700">{rsFromPaisa(r.amountPaisa)}</td>
//                         <td className="p-3 font-mono text-xs">{r.ref || "-"}</td>
//                         <td className="p-3 text-slate-600">{r.message || "-"}</td>
//                       </tr>
//                     ))
//                   )}
//                 </tbody>
//               </table>
//             </div>
//           </Card>

//           <div className="mt-5 flex items-center justify-between">
//             <Button
//               variant="outline"
//               className="border-slate-300"
//               disabled={logLoading || logPage <= 1}
//               onClick={() => {
//                 const p = Math.max(1, logPage - 1);
//                 setLogPage(p);
//                 loadLogs(p);
//               }}
//             >
//               Prev
//             </Button>

//             <div className="text-sm text-slate-600">
//               Page <b className="text-slate-900">{logPage}</b> / {logPages}
//             </div>

//             <Button
//               variant="outline"
//               className="border-slate-300"
//               disabled={logLoading || logPage >= logPages}
//               onClick={() => {
//                 const p = Math.min(logPages, logPage + 1);
//                 setLogPage(p);
//                 loadLogs(p);
//               }}
//             >
//               Next
//             </Button>
//           </div>
//         </>
//       )}

//       {tab === "refunds" && (
//         <>
//           <Card className="rounded-2xl p-4 mb-4">
//             <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
//               <div className="flex gap-2 items-center">
//                 <select
//                   value={rfStatus}
//                   onChange={(e) => setRfStatus(e.target.value)}
//                   className="h-10 rounded-xl border bg-white px-3 outline-none focus:ring-2 focus:ring-green-200"
//                 >
//                   <option value="">All</option>
//                   <option value="requested">Requested</option>
//                   <option value="approved">Approved</option>
//                   <option value="rejected">Rejected</option>
//                   <option value="processed">Processed</option>
//                 </select>

//                 <Button
//                   className="h-10 bg-green-600 hover:bg-green-700 text-white"
//                   onClick={() => {
//                     setRfPage(1);
//                     loadRefunds(1);
//                   }}
//                   disabled={rfLoading}
//                 >
//                   Apply
//                 </Button>
//               </div>

//               <div className="text-sm text-slate-600">
//                 Total refunds: <b className="text-slate-900">{rfTotal}</b>
//               </div>
//             </div>
//           </Card>

//           {rfError && <div className="text-red-600 mb-4">{rfError}</div>}

//           <Card className="rounded-2xl overflow-hidden">
//             <div className="overflow-auto">
//               <table className="min-w-[1100px] w-full text-sm">
//                 <thead className="bg-slate-50">
//                   <tr className="text-left">
//                     <th className="p-3 font-semibold">Time</th>
//                     <th className="p-3 font-semibold">Order</th>
//                     <th className="p-3 font-semibold">User</th>
//                     <th className="p-3 font-semibold">Amount</th>
//                     <th className="p-3 font-semibold">Status</th>
//                     <th className="p-3 font-semibold">Reason</th>
//                     <th className="p-3 font-semibold text-right">Action</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {rfLoading ? (
//                     <tr>
//                       <td className="p-4 text-slate-500" colSpan={7}>
//                         Loading...
//                       </td>
//                     </tr>
//                   ) : rfRows.length === 0 ? (
//                     <tr>
//                       <td className="p-4 text-slate-500" colSpan={7}>
//                         No refunds
//                       </td>
//                     </tr>
//                   ) : (
//                     rfRows.map((r) => (
//                       <tr key={r._id} className="border-t">
//                         <td className="p-3 text-slate-600">{r.createdAt ? new Date(r.createdAt).toLocaleString() : "-"}</td>
//                         <td className="p-3 font-mono text-xs">{String(r.order?._id || "-").slice(-10)}</td>
//                         <td className="p-3">{r.user?.email || "-"}</td>
//                         <td className="p-3 font-semibold text-green-700">{rsFromPaisa(r.amountPaisa)}</td>
//                         <td className="p-3">{r.status}</td>
//                         <td className="p-3 text-slate-600">{r.reason || "-"}</td>

//                         <td className="p-3 text-right space-x-2">
//                           {r.status === "requested" && (
//                             <>
//                               <Button
//                                 variant="outline"
//                                 className="border-slate-300"
//                                 onClick={async () => {
//                                   const note = prompt("Admin note (optional):") || "";
//                                   await adminApproveRefund(r._id, note);
//                                   loadRefunds(rfPage);
//                                 }}
//                               >
//                                 Approve
//                               </Button>
//                               <Button
//                                 className="bg-red-600 hover:bg-red-700 text-white"
//                                 onClick={async () => {
//                                   const note = prompt("Reject reason (optional):") || "";
//                                   await adminRejectRefund(r._id, note);
//                                   loadRefunds(rfPage);
//                                 }}
//                               >
//                                 Reject
//                               </Button>
//                             </>
//                           )}

//                           {r.status === "approved" && (
//                             <Button
//                               className="bg-purple-600 hover:bg-purple-700 text-white"
//                               onClick={async () => {
//                                 await adminMarkRefundProcessed(r._id);
//                                 loadRefunds(rfPage);
//                               }}
//                             >
//                               Mark Processed
//                             </Button>
//                           )}
//                         </td>
//                       </tr>
//                     ))
//                   )}
//                 </tbody>
//               </table>
//             </div>
//           </Card>

//           <div className="mt-5 flex items-center justify-between">
//             <Button
//               variant="outline"
//               className="border-slate-300"
//               disabled={rfLoading || rfPage <= 1}
//               onClick={() => {
//                 const p = Math.max(1, rfPage - 1);
//                 setRfPage(p);
//                 loadRefunds(p);
//               }}
//             >
//               Prev
//             </Button>

//             <div className="text-sm text-slate-600">
//               Page <b className="text-slate-900">{rfPage}</b> / {rfPages}
//             </div>

//             <Button
//               variant="outline"
//               className="border-slate-300"
//               disabled={rfLoading || rfPage >= rfPages}
//               onClick={() => {
//                 const p = Math.min(rfPages, rfPage + 1);
//                 setRfPage(p);
//                 loadRefunds(p);
//               }}
//             >
//               Next
//             </Button>
//           </div>
//         </>
//       )}
//     </div>
//   );
// }
