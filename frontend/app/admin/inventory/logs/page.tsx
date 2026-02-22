"use client";

import { useEffect, useState } from "react";
import { adminInventoryLogs } from "@/lib/api/admin/inventory";

export default function InventoryLogsPage() {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminInventoryLogs({ page, limit: 50 });
      setRows(res?.data?.data ?? res?.data ?? []);
    } catch (e: any) {
      setError(e?.message || "Failed to load logs");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [page]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Inventory Logs</h1>
          <p className="text-sm text-slate-600">Stock in/out history</p>
        </div>

        <div className="flex gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="h-10 rounded-xl border px-4 text-sm disabled:opacity-50"
          >
            Prev
          </button>
          <button
            onClick={() => setPage((p) => p + 1)}
            className="h-10 rounded-xl border px-4 text-sm"
          >
            Next
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-4 rounded-2xl border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left">
              <th className="p-3">Date</th>
              <th className="p-3">Product</th>
              <th className="p-3">Type</th>
              <th className="p-3">Qty</th>
              <th className="p-3">Reason</th>
            </tr>
          </thead>
          <tbody>
            {!loading && rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-slate-500">
                  No logs found.
                </td>
              </tr>
            ) : (
              rows.map((l: any, idx: number) => (
                <tr key={l._id || idx} className="border-t">
                  <td className="p-3">{l.createdAt ? new Date(l.createdAt).toLocaleString() : "-"}</td>
                  <td className="p-3">{l.productName || l.productId || l.product || "-"}</td>
                  <td className="p-3">{l.type || l.action || "-"}</td>
                  <td className="p-3 font-semibold">{l.qty ?? l.delta ?? "-"}</td>
                  <td className="p-3">{l.reason || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}