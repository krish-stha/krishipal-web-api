"use client";
import { Card, CardContent } from "@/app/auth/components/ui/card";

export function StatCard({ title, value }: { title: string; value: any }) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="py-5">
        <div className="text-xs font-semibold text-slate-500">{title}</div>
        <div className="mt-2 text-2xl font-bold text-slate-900">{value}</div>
      </CardContent>
    </Card>
  );
}