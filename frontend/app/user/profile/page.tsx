"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useAuth } from "@/lib/contexts/auth-contexts";
import { Input } from "@/app/auth/components/ui/input";
import { Button } from "@/app/auth/components/ui/button";

const API = process.env.NEXT_PUBLIC_API_URL!;

export default function UserProfilePage() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    countryCode: "",
    phone: "",
    address: "",
    password: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const u = Cookies.get("krishipal_user");
    if (u) {
      const parsed = JSON.parse(u);
      setForm((p) => ({
        ...p,
        fullName: parsed?.name || "",
        email: parsed?.email || "",
      }));
    }
  }, []);

  const onChange = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const token = Cookies.get("krishipal_token");

      const fd = new FormData();
      fd.append("fullName", form.fullName);
      fd.append("email", form.email);
      fd.append("countryCode", form.countryCode);
      fd.append("phone", form.phone);
      fd.append("address", form.address);

      if (form.password) fd.append("password", form.password);
      if (file) fd.append("profilePicture", file);

      const res = await fetch(`${API}/auth/${user.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: fd,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Update failed");

      alert("Profile updated ✅");
    } catch (e: any) {
      alert(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>

      <div className="max-w-xl space-y-4">
        <Input value={form.fullName} onChange={(e) => onChange("fullName", e.target.value)} placeholder="Full Name" />
        <Input value={form.email} onChange={(e) => onChange("email", e.target.value)} placeholder="Email" />
        <Input value={form.countryCode} onChange={(e) => onChange("countryCode", e.target.value)} placeholder="Country Code" />
        <Input value={form.phone} onChange={(e) => onChange("phone", e.target.value)} placeholder="Phone" />
        <Input value={form.address} onChange={(e) => onChange("address", e.target.value)} placeholder="Address" />
        <Input type="password" value={form.password} onChange={(e) => onChange("password", e.target.value)} placeholder="New Password (optional)" />

        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />

        <Button onClick={handleSubmit} disabled={loading} className="bg-green-600 hover:bg-green-700">
          {loading ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}
