"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { adminGetUserById } from "@/lib/api/admin/user";

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
      <div className="min-h-screen p-8">
        <h1 className="text-2xl font-bold">User Detail</h1>
        <p className="mt-4">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold">User Detail</h1>
      <div className="mt-4 bg-white shadow rounded-xl p-6 max-w-xl space-y-2">
        <p><b>ID:</b> {user._id}</p>
        <p><b>Name:</b> {user.fullName}</p>
        <p><b>Email:</b> {user.email}</p>
        <p><b>Role:</b> {user.role}</p>
      </div>
    </div>
  );
}
