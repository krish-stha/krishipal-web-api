"use client";

import Link from "next/link";
import { Card, CardContent } from "@/app/auth/components/ui/card";

export function RecentUsers({ loading, rows }: { loading: boolean; rows: any[] }) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="py-5">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-900">Recent Users</div>
          <Link href="/admin/users" className="text-xs text-slate-500 hover:underline">
            View all
          </Link>
        </div>

        <div className="mt-3 divide-y">
          {loading ? (
            <div className="py-6 text-sm text-slate-500">Loading...</div>
          ) : rows.length === 0 ? (
            <div className="py-6 text-sm text-slate-500">No users yet.</div>
          ) : (
            rows.map((u: any) => (
              <Link
                key={u._id}
                href={`/admin/users/${u._id}`}
                className="block py-3 rounded-xl hover:bg-slate-50 transition"
              >
                <div className="px-2">
                  <div className="text-sm font-medium text-slate-900 truncate">
                    {u.fullName || "-"}
                  </div>
                  <div className="text-xs text-slate-500 mt-1 truncate">
                    {u.email || "-"} • {u.role || "user"}
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