"use client";

import { useEffect, useState } from "react";
import { adminLowStock } from "@/lib/api/admin/inventory";
import { adminGetSettings } from "@/lib/api/admin/settings";

export default function LowStockPage() {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<any[]>([]);
  const [threshold, setThreshold] = useState<number>(5);
  const [error, setError] = useState("");

  // ✅ 1) Load default threshold from settings ONCE
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const res = await adminGetSettings();

        // usually backend returns: { success: true, data: settings }
        const settings = res?.data?.data ?? res?.data ?? {};
        const t = Number(settings?.lowStockThreshold ?? 5);

        if (!alive) return;
        setThreshold(Number.isFinite(t) ? Math.max(1, t) : 5);
      } catch (e) {
        // ignore settings load errors; fallback stays 5
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  // ✅ 2) Load low stock whenever threshold changes
  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await adminLowStock(threshold);

        // backend might return { success, data: rows } OR axios response
        const data = res?.data?.data ?? res?.data ?? [];
        if (!alive) return;

        setRows(Array.isArray(data) ? data : []);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.response?.data?.message || e?.message || "Failed to load low stock");
        setRows([]);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [threshold]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Low Stock</h1>
          <p className="text-sm text-slate-600">Products with stock ≤ {threshold}</p>
        </div>

        <input
          type="number"
          value={threshold}
          onChange={(e) => setThreshold(Math.max(1, Number(e.target.value || 1)))}
          className="h-10 w-24 rounded-xl border px-3 text-sm"
        />
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
              <th className="p-3">Name</th>
              <th className="p-3">SKU</th>
              <th className="p-3">Stock</th>
            </tr>
          </thead>

          <tbody>
            {!loading && rows.length === 0 ? (
              <tr>
                <td className="p-4 text-slate-500" colSpan={3}>
                  No low stock items.
                </td>
              </tr>
            ) : loading ? (
              <tr>
                <td className="p-4 text-slate-500" colSpan={3}>
                  Loading...
                </td>
              </tr>
            ) : (
              rows.map((p: any) => (
                <tr key={p._id} className="border-t">
                  <td className="p-3 font-medium">{p.name || "-"}</td>
                  <td className="p-3">{p.sku || "-"}</td>
                  <td className="p-3 font-bold">{Number(p.stock ?? 0)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}