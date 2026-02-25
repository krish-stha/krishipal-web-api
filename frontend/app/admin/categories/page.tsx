"use client";

import { useEffect, useMemo, useState } from "react";
import {
  adminCreateCategory,
  adminDeleteCategory,
  adminListCategories,
  adminUpdateCategory,
} from "@/lib/api/admin/category";
import { Button } from "@/app/auth/components/ui/button";
import { Card, CardContent } from "@/app/auth/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/app/auth/components/ui/confirm-dialog";
import { CheckCircle2 } from "lucide-react";

type Category = {
  _id: string;
  name: string;
  slug?: string;
  isActive?: boolean;
};

function normalizeList(res: any): Category[] {
  // supports: {data:{data:[...]}} or {data:[...]} or [...]
  const d = res?.data ?? res;
  return (d?.data ?? d) as Category[] || [];
}

export default function AdminCategoriesPage() {
  const { toast } = useToast();

  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // create
  const [newName, setNewName] = useState("");

  // edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editActive, setEditActive] = useState(true);

  // delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState<string>("");

  // ✅ success banner
  const [successMsg, setSuccessMsg] = useState<string>("");

  const fetchAll = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminListCategories();
      setItems(normalizeList(res) || []);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Failed to load categories";
      setError(msg);
      setItems([]);
      toast({ title: "Load failed", description: msg, variant: "destructive",duration:1000});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startEdit = (c: Category) => {
    setError("");
    setSuccessMsg("");
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
    if (!name) {
      toast({ title: "Name required", description: "Please enter category name", variant: "destructive" });
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      await adminCreateCategory({ name });
      setNewName("");
      await fetchAll();

      setSuccessMsg(`Category “${name}” added.`);
      toast({ title: "Added", description: `Category “${name}” created` });
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Create failed";
      setError(msg);
      toast({ title: "Add failed", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const saveEdit = async () => {
    if (!editingId) return;

    const name = editName.trim();
    if (!name) {
      toast({ title: "Name required", description: "Please enter category name", variant: "destructive" });
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      await adminUpdateCategory(editingId, { name, isActive: editActive });
      cancelEdit();
      await fetchAll();

      setSuccessMsg(`Category “${name}” saved.`);
      toast({ title: "Saved", description: `Category updated successfully` });
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Update failed";
      setError(msg);
      toast({ title: "Save failed", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const openDelete = (c: Category) => {
    setDeleteId(c._id);
    setDeleteName(c.name || "this category");
  };

  const remove = async () => {
    if (!deleteId) return;

    setLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      await adminDeleteCategory(deleteId);
      await fetchAll();

      setSuccessMsg(`Category “${deleteName}” deleted.`);
      toast({ title: "Deleted", description: `Category removed successfully` });
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Delete failed";
      setError(msg);
      toast({ title: "Delete failed", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
      setDeleteId(null);
      setDeleteName("");
    }
  };

  const rows = useMemo(() => items || [], [items]);

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Categories</h1>
        <p className="text-slate-600">Create, edit, and delete categories from here.</p>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 flex items-start gap-2">
          <CheckCircle2 className="h-4 w-4 mt-0.5" />
          <div className="flex-1">{successMsg}</div>
          <button className="text-green-800 font-semibold hover:underline" onClick={() => setSuccessMsg("")}>
            Dismiss
          </button>
        </div>
      )}

      {/* CREATE */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            <input
              className="w-full md:flex-1 h-11 rounded-xl border px-4 text-sm outline-none focus:ring-2 focus:ring-green-200"
              placeholder="New category name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") create();
              }}
              disabled={loading}
            />
            <Button
              className="bg-green-600 hover:bg-green-700 text-white md:w-[140px]"
              onClick={create}
              disabled={loading}
            >
              {loading ? "Please wait..." : "Add"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* LIST */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
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
                    <td className="p-6 text-slate-500" colSpan={4}>
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
                            className="w-full h-10 rounded-xl border px-3 text-sm outline-none focus:ring-2 focus:ring-green-200"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveEdit();
                              if (e.key === "Escape") cancelEdit();
                            }}
                            disabled={loading}
                          />
                        ) : (
                          <span className="font-semibold text-slate-900">{c.name}</span>
                        )}
                      </td>

                      <td className="p-4 text-slate-600">{c.slug || "-"}</td>

                      <td className="p-4">
                        {isEdit ? (
                          <label className="inline-flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={editActive}
                              onChange={(e) => setEditActive(e.target.checked)}
                              disabled={loading}
                            />
                            <span className="text-slate-700">{editActive ? "Active" : "Inactive"}</span>
                          </label>
                        ) : (
                          <span className={c.isActive === false ? "text-slate-500" : "text-green-700 font-semibold"}>
                            {c.isActive === false ? "Inactive" : "Active"}
                          </span>
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
                                onClick={() => openDelete(c)}
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

      {/* DELETE CONFIRM */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(v) => {
          if (!v) {
            setDeleteId(null);
            setDeleteName("");
          }
        }}
        title="Delete category?"
        description={`This will permanently delete “${deleteName || "this category"}”.`}
        confirmText={loading ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        destructive
        onConfirm={remove}
        loading={loading}
      />
    </div>
  );
}