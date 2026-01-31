// app/admin/users/[id]/edit/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Input } from "@/app/auth/components/ui/input";
import { Button } from "@/app/auth/components/ui/button";
import {
  adminGetUserById,
  adminUpdateUser,
  adminSoftDeleteUser,
} from "@/lib/api/admin/user";
import { ArrowLeft, Save, Trash2 } from "lucide-react";

export default function AdminUserEditPage() {
  const { id } = useParams();
  const router = useRouter();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    countryCode: "",
    phone: "",
    address: "",
    password: "",
    role: "user",
  });

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const onChange = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    (async () => {
      try {
        const res = await adminGetUserById(id as string);
        const u = res.data;
        setForm({
          fullName: u.fullName || "",
          email: u.email || "",
          countryCode: u.countryCode || "",
          phone: u.phone || "",
          address: u.address || "",
          password: "",
          role: u.role || "user",
        });
      } catch (e: any) {
        alert(e?.response?.data?.message || e.message || "Failed to load user");
      }
    })();
  }, [id]);

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v) fd.append(k, v);
      });
      if (file) fd.append("profilePicture", file);

      await adminUpdateUser(id as string, fd);

      alert("Updated ✅");
      router.push("/admin/users");
    } catch (e: any) {
      alert(e?.response?.data?.message || e.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this user?")) return;

    setLoading(true);
    try {
      await adminSoftDeleteUser(id as string);
      alert("Deleted ✅");
      router.push("/admin/users");
    } catch (e: any) {
      alert(e?.response?.data?.message || e.message || "Delete failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="text-sm text-slate-500">Admin / Users / Edit</div>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">
            Edit User
          </h1>
          <p className="mt-1 text-sm text-slate-500 font-mono">ID: {id as string}</p>
        </div>

        <div className="flex gap-2">
          <Link href="/admin/users">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>

          <Button
            onClick={handleUpdate}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 gap-2"
          >
            <Save className="h-4 w-4" />
            {loading ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {/* Form */}
        <div className="lg:col-span-2 rounded-2xl border bg-white p-6">
          <div className="text-sm font-semibold text-slate-900">User info</div>
          <p className="mt-1 text-xs text-slate-500">
            Update profile data and role.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600">
                Full Name
              </label>
              <Input
                placeholder="Full Name"
                value={form.fullName}
                onChange={(e) => onChange("fullName", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600">
                Email
              </label>
              <Input
                placeholder="Email"
                value={form.email}
                onChange={(e) => onChange("email", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600">
                Country Code
              </label>
              <Input
                placeholder="Country Code"
                value={form.countryCode}
                onChange={(e) => onChange("countryCode", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600">
                Phone
              </label>
              <Input
                placeholder="Phone"
                value={form.phone}
                onChange={(e) => onChange("phone", e.target.value)}
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-semibold text-slate-600">
                Address
              </label>
              <Input
                placeholder="Address"
                value={form.address}
                onChange={(e) => onChange("address", e.target.value)}
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-semibold text-slate-600">
                New Password (optional)
              </label>
              <Input
                type="password"
                placeholder="New Password (optional)"
                value={form.password}
                onChange={(e) => onChange("password", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600">Role</label>
              <select
                className="w-full rounded-xl border bg-white px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-green-200"
                value={form.role}
                onChange={(e) => onChange("role", e.target.value)}
              >
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600">
                Profile picture
              </label>
              <input
                type="file"
                accept="image/*"
                className="w-full rounded-xl border bg-white px-3 py-2 text-sm"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>
        </div>

        {/* Danger zone */}
        <div className="rounded-2xl border bg-white p-6">
          <div className="text-sm font-semibold text-slate-900">Danger zone</div>
          <p className="mt-1 text-xs text-slate-500">
            Soft delete this user from the system.
          </p>

          <Button
            onClick={handleDelete}
            disabled={loading}
            variant="outline"
            className="mt-4 w-full gap-2 border-red-200 text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            {loading ? "Working..." : "Delete user"}
          </Button>

          <p className="mt-1 text-xs text-slate-500">
  This action permanently removes the user from the system.
</p>
        </div>
      </div>
    </div>
  );
}
