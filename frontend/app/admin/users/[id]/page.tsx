"use client";

import { useParams } from "next/navigation";

export default function AdminUserDetailPage() {
  const params = useParams();
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold">User Detail</h1>
      <p className="mt-4">ID: {params.id as string}</p>
    </div>
  );
}
