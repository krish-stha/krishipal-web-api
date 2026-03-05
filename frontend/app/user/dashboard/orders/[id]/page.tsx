"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/app/auth/components/ui/card";
import { Button } from "@/app/auth/components/ui/button";
import { cancelMyOrder, getMyOrderById } from "@/lib/api/order";
import { initiateKhaltiPayment } from "@/lib/api/payment";
import { endpoints } from "@/lib/api/endpoints";
import { getToken } from "@/lib/cookie";
import { getPublicSettings } from "@/lib/api/settings";

// ✅ you already have this
import { requestRefund, getMyRefunds } from "@/lib/api/refund";

// ✅ Professional modal
import { NoteDialog } from "@/app/auth/components/ui/alert-dialog";

type PaymentMethod = "COD" | "KHALTI" | "ESEWA";

function money(n: any) {
  const v = Number(n ?? 0);
  return `Rs. ${Number.isFinite(v) ? v : 0}`;
}

function isValidObjectId(v: string) {
  return /^[a-fA-F0-9]{24}$/.test(v);
}

function statusLabel(s?: string) {
  const v = String(s || "").toLowerCase();
  if (!v) return "-";
  return v.charAt(0).toUpperCase() + v.slice(1);
}

function refundStatusBadge(status: string) {
  const s = String(status || "").toLowerCase();
  const base =
    "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold border";

  if (s === "requested") return `${base} bg-amber-50 text-amber-700 border-amber-200`;
  if (s === "approved") return `${base} bg-blue-50 text-blue-700 border-blue-200`;
  if (s === "processed") return `${base} bg-green-50 text-green-700 border-green-200`;
  if (s === "rejected") return `${base} bg-red-50 text-red-700 border-red-200`;

  return `${base} bg-slate-50 text-slate-700 border-slate-200`;
}

export default function TrackOrderPage() {
  const params = useParams();
  const router = useRouter();
  const sp = useSearchParams();

  const id = useMemo(() => {
    const p: any = params || {};
    const firstKey = Object.keys(p)[0];
    const val = firstKey ? p[firstKey] : "";
    return Array.isArray(val) ? String(val[0] || "") : String(val || "");
  }, [params]);

  const [loading, setLoading] = useState(false);
  const [refundLoading, setRefundLoading] = useState(false);

  const [error, setError] = useState("");
  const [order, setOrder] = useState<any>(null);

  // ✅ refunds state
  const [refunds, setRefunds] = useState<any[]>([]);

  // ✅ settings-driven payments
  const [settings, setSettings] = useState<any>(null);
  const [payments, setPayments] = useState<{
    COD: boolean;
    KHALTI: boolean;
    ESEWA: boolean;
  }>({
    COD: true,
    KHALTI: true,
    ESEWA: true,
  });

  const [paymentChoice, setPaymentChoice] = useState<PaymentMethod>("COD");

  // ✅ Cancel dialog state
  const [cancelOpen, setCancelOpen] = useState(false);

  // ✅ Refund dialog state (NEW)
  const [refundOpen, setRefundOpen] = useState(false);

  const fetchSettings = async () => {
    try {
      const res = await getPublicSettings();
      const s = res?.data || null;
      setSettings(s);

      const p = s?.payments || {};
      const normalized = {
        COD: !!p.COD,
        KHALTI: !!p.KHALTI,
        ESEWA: !!p.ESEWA,
      };

      setPayments(normalized);

      const firstEnabled: PaymentMethod | null = normalized.COD
        ? "COD"
        : normalized.KHALTI
        ? "KHALTI"
        : normalized.ESEWA
        ? "ESEWA"
        : null;

      if (firstEnabled) setPaymentChoice(firstEnabled);
    } catch {
      setSettings(null);
      setPayments({ COD: true, KHALTI: true, ESEWA: true });
    }
  };

  const fetchOrder = async () => {
    if (!isValidObjectId(id)) {
      setError("Invalid order id in URL");
      setOrder(null);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await getMyOrderById(id);
      setOrder(res?.data || null);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to load order");
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchRefunds = async () => {
    try {
      const res = await getMyRefunds();
      const all = res?.data || [];
      const list = all.filter((r: any) => String(r.order) === String(id));
      setRefunds(list);
    } catch {
      setRefunds([]);
    }
  };

  useEffect(() => {
    if (id) {
      fetchOrder();
      fetchRefunds();
      fetchSettings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    const paid = sp.get("paid");
    if (paid === "1") setError("");
    if (paid === "0") setError("Payment verification failed. Try again.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const subtotal = useMemo(() => Number(order?.subtotal || 0), [order]);
  const shipping = useMemo(() => Number(order?.shippingFee || 0), [order]);
  const total = useMemo(
    () => Number(order?.total || subtotal + shipping),
    [order, subtotal, shipping]
  );

  const currentStatus = String(order?.status || "").toLowerCase();
  const paymentStatus = String(order?.paymentStatus || "unpaid").toLowerCase();
  const gateway = String(order?.paymentGateway || "COD").toUpperCase();

  const steps = ["pending", "confirmed", "shipped", "delivered"] as const;
  const activeIndex = Math.max(0, steps.indexOf(currentStatus as any));

  const canCancel = currentStatus === "pending" && paymentStatus !== "paid";
  const canPay =
    ["pending", "confirmed", "shipped"].includes(currentStatus) &&
    paymentStatus !== "paid";

  const canRequestRefund =
    paymentStatus === "paid" &&
    (currentStatus === "pending" || currentStatus === "confirmed");

  const goBackSmart = () => {
    router.push("/user/dashboard/shop");
  };

  // ✅ Cancel modal open
  const onCancelClick = () => {
    if (!canCancel) return;
    setCancelOpen(true);
  };

  // ✅ Cancel action
  const doCancel = async (reason: string) => {
    if (!canCancel) return;

    setLoading(true);
    setError("");
    try {
      const res = await cancelMyOrder(id, (reason || "").trim());
      setOrder(res?.data || null);
      setCancelOpen(false);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to cancel order");
    } finally {
      setLoading(false);
    }
  };

  const onDownloadInvoice = async () => {
    try {
      const token = getToken();
      if (!token) {
        setError("Login required to download invoice");
        return;
      }

      const url = `${process.env.NEXT_PUBLIC_API_URL}${endpoints.orders.invoice(id)}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Invoice download failed");
      }

      const blob = await res.blob();
      const fileUrl = window.URL.createObjectURL(blob);
      window.open(fileUrl, "_blank");
    } catch (e: any) {
      setError(e?.message || "Invoice download failed");
    }
  };

  const onPay = async () => {
    setError("");

    if (
      (paymentChoice === "COD" && !payments.COD) ||
      (paymentChoice === "KHALTI" && !payments.KHALTI) ||
      (paymentChoice === "ESEWA" && !payments.ESEWA)
    ) {
      setError("Selected payment method is disabled.");
      return;
    }

    if (paymentChoice === "KHALTI") {
      setLoading(true);
      try {
        const res = await initiateKhaltiPayment(id);
        const paymentUrl = res?.data?.payment_url;
        if (!paymentUrl) throw new Error("No payment_url received");
        window.location.assign(paymentUrl);
      } catch (e: any) {
        setError(e?.response?.data?.message || e?.message || "Failed to initiate Khalti");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (paymentChoice === "ESEWA") {
      router.push(`/payments/esewa/redirect?orderId=${id}`);
      return;
    }

    setError("Pay Now is only for Khalti/eSewa payments.");
  };

  // ✅ Refund modal open (NEW)
  const onRefundClick = () => {
    if (!canRequestRefund || refundLoading) return;
    setRefundOpen(true);
  };

  // ✅ Refund action using modal note text: "amount | reason"
  // Example: "200 | wrong amount charged"
  const doRefund = async (note: string) => {
    if (!canRequestRefund || refundLoading) return;

    const max = Number(order?.total || 0);

    const raw = String(note || "").trim();
    if (!raw) {
      setError("Please enter refund amount.");
      return;
    }

    const parts = raw.split("|");
    const amountStr = String(parts[0] || "").trim();
    const reason = String(parts[1] || "").trim();

    const amount = Number(amountStr);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Invalid refund amount");
      return;
    }
    if (amount > max) {
      setError(`Refund amount exceeds max Rs. ${max}`);
      return;
    }

    try {
      setError("");
      setRefundLoading(true);

      const res = await requestRefund({
        orderId: id,
        amount,
        reason: reason || undefined,
      });

      const created = res?.data || res;
      if (created) setRefunds((prev) => [created, ...prev]);

      setRefundOpen(false);
      await fetchRefunds();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Refund request failed");
    } finally {
      setRefundLoading(false);
    }
  };

  const showPayNow =
    canPay &&
    ((paymentChoice === "KHALTI" && payments.KHALTI) ||
      (paymentChoice === "ESEWA" && payments.ESEWA));

  return (
    <div className="p-6">
      {/* ✅ Cancel modal */}
      <NoteDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel this order?"
        description="Tell us the reason (optional). This action cannot be undone."
        label="Cancel reason (optional)"
        placeholder="Example: Ordered by mistake"
        confirmText="Yes, cancel"
        cancelText="No"
        destructive
        loading={loading}
        onConfirm={doCancel}
      />

      {/* ✅ Refund modal (NEW) */}
      <NoteDialog
        open={refundOpen}
        onOpenChange={setRefundOpen}
        title="Request a refund"
        description="Enter Refund Amount"
        label="Refund amount"
        placeholder="Example: 200"
        confirmText="Submit refund"
        cancelText="Cancel"
        loading={refundLoading}
        onConfirm={doRefund}
      />

      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Track Order</h1>
          <p className="text-slate-600 mt-1"></p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="border-slate-300" onClick={goBackSmart}>
            Back
          </Button>

          {showPayNow && (
            <Button
              className={
                paymentChoice === "KHALTI"
                  ? "bg-purple-600 hover:bg-purple-700 text-white"
                  : "bg-green-600 hover:bg-green-700 text-white"
              }
              onClick={onPay}
              disabled={loading}
            >
              {loading ? "Processing..." : `Pay Now `}
            </Button>
          )}

          {canCancel && (
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={onCancelClick}
              disabled={loading}
            >
              {loading ? "Cancelling..." : "Cancel Order"}
            </Button>
          )}
        </div>
      </div>

      {error && <div className="text-red-600 mb-4">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-2xl p-5">
            <div className="font-semibold text-slate-900 mb-3">Status</div>

            <div className="flex items-center gap-2">
              {steps.map((s, idx) => {
                const done = idx <= activeIndex;
                return (
                  <div key={s} className="flex-1">
                    <div className={`h-2 rounded-full ${done ? "bg-green-600" : "bg-slate-200"}`} />
                    <div className="text-xs text-center mt-2 text-slate-600">{statusLabel(s)}</div>
                  </div>
                );
              })}
            </div>

            <div className="text-sm text-slate-600 mt-4">
              Current status: <b className="text-slate-900">{statusLabel(order?.status)}</b>
            </div>

            {currentStatus === "cancelled" && (
              <div className="text-sm text-red-600 mt-2 space-y-1">
                <div>This order has been cancelled.</div>
                {order?.cancel_reason ? (
                  <div className="text-slate-700">
                    Reason: <b>{String(order.cancel_reason)}</b>
                  </div>
                ) : (
                  <div className="text-slate-500">Reason: -</div>
                )}
              </div>
            )}
          </Card>

          <Card className="rounded-2xl overflow-hidden">
            <div className="p-4 border-b">
              <div className="font-semibold text-slate-900">Items</div>
            </div>

            <div className="overflow-auto">
              <table className="min-w-[900px] w-full text-sm">
                <thead className="bg-slate-50">
                  <tr className="text-left">
                    <th className="p-3 font-semibold">Product</th>
                    <th className="p-3 font-semibold">SKU</th>
                    <th className="p-3 font-semibold">Price</th>
                    <th className="p-3 font-semibold">Qty</th>
                    <th className="p-3 font-semibold">Line Total</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td className="p-4 text-slate-500" colSpan={5}>
                        Loading...
                      </td>
                    </tr>
                  ) : (order?.items || []).length === 0 ? (
                    <tr>
                      <td className="p-4 text-slate-500" colSpan={5}>
                        No items
                      </td>
                    </tr>
                  ) : (
                    (order.items || []).map((it: any, idx: number) => {
                      const price = Number(it.priceSnapshot ?? 0);
                      const qty = Number(it.qty ?? 0);
                      const lineTotal = price * qty;

                      return (
                        <tr key={`${it?.sku || idx}`} className="border-t">
                          <td className="p-3">
                            <div className="font-semibold text-slate-900">{it?.name || "-"}</div>
                            {it?.slug ? (
                              <Link
                                href={`/user/dashboard/shop/${it.slug}`}
                                className="text-xs text-slate-500 hover:underline"
                              >
                                /{it.slug}
                              </Link>
                            ) : (
                              <div className="text-xs text-slate-500">-</div>
                            )}
                          </td>
                          <td className="p-3">{it?.sku || "-"}</td>
                          <td className="p-3">{money(price)}</td>
                          <td className="p-3">{qty}</td>
                          <td className="p-3 font-semibold text-green-700">{money(lineTotal)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* RIGHT */}
        <div className="space-y-6">
          <Card className="rounded-2xl p-5">
            <div className="font-semibold text-slate-900 mb-3">Summary</div>

            {paymentStatus === "paid" && (
              <div className="mt-2 space-y-3">
                <Button
                  variant="outline"
                  className="border-slate-300 w-full"
                  onClick={onDownloadInvoice}
                >
                  Download Invoice (PDF)
                </Button>

                {canRequestRefund && (
                  <Button
                    variant="outline"
                    className="border-slate-300 w-full"
                    onClick={onRefundClick} // ✅ modal instead of prompt
                    disabled={refundLoading}
                  >
                    {refundLoading ? "Submitting..." : "Request Refund"}
                  </Button>
                )}

                {refunds.length > 0 && (
                  <div className="rounded-xl border bg-slate-50 p-3">
                    <div className="font-semibold text-slate-900 text-sm mb-2">Refund Requests</div>
                    <div className="space-y-2">
                      {refunds.map((r: any) => (
                        <div key={r._id} className="flex items-center justify-between gap-2">
                          <div className="text-sm text-slate-700">
                            Rs. {Math.floor(Number(r.amountPaisa || 0) / 100)}
                          </div>
                          <span className={refundStatusBadge(String(r.status))}>
                            {String(r.status).toUpperCase()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between text-sm text-slate-600 mt-4">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-900">{money(subtotal)}</span>
            </div>

            <div className="flex justify-between text-sm text-slate-600 mt-2">
              <span>Shipping</span>
              <span className="font-semibold text-slate-900">{money(shipping)}</span>
            </div>

            <div className="border-t mt-4 pt-4 flex justify-between">
              <span className="font-semibold text-slate-900">Total</span>
              <span className="font-bold text-slate-900">{money(total)}</span>
            </div>

            {canPay && (
              <div className="mt-4">
                <div className="text-sm font-semibold text-slate-900">Payment Method</div>

                <div className="mt-2 flex flex-wrap gap-4 text-sm">
                  {payments.COD && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="pay"
                        checked={paymentChoice === "COD"}
                        onChange={() => setPaymentChoice("COD")}
                      />
                      COD
                    </label>
                  )}

                  {payments.KHALTI && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="pay"
                        checked={paymentChoice === "KHALTI"}
                        onChange={() => setPaymentChoice("KHALTI")}
                      />
                      Khalti
                    </label>
                  )}

                  {payments.ESEWA && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="pay"
                        checked={paymentChoice === "ESEWA"}
                        onChange={() => setPaymentChoice("ESEWA")}
                      />
                      eSewa
                    </label>
                  )}
                </div>
              </div>
            )}

            <div className="text-xs text-slate-500 mt-4 space-y-1">
              <div>
                Payment Gateway: <b className="text-slate-700">{gateway}</b>
              </div>
              <div>
                Payment Status:{" "}
                <b className={paymentStatus === "paid" ? "text-green-700" : "text-slate-700"}>
                  {statusLabel(paymentStatus)}
                </b>
              </div>
            </div>
          </Card>

          <Card className="rounded-2xl p-5">
            <div className="font-semibold text-slate-900 mb-3">Delivery Address</div>
            <div className="text-sm text-slate-700">{order?.address || "-"}</div>
          </Card>
        </div>
      </div>
    </div>
  );
}