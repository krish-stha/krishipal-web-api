"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/app/auth/components/ui/input";
import { Button } from "@/app/auth/components/ui/button";
import { adminCreateUser } from "@/lib/api/admin/user";

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
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-6">Create User</h1>

      <div className="max-w-xl space-y-4">
        <Input placeholder="Full Name" value={form.fullName} onChange={(e) => onChange("fullName", e.target.value)} />
        <Input placeholder="Email" value={form.email} onChange={(e) => onChange("email", e.target.value)} />
        <Input placeholder="Country Code" value={form.countryCode} onChange={(e) => onChange("countryCode", e.target.value)} />
        <Input placeholder="Phone" value={form.phone} onChange={(e) => onChange("phone", e.target.value)} />
        <Input placeholder="Address" value={form.address} onChange={(e) => onChange("address", e.target.value)} />
        <Input type="password" placeholder="Password" value={form.password} onChange={(e) => onChange("password", e.target.value)} />

        <select className="border p-3 rounded w-full" value={form.role} onChange={(e) => onChange("role", e.target.value)}>
          <option value="user">user</option>
          <option value="admin">admin</option>
        </select>

        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />

        <Button onClick={handleSubmit} disabled={loading} className="bg-green-600 hover:bg-green-700">
          {loading ? "Creating..." : "Create"}
        </Button>
      </div>
    </div>
  );
}
