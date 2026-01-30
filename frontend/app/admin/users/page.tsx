"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/app/auth/components/ui/button";
import { adminListUsers } from "@/lib/api/admin/user";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await adminListUsers();
        if (!mounted) return;

        setUsers(res?.data || []);
      } catch (e: any) {
        if (!mounted) return;

        const msg =
          e?.response?.data?.message ||
          e?.message ||
          "Failed to load users";
        setError(msg);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Admin Users</h1>

        <Link href="/admin/users/create">
          <Button className="bg-green-600 hover:bg-green-700">
            + Create User
          </Button>
        </Link>
      </div>

      {loading && <p>Loading...</p>}

      {!loading && error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-4">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="overflow-x-auto bg-white rounded-xl shadow">
          <table className="w-full text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Role</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>

            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-t">
                  <td className="p-3">{u.fullName}</td>
                  <td className="p-3">{u.email}</td>
                  <td className="p-3">{u.role}</td>
                  <td className="p-3 flex gap-3">
                    <Link
                      href={`/admin/users/${u._id}`}
                      className="text-blue-600"
                    >
                      View
                    </Link>
                    <Link
                      href={`/admin/users/${u._id}/edit`}
                      className="text-green-700"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}

              {!users.length && (
                <tr>
                  <td colSpan={4} className="p-3 text-gray-500">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
