"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import Cookies from "js-cookie";
import { Input } from "@/app/auth/components/ui/input";
import { Button } from "@/app/auth/components/ui/button";

const API = process.env.NEXT_PUBLIC_API_URL!;

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

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const token = Cookies.get("krishipal_token");
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v) fd.append(k, v); // only send filled
      });
      if (file) fd.append("profilePicture", file);

      const res = await fetch(`${API}/admin/users/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Update failed");

      alert("Updated ✅");
      router.push("/admin/users");
    } catch (e: any) {
      alert(e.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this user?")) return;

    setLoading(true);
    try {
      const token = Cookies.get("krishipal_token");
      const res = await fetch(`${API}/admin/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Delete failed");

      alert("Deleted ✅");
      router.push("/admin/users");
    } catch (e: any) {
      alert(e.message || "Error");
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
