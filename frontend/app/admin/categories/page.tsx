"use client";

import { useEffect, useMemo, useState } from "react";
import { adminCreateCategory, adminDeleteCategory, adminListCategories, adminUpdateCategory } from "@/lib/api/admin/category";
import { Button } from "@/app/auth/components/ui/button";
import { Card, CardContent } from "@/app/auth/components/ui/card";

type Category = {
  _id: string;
  name: string;
  slug?: string;
  isActive?: boolean;
};

export default function AdminCategoriesPage() {
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  // create
  const [newName, setNewName] = useState("");

  // edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editActive, setEditActive] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await adminListCategories();
      // your api returns {success, data}
      setItems(res?.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const startEdit = (c: Category) => {
    setEditingId(c._id);
    setEditName(c.name || "");
    setEditActive(c.isActive !== false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditActive(true);
  };

  const create = async () => {
    const name = newName.trim();
    if (!name) return;
    setLoading(true);
    try {
      await adminCreateCategory({ name });
      setNewName("");
      await fetchAll();
    } finally {
      setLoading(false);
    }
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const name = editName.trim();
    if (!name) return;

    setLoading(true);
    try {
      await adminUpdateCategory(editingId, { name, isActive: editActive });
      cancelEdit();
      await fetchAll();
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    setLoading(true);
    try {
      await adminDeleteCategory(id);
      await fetchAll();
    } finally {
      setLoading(false);
    }
  };

  const rows = useMemo(() => items || [], [items]);

  return (
    <div className="p-6">
      <div className="mb-4">
        <h1 className="text-3xl font-bold">Categories</h1>
        <p className="text-gray-500">Create, edit, and delete categories from here.</p>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            <input
              className="w-full md:flex-1 border rounded-lg px-4 py-3 outline-none"
              placeholder="New category name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <Button
              className="bg-green-600 hover:bg-green-700 text-white md:w-[140px]"
              onClick={create}
              disabled={loading}
            >
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left">
                  <th className="p-4 font-semibold">Name</th>
                  <th className="p-4 font-semibold">Slug</th>
                  <th className="p-4 font-semibold">Active</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td className="p-6 text-gray-500" colSpan={4}>
                      {loading ? "Loading..." : "No categories yet."}
                    </td>
                  </tr>
                )}

                {rows.map((c) => {
                  const isEdit = editingId === c._id;

                  return (
                    <tr key={c._id} className="border-t">
                      <td className="p-4">
                        {isEdit ? (
                          <input
                            className="w-full border rounded-md px-3 py-2"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                          />
                        ) : (
                          <span className="font-medium">{c.name}</span>
                        )}
                      </td>

                      <td className="p-4 text-gray-600">{c.slug || "-"}</td>

                      <td className="p-4">
                        {isEdit ? (
                          <label className="inline-flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={editActive}
                              onChange={(e) => setEditActive(e.target.checked)}
                            />
                            <span>{editActive ? "Yes" : "No"}</span>
                          </label>
                        ) : (
                          <span>{c.isActive === false ? "No" : "Yes"}</span>
                        )}
                      </td>

                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          {isEdit ? (
                            <>
                              <Button
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={saveEdit}
                                disabled={loading}
                              >
                                Save
                              </Button>
                              <Button variant="outline" onClick={cancelEdit} disabled={loading}>
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button variant="outline" onClick={() => startEdit(c)} disabled={loading}>
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                className="border-red-500 text-red-600 hover:bg-red-50"
                                onClick={() => remove(c._id)}
                                disabled={loading}
                              >
                                Delete
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
