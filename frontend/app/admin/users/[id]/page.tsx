// app/admin/users/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { adminGetUserById } from "@/lib/api/admin/user";
import { Button } from "@/app/auth/components/ui/button";
import { ArrowLeft, User as UserIcon, Shield } from "lucide-react";

const formatDate = (value?: string) => {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};


export default function AdminUserDetailPage() {
  const { id } = useParams();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await adminGetUserById(id as string);
        setUser(res.data);
      } catch (e: any) {
        alert(e?.response?.data?.message || e.message || "Failed");
      }
    })();
  }, [id]);

  if (!user) {
    return (
      <div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-slate-500">Admin / Users</div>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">
              User Detail
            </h1>
          </div>

          <Link href="/admin/users">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
        </div>

        <div className="mt-6 rounded-2xl border bg-slate-50 p-6 text-slate-600">
          Loading...
        </div>
      </div>
    );
  }

  const isAdmin = user.role === "admin";

  return (
    <div>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="text-sm text-slate-500">Admin / Users / Detail</div>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">
            {user.fullName || "User"}{" "}
            <span className="text-slate-400 font-normal">({user.role})</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            View basic profile and role information.
          </p>
        </div>

        <div className="flex gap-2">
          <Link href="/admin/users">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>

          <Link href={`/admin/users/${user._id}/edit`}>
            <Button className="bg-green-600 hover:bg-green-700">Edit</Button>
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {/* Profile card */}
        <div className="md:col-span-2 rounded-2xl border bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-green-50 ring-1 ring-green-100 flex items-center justify-center text-green-800 font-semibold">
              {(user.fullName?.[0] || user.email?.[0] || "U").toUpperCase()}
            </div>
            <div>
              <div className="font-semibold text-slate-900">
                {user.fullName || "—"}
              </div>
              <div className="text-sm text-slate-500">{user.email}</div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 text-sm">
            <div className="rounded-xl bg-slate-50 p-4">
              <div className="text-xs font-semibold text-slate-500">USER ID</div>
              <div className="mt-1 font-mono text-slate-900">{user._id}</div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <UserIcon className="h-4 w-4" />
                  Name
                </div>
                <div className="mt-1 text-slate-900">{user.fullName || "—"}</div>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <Shield className="h-4 w-4" />
                  Role
                </div>
                <div className="mt-2">
                  <span
                    className={[
                      "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
                      isAdmin
                        ? "bg-green-50 text-green-800 ring-1 ring-green-100"
                        : "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
                    ].join(" ")}
                  >
                    {user.role}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Side card */}
        <div className="rounded-2xl border bg-white p-6">
          <div className="text-sm font-semibold text-slate-900">Actions</div>
          <p className="mt-1 text-xs text-slate-500">
            Manage this user from edit page.
          </p>

          <div className="mt-4 space-y-2">
            <Link href={`/admin/users/${user._id}/edit`} className="block">
              <Button className="w-full bg-green-600 hover:bg-green-700">
                Edit user
              </Button>
            </Link>
            <Link href="/admin/users" className="block">
              <Button variant="outline" className="w-full">
                Back to list
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
