"use client";

import { Card, CardContent } from "@/app/auth/components/ui/card";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export function RevenueChart({
  loading,
  rows,
  from,
  to,
  chartType,
}: {
  loading: boolean;
  rows: any[];
  from?: string;
  to?: string;
  chartType?: "day" | "month";
}) {
  const title = chartType === "day" ? "Daily Revenue" : "Monthly Revenue";

  return (
    <Card className="rounded-2xl">
      <CardContent className="py-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-900">{title}</div>
            <div className="text-xs text-slate-500 mt-1">
              Paid orders only {from && to ? `• ${from} → ${to}` : ""}
            </div>
          </div>
        </div>

        <div className="mt-4 h-[260px]">
          {loading ? (
            <div className="h-full grid place-items-center text-sm text-slate-500">
              Loading chart...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rows}>
                <CartesianGrid strokeDasharray="3 3" />
                {/* ✅ backend uses label */}
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}