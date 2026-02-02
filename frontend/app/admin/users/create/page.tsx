"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/app/auth/components/ui/input";
import { Button } from "@/app/auth/components/ui/button";
import { adminCreateUser } from "@/lib/api/admin/user";
import { ArrowLeft, Plus } from "lucide-react";

export default function AdminCreateUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    countryCode: "",
    phone: "",
    address: "",
    password: "",
    role: "user",
  });

  const onChange = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (file) fd.append("profilePicture", file);

      await adminCreateUser(fd);

      alert("User created ✅");
      router.push("/admin/users");
    } catch (e: any) {
      alert(e?.response?.data?.message || e.message || "Create failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="text-xs font-semibold tracking-wide text-slate-500">
            USER ADMINISTRATION
          </div>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">
            Create User
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Enter account details and assign a role.
          </p>
        </div>

        <div className="flex gap-2">
          <Link href="/admin/users">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>

          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 gap-2"
          >
            <Plus className="h-4 w-4" />
            {loading ? "Creating..." : "Create"}
          </Button>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border bg-white p-6">
        <div className="text-sm font-semibold text-slate-900">Account Details</div>
        <p className="mt-1 text-xs text-slate-500">
          Make sure email and role are correct before saving.
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-600">Full Name</label>
            <Input placeholder="Full Name" value={form.fullName} onChange={(e) => onChange("fullName", e.target.value)} />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-600">Email</label>
            <Input placeholder="Email" value={form.email} onChange={(e) => onChange("email", e.target.value)} />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-600">Country Code</label>
            <Input placeholder="Country Code" value={form.countryCode} onChange={(e) => onChange("countryCode", e.target.value)} />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-600">Phone</label>
            <Input placeholder="Phone" value={form.phone} onChange={(e) => onChange("phone", e.target.value)} />
          </div>

          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-semibold text-slate-600">Address</label>
            <Input placeholder="Address" value={form.address} onChange={(e) => onChange("address", e.target.value)} />
          </div>

          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-semibold text-slate-600">Password</label>
            <Input type="password" placeholder="Password" value={form.password} onChange={(e) => onChange("password", e.target.value)} />
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
            <label className="text-xs font-semibold text-slate-600">Profile picture</label>
            <input
              type="file"
              accept="image/*"
              className="w-full rounded-xl border bg-white px-3 py-2 text-sm"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? "Creating..." : "Create"}
          </Button>

          <Link href="/admin/users">
            <Button variant="outline">Cancel</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
