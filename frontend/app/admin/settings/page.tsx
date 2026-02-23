"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/app/auth/components/ui/card";
import { Button } from "@/app/auth/components/ui/button";
import {
  adminGetSettings,
  adminUpdateSettings,
  adminUploadLogo,
} from "@/lib/api/admin/settings";

function num(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const [logoBust, setLogoBust] = useState<number>(Date.now());

  const BACKEND =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

  const [form, setForm] = useState<any>({
    storeName: "",
    storeAddress: "",
    storeEmail: "",
    storePhone: "",
    storeLogo: "",
    shippingFeeDefault: 0,
    freeShippingThreshold: null,
    lowStockThreshold: 5,
    payments: { COD: true, KHALTI: true, ESEWA: true },
  });

  const logoUrl = useMemo(() => {
    if (!form.storeLogo) return "";
    return `${BACKEND}/public/store_logo/${form.storeLogo}?t=${logoBust}`;
  }, [BACKEND, form.storeLogo, logoBust]);

  const fetchSettings = async () => {
    setLoading(true);
    setErr("");
    setMsg("");
    try {
      const res = await adminGetSettings();
      const data = res.data?.data || form;

      setForm({
        ...data,
        storePhone: data?.storePhone ?? "",
        storeLogo: data?.storeLogo ?? "",
      });

      // bust logo cache when settings refreshed
      setLogoBust(Date.now());
    } catch (e: any) {
      setErr(
        e?.response?.data?.message || e?.message || "Failed to load settings"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async () => {
    setLoading(true);
    setErr("");
    setMsg("");
    try {
      const payload = {
        storeName: String(form.storeName || ""),
        storeAddress: String(form.storeAddress || ""),
        storeEmail: String(form.storeEmail || ""),
        storePhone: String(form.storePhone || ""),

        shippingFeeDefault: num(form.shippingFeeDefault, 0),
        freeShippingThreshold:
          form.freeShippingThreshold === "" || form.freeShippingThreshold === null
            ? null
            : num(form.freeShippingThreshold, 0),

        lowStockThreshold: Math.max(1, num(form.lowStockThreshold, 5)),
        payments: {
          COD: Boolean(form.payments?.COD),
          KHALTI: Boolean(form.payments?.KHALTI),
          ESEWA: Boolean(form.payments?.ESEWA),
        },
      };

      const enabledCount =
        Number(payload.payments.COD) +
        Number(payload.payments.KHALTI) +
        Number(payload.payments.ESEWA);

      if (enabledCount === 0) {
        setErr("At least one payment method must be enabled.");
        setLoading(false);
        return;
      }

      const res = await adminUpdateSettings(payload);

      // keep storeLogo also (so it doesn't disappear after save)
      const updated = res.data?.data || payload;
      setForm((p: any) => ({
        ...p,
        ...updated,
        storePhone: updated?.storePhone ?? p.storePhone,
        storeLogo: updated?.storeLogo ?? p.storeLogo,
      }));

      setMsg("Settings saved ✅");
    } catch (e: any) {
      setErr(
        e?.response?.data?.message || e?.message || "Failed to save settings"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl p-4 sm:p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Settings
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Store profile, shipping, inventory, payments.
          </p>
        </div>

        {err && (
          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {err}
          </div>
        )}
        {msg && (
          <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            {msg}
          </div>
        )}

        <div className="grid gap-6">
          {/* Store Profile */}
          <Card className="rounded-3xl border-slate-200 bg-white shadow-sm p-5">
            <div className="text-sm font-semibold text-slate-900">
              Store Profile
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <div className="text-xs font-medium text-slate-600 mb-1">
                  Store Name
                </div>
                <input
                  value={form.storeName || ""}
                  onChange={(e) =>
                    setForm((p: any) => ({ ...p, storeName: e.target.value }))
                  }
                  className="w-full h-11 rounded-2xl border border-slate-200 px-3 text-sm outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-300"
                />
              </label>

              <label className="block">
                <div className="text-xs font-medium text-slate-600 mb-1">
                  Store Email
                </div>
                <input
                  type="email"
                  value={form.storeEmail || ""}
                  onChange={(e) =>
                    setForm((p: any) => ({ ...p, storeEmail: e.target.value }))
                  }
                  className="w-full h-11 rounded-2xl border border-slate-200 px-3 text-sm outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-300"
                />
              </label>

              <label className="block">
                <div className="text-xs font-medium text-slate-600 mb-1">
                  Store Phone
                </div>
                <input
                  value={form.storePhone || ""}
                  onChange={(e) =>
                    setForm((p: any) => ({ ...p, storePhone: e.target.value }))
                  }
                  placeholder="+97798xxxxxxx"
                  className="w-full h-11 rounded-2xl border border-slate-200 px-3 text-sm outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-300"
                />
              </label>

              {/* ✅ Store Logo */}
              <label className="block sm:col-span-2">
                <div className="text-xs font-medium text-slate-600 mb-1">
                  Store Logo
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 rounded-2xl border bg-slate-50 overflow-hidden flex items-center justify-center">
                    {form.storeLogo ? (
                      <img
                        src={logoUrl}
                        className="h-full w-full object-contain"
                        alt="Store Logo"
                      />
                    ) : (
                      <span className="text-xs text-slate-400">No logo</span>
                    )}
                  </div>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;

                      setLoading(true);
                      setErr("");
                      setMsg("");
                      try {
                        const res = await adminUploadLogo(f);
                        const updated = res.data?.data;

                        setForm((p: any) => ({
                          ...p,
                          storeLogo: updated?.storeLogo || p.storeLogo,
                        }));

                        // bust cache after upload
                        setLogoBust(Date.now());

                        setMsg("Logo uploaded ✅");
                      } catch (ex: any) {
                        setErr(
                          ex?.response?.data?.message ||
                            ex?.message ||
                            "Logo upload failed"
                        );
                      } finally {
                        setLoading(false);
                        e.target.value = "";
                      }
                    }}
                    className="block text-sm"
                  />
                </div>

                <div className="mt-2 text-xs text-slate-500">
                  Recommended: PNG/WebP, square, max 2MB.
                </div>
              </label>

              <label className="block sm:col-span-2">
                <div className="text-xs font-medium text-slate-600 mb-1">
                  Store Address (invoice footer)
                </div>
                <textarea
                  value={form.storeAddress || ""}
                  onChange={(e) =>
                    setForm((p: any) => ({ ...p, storeAddress: e.target.value }))
                  }
                  className="w-full min-h-[90px] rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-300"
                />
              </label>
            </div>
          </Card>

          {/* Shipping */}
          <Card className="rounded-3xl border-slate-200 bg-white shadow-sm p-5">
            <div className="text-sm font-semibold text-slate-900">Shipping</div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <div className="text-xs font-medium text-slate-600 mb-1">
                  Default Shipping Fee (Rs)
                </div>
                <input
                  type="number"
                  min={0}
                  value={form.shippingFeeDefault ?? 0}
                  onChange={(e) =>
                    setForm((p: any) => ({
                      ...p,
                      shippingFeeDefault: e.target.value,
                    }))
                  }
                  className="w-full h-11 rounded-2xl border border-slate-200 px-3 text-sm outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-300"
                />
              </label>

              <label className="block">
                <div className="text-xs font-medium text-slate-600 mb-1">
                  Free Shipping Threshold
                </div>
                <input
                  type="number"
                  placeholder="Leave empty to disable"
                  value={form.freeShippingThreshold ?? ""}
                  onChange={(e) =>
                    setForm((p: any) => ({
                      ...p,
                      freeShippingThreshold: e.target.value,
                    }))
                  }
                  className="w-full h-11 rounded-2xl border border-slate-200 px-3 text-sm outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-300"
                />
              </label>
            </div>
          </Card>

          {/* Preview */}
          <Card className="rounded-3xl border-slate-200 bg-white shadow-sm p-5">
            <div className="text-sm font-semibold text-slate-900">Preview</div>

            <div className="mt-3 grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Default shipping</span>
                <span className="font-semibold text-slate-900">
                  Rs. {num(form.shippingFeeDefault, 0)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-600">Free shipping over</span>
                <span className="font-semibold text-slate-900">
                  {form.freeShippingThreshold === null ||
                  form.freeShippingThreshold === ""
                    ? "Disabled"
                    : `Rs. ${num(form.freeShippingThreshold, 0)}`}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-600">Low stock threshold</span>
                <span className="font-semibold text-slate-900">
                  {Math.max(1, num(form.lowStockThreshold, 5))}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-600">Store phone</span>
                <span className="font-semibold text-slate-900">
                  {String(form.storePhone || "-")}
                </span>
              </div>

              <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-xs text-slate-500 mb-2">
                  Enabled payments
                </div>
                <div className="flex flex-wrap gap-2">
                  {form.payments?.COD && (
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-white border">
                      COD
                    </span>
                  )}
                  {form.payments?.KHALTI && (
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-white border">
                      KHALTI
                    </span>
                  )}
                  {form.payments?.ESEWA && (
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-white border">
                      ESEWA
                    </span>
                  )}
                  {!form.payments?.COD &&
                    !form.payments?.KHALTI &&
                    !form.payments?.ESEWA && (
                      <span className="text-xs text-rose-600 font-semibold">
                        None enabled (not allowed)
                      </span>
                    )}
                </div>
              </div>
            </div>
          </Card>

          {/* Inventory */}
          <Card className="rounded-3xl border-slate-200 bg-white shadow-sm p-5">
            <div className="text-sm font-semibold text-slate-900">Inventory</div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <div className="text-xs font-medium text-slate-600 mb-1">
                  Low Stock Threshold
                </div>
                <input
                  type="number"
                  min={1}
                  value={form.lowStockThreshold ?? 5}
                  onChange={(e) =>
                    setForm((p: any) => ({
                      ...p,
                      lowStockThreshold: e.target.value,
                    }))
                  }
                  className="w-full h-11 rounded-2xl border border-slate-200 px-3 text-sm outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-300"
                />
              </label>
              <div className="text-xs text-slate-500 flex items-end">
                Products with stock ≤ threshold will appear in Low Stock.
              </div>
            </div>
          </Card>

          {/* Payments */}
          <Card className="rounded-3xl border-slate-200 bg-white shadow-sm p-5">
            <div className="text-sm font-semibold text-slate-900">
              Payment Methods
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3 text-sm">
              {["COD", "KHALTI", "ESEWA"].map((k) => (
                <label
                  key={k}
                  className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3"
                >
                  <input
                    type="checkbox"
                    checked={Boolean(form.payments?.[k])}
                    onChange={(e) =>
                      setForm((p: any) => ({
                        ...p,
                        payments: {
                          ...(p.payments || {}),
                          [k]: e.target.checked,
                        },
                      }))
                    }
                  />
                  <span className="font-medium text-slate-900">{k}</span>
                </label>
              ))}
            </div>
          </Card>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              className="border-slate-300 bg-white hover:bg-slate-100"
              onClick={fetchSettings}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl"
              onClick={save}
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}