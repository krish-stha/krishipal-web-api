"use client";

import { useEffect, useMemo, useState } from "react";
import {
  adminLowStock,
  adminInventoryLogs,
  adminStockIn,
  adminStockOut,
} from "@/lib/api/admin/inventory";
import { api } from "@/lib/api/axios";
import { endpoints } from "@/lib/api/endpoints";

type ProductLite = {
  _id: string;
  name: string;
  sku: string;
  stock: number;
  slug?: string;
};

export default function AdminInventoryPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [products, setProducts] = useState<ProductLite[]>([]);
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);

  const [selectedProductId, setSelectedProductId] = useState("");
  const [qtyText, setQtyText] = useState<string>("1");
  const [reason, setReason] = useState("");

  const selectedProduct = useMemo(() => {
    return products.find((p) => String(p._id) === String(selectedProductId)) || null;
  }, [products, selectedProductId]);

  async function loadAll() {
    setLoading(true);
    setError("");
    try {
      // 1) load products for dropdown (admin products endpoint)
      // If your admin/products returns {data:[...]} this will work.
      const prodRes = await api.get(endpoints.admin.products, {
        params: { page: 1, limit: 200 },
      });

      const prodRows =
        prodRes?.data?.data?.rows ||
        prodRes?.data?.data ||
        prodRes?.data?.rows ||
        prodRes?.data ||
        [];

      const normalized: ProductLite[] = (Array.isArray(prodRows) ? prodRows : []).map((p: any) => ({
        _id: String(p._id),
        name: String(p.name || ""),
        sku: String(p.sku || ""),
        stock: Number(p.stock ?? 0),
        slug: p.slug ? String(p.slug) : undefined,
      }));

      setProducts(normalized);

      // auto select first product if none selected
      if (!selectedProductId && normalized.length > 0) {
        setSelectedProductId(normalized[0]._id);
      }

      // 2) load dashboard data
      const [lsRes, logRes] = await Promise.all([
        adminLowStock(5),
        adminInventoryLogs({ page: 1, limit: 20 }),
      ]);

      setLowStock(lsRes?.data?.data ?? lsRes?.data ?? []);
      setLogs(logRes?.data?.data ?? logRes?.data ?? []);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function parseQtyOrThrow(): number {
    const n = Number(qtyText);
    if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1) {
      throw new Error("Qty must be an integer >= 1");
    }
    return n;
  }

  const onStockIn = async () => {
    setError("");
    try {
      if (!selectedProductId) throw new Error("Select a product");
      const qty = parseQtyOrThrow();

      setLoading(true);
      await adminStockIn({
        productId: selectedProductId,
        qty,
        reason: reason.trim() || undefined,
      });

      setReason("");
      setQtyText("1");
      await loadAll();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Stock-in failed");
    } finally {
      setLoading(false);
    }
  };

  const onStockOut = async () => {
    setError("");
    try {
      if (!selectedProductId) throw new Error("Select a product");
      const qty = parseQtyOrThrow();

      setLoading(true);
      await adminStockOut({
        productId: selectedProductId,
        qty,
        reason: reason.trim() || undefined,
      });

      setReason("");
      setQtyText("1");
      await loadAll();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Stock-out failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Inventory</h1>
        <p className="text-sm text-slate-600">Inventory dashboard</p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border bg-white p-5">
          <div className="text-sm text-slate-500">Low stock (≤ 5)</div>
          <div className="text-3xl font-bold mt-2">{loading ? "…" : lowStock.length}</div>
        </div>

        <div className="md:col-span-2 rounded-2xl border bg-white p-5">
          <div className="font-semibold">Quick Stock Update</div>

          <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-2">
            {/* Product dropdown */}
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="h-10 rounded-xl border px-3 text-sm md:col-span-2"
              disabled={loading}
            >
              {products.length === 0 ? (
                <option value="">No products</option>
              ) : (
                products.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.sku}) — Stock: {p.stock}
                  </option>
                ))
              )}
            </select>

            {/* Qty input that allows backspace */}
            <input
              type="text"
              inputMode="numeric"
              value={qtyText}
              onChange={(e) => {
                // allow empty, or digits only
                const v = e.target.value;
                if (v === "" || /^[0-9]+$/.test(v)) setQtyText(v);
              }}
              placeholder="Qty"
              className="h-10 rounded-xl border px-3 text-sm"
              disabled={loading}
            />

            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason (optional)"
              className="h-10 rounded-xl border px-3 text-sm"
              disabled={loading}
            />
          </div>

          {selectedProduct && (
            <div className="mt-2 text-xs text-slate-600">
              Selected: <span className="font-semibold">{selectedProduct.name}</span> • SKU:{" "}
              <span className="font-semibold">{selectedProduct.sku}</span> • Current stock:{" "}
              <span className="font-semibold">{selectedProduct.stock}</span>
            </div>
          )}

          <div className="mt-3 flex gap-2">
            <button
              onClick={onStockIn}
              disabled={loading || !selectedProductId}
              className="h-10 rounded-xl bg-green-600 px-4 text-sm font-semibold text-white disabled:opacity-50"
            >
              Stock In
            </button>
            <button
              onClick={onStockOut}
              disabled={loading || !selectedProductId}
              className="h-10 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white disabled:opacity-50"
            >
              Stock Out
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-white overflow-hidden">
        <div className="p-4 font-semibold">Recent Inventory Logs</div>
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
            {!loading && logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-slate-500">
                  No logs found.
                </td>
              </tr>
            ) : (
              logs.map((l: any, idx: number) => (
                <tr key={l._id || idx} className="border-t">
                  <td className="p-3">{l.createdAt ? new Date(l.createdAt).toLocaleString() : "-"}</td>
                  <td className="p-3">
                    {l.productName || l.product?.name || l.productId || l.product || "-"}
                  </td>
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