"use client";

import Link from "next/link";
import { Card, CardContent } from "@/app/auth/components/ui/card";

export function RecentOrders({ loading, rows }: { loading: boolean; rows: any[] }) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="py-5">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-900">Recent Orders</div>
          <Link href="/admin/orders" className="text-xs text-slate-500 hover:underline">
            View all
          </Link>
        </div>

        <div className="mt-3 divide-y">
          {loading ? (
            <div className="py-6 text-sm text-slate-500">Loading...</div>
          ) : rows.length === 0 ? (
            <div className="py-6 text-sm text-slate-500">No orders yet.</div>
          ) : (
            rows.map((o: any) => (
              <Link
                key={o._id}
                href={`/admin/orders/${o._id}`}
                className="block py-3 rounded-xl hover:bg-slate-50 transition"
              >
                <div className="flex items-center justify-between gap-3 px-2">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-900 truncate">
                      {o.user?.fullName} • {o.user?.email}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {o.status} • {o.paymentStatus} • {o.paymentMethod}
                    </div>
                  </div>

                  <div className="text-sm font-semibold text-slate-900 whitespace-nowrap">
                    Rs. {o.total}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}