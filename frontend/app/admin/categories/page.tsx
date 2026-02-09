"use client";

import { useEffect, useMemo, useState } from "react";
import { adminCreateCategory, adminDeleteCategory, adminListCategories } from "@/lib/api/admin/category";

type Category = {
  _id: string;
  name: string;
  slug: string;
  parent?: string | null;
  isActive: boolean;
  createdAt?: string;
};

export default function AdminCategoriesPage() {
  const [items, setItems] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminListCategories();
      setItems(res?.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const parentOptions = useMemo(() => items, [items]);

  const onCreate = async () => {
    if (!name.trim()) return alert("Category name required");
    const parentId = null; // keep simple first; you can add dropdown later
    await adminCreateCategory({ name, parentId, isActive: true });
    setName("");
    await load();
  };

  const onDelete = async (id: string) => {
    const ok = confirm("Delete this category?");
    if (!ok) return;
    await adminDeleteCategory(id);
    await load();
  };

  return (
    <div>
      <div className="text-sm text-slate-500">Admin / Categories</div>
      <h1 className="mt-2 text-2xl font-semibold text-slate-900">Categories</h1>

      <div className="mt-6 rounded-2xl border bg-slate-50 p-4 flex gap-2">
        <input
          className="flex-1 rounded-xl border px-3 py-2 text-sm"
          placeholder="New category name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          onClick={onCreate}
          className="rounded-xl bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm"
        >
          Add
        </button>
      </div>

      <div className="mt-6 rounded-2xl border overflow-hidden">
        <div className="px-4 py-3 bg-white font-semibold">Category List</div>

        {loading ? (
          <div className="p-4 text-slate-500">Loading...</div>
        ) : items.length === 0 ? (
          <div className="p-4 text-slate-500">No categories yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Slug</th>
                <th className="text-left p-3">Active</th>
                <th className="text-right p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c._id} className="border-t">
                  <td className="p-3">{c.name}</td>
                  <td className="p-3 text-slate-500">{c.slug}</td>
                  <td className="p-3">{c.isActive ? "Yes" : "No"}</td>
                  <td className="p-3 text-right">
                    <button
                      className="text-red-600 hover:underline"
                      onClick={() => onDelete(c._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
