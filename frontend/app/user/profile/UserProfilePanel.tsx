"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useAuth } from "@/lib/contexts/auth-contexts";
import { Input } from "@/app/auth/components/ui/input";
import { Button } from "@/app/auth/components/ui/button";
import { api } from "@/lib/api/axios";
import { endpoints } from "@/lib/api/endpoints";

export default function UserProfilePanel() {
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

  const onChange = (k: string, v: string) =>
    setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v) fd.append(k, v);
      });
      if (file) fd.append("profilePicture", file);

      const res = await api.put(endpoints.auth.update(user.id), fd);

      // ✅ update cookie name/email if changed
      const current = Cookies.get("krishipal_user");
      if (current) {
        const parsed = JSON.parse(current);
        Cookies.set(
          "krishipal_user",
          JSON.stringify({
            ...parsed,
            name: form.fullName || parsed.name,
            email: form.email || parsed.email,
          }),
          { path: "/" }
        );
      }

      alert("Profile updated ✅");
    } catch (e: any) {
      alert(e?.response?.data?.message || e.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Input value={form.fullName} onChange={(e) => onChange("fullName", e.target.value)} placeholder="Full Name" />
      <Input value={form.email} onChange={(e) => onChange("email", e.target.value)} placeholder="Email" />
      <Input value={form.countryCode} onChange={(e) => onChange("countryCode", e.target.value)} placeholder="Country Code" />
      <Input value={form.phone} onChange={(e) => onChange("phone", e.target.value)} placeholder="Phone" />
      <Input value={form.address} onChange={(e) => onChange("address", e.target.value)} placeholder="Address" />
      <Input type="password" value={form.password} onChange={(e) => onChange("password", e.target.value)} placeholder="New Password (optional)" />

      <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />

      <Button onClick={handleSubmit} disabled={loading} className="bg-green-600 hover:bg-green-700 w-full">
        {loading ? "Saving..." : "Save"}
      </Button>
    </div>
  );
}
