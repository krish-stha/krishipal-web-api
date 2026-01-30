"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Input } from "@/app/auth/components/ui/input";
import { Button } from "@/app/auth/components/ui/button";
import { adminGetUserById, adminUpdateUser, adminSoftDeleteUser } from "@/lib/api/admin/user";

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

  // ✅ Prefill (recommended)
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
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-6">Edit User: {id as string}</h1>

      <div className="max-w-xl space-y-4">
        <Input placeholder="Full Name" value={form.fullName} onChange={(e) => onChange("fullName", e.target.value)} />
        <Input placeholder="Email" value={form.email} onChange={(e) => onChange("email", e.target.value)} />
        <Input placeholder="Country Code" value={form.countryCode} onChange={(e) => onChange("countryCode", e.target.value)} />
        <Input placeholder="Phone" value={form.phone} onChange={(e) => onChange("phone", e.target.value)} />
        <Input placeholder="Address" value={form.address} onChange={(e) => onChange("address", e.target.value)} />
        <Input type="password" placeholder="New Password (optional)" value={form.password} onChange={(e) => onChange("password", e.target.value)} />

        <select className="border p-3 rounded w-full" value={form.role} onChange={(e) => onChange("role", e.target.value)}>
          <option value="user">user</option>
          <option value="admin">admin</option>
        </select>

        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />

        <div className="flex gap-3">
          <Button onClick={handleUpdate} disabled={loading} className="bg-green-600 hover:bg-green-700">
            {loading ? "Saving..." : "Save"}
          </Button>
          <Button onClick={handleDelete} disabled={loading} variant="outline" className="border-red-500 text-red-600">
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
