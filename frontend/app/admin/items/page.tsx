"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/app/auth/components/ui/button";
import { Card, CardContent } from "@/app/auth/components/ui/card";

import {
  adminCreateProduct,
  adminListProducts,
  adminUpdateProduct,
  adminSoftDeleteProduct,
} from "@/lib/api/admin/product";

import { adminListCategories } from "@/lib/api/admin/category";


type Category = { _id: string; name: string; slug?: string };
type Product = {
  _id: string;
  name: string;
  sku: string;
  price: number;
  discountPrice?: number | null;
  stock: number;
  status: "active" | "draft";
  description?: string;
  images?: string[];
  category?: Category | string;
};

function catIdOf(p: Product) {
  if (!p.category) return "";
  if (typeof p.category === "string") return p.category;
  return p.category._id;
}

export default function AdminItemsPage() {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // create form
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [stock, setStock] = useState<number>(0);
  const [status, setStatus] = useState<"active" | "draft">("active");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);

  // edit form
  const [editingId, setEditingId] = useState<string | null>(null);
  const [eName, setEName] = useState("");
  const [eSku, setESku] = useState("");
  const [ePrice, setEPrice] = useState<number>(0);
  const [eStock, setEStock] = useState<number>(0);
  const [eStatus, setEStatus] = useState<"active" | "draft">("active");
  const [eCategoryId, setECategoryId] = useState("");
  const [eDescription, setEDescription] = useState("");
  const [eFiles, setEFiles] = useState<FileList | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [pRes, cRes] = await Promise.all([adminListProducts(), adminListCategories()]);
      setProducts(pRes?.data || []);
      setCategories(cRes?.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const create = async () => {
    if (!name.trim() || !sku.trim() || !categoryId) return;

    const fd = new FormData();
    fd.append("name", name.trim());
    fd.append("sku", sku.trim());
    fd.append("price", String(price || 0));
    fd.append("stock", String(stock || 0));
    fd.append("status", status);
    fd.append("categoryId", categoryId);
    fd.append("description", description || "");

    // images (field name must be "images")
    if (files) {
      Array.from(files).forEach((f) => fd.append("images", f));
    }

    setLoading(true);
    try {
      await adminCreateProduct(fd);
      // reset
      setName("");
      setSku("");
      setPrice(0);
      setStock(0);
      setStatus("active");
      setCategoryId("");
      setDescription("");
      setFiles(null);

      await fetchAll();
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (p: Product) => {
    setEditingId(p._id);
    setEName(p.name || "");
    setESku(p.sku || "");
    setEPrice(Number(p.price || 0));
    setEStock(Number(p.stock || 0));
    setEStatus(p.status || "active");
    setECategoryId(catIdOf(p));
    setEDescription(p.description || "");
    setEFiles(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEName("");
    setESku("");
    setEPrice(0);
    setEStock(0);
    setEStatus("active");
    setECategoryId("");
    setEDescription("");
    setEFiles(null);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    if (!eName.trim() || !eSku.trim() || !eCategoryId) return;

    const fd = new FormData();
    fd.append("name", eName.trim());
    fd.append("sku", eSku.trim());
    fd.append("price", String(ePrice || 0));
    fd.append("stock", String(eStock || 0));
    fd.append("status", eStatus);
    fd.append("categoryId", eCategoryId);
    fd.append("description", eDescription || "");

    // append new images if selected
    if (eFiles) {
      Array.from(eFiles).forEach((f) => fd.append("images", f));
    }

    setLoading(true);
    try {
      await adminUpdateProduct(editingId, fd);
      cancelEdit();
      await fetchAll();
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    setLoading(true);
    try {
      await adminSoftDeleteProduct(id);
      await fetchAll();
    } finally {
      setLoading(false);
    }
  };

  const rows = useMemo(() => products || [], [products]);

  return (
    <div className="p-6">
      <div className="mb-4">
        <h1 className="text-3xl font-bold">Products (Items)</h1>
        <p className="text-gray-500">Create, edit, and delete products here.</p>
      </div>

      {/* CREATE */}
      <Card className="mb-6">
        <CardContent className="p-6 space-y-4">
          <div className="grid md:grid-cols-2 gap-3">
            <input className="border rounded-lg px-4 py-3" placeholder="Product name" value={name} onChange={(e) => setName(e.target.value)} />
            <input className="border rounded-lg px-4 py-3" placeholder="SKU (unique)" value={sku} onChange={(e) => setSku(e.target.value)} />
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <input
              className="border rounded-lg px-4 py-3"
              placeholder="Price"
              type="number"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
            />
            <input
              className="border rounded-lg px-4 py-3"
              placeholder="Stock"
              type="number"
              value={stock}
              onChange={(e) => setStock(Number(e.target.value))}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <select className="border rounded-lg px-4 py-3" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select className="border rounded-lg px-4 py-3" value={status} onChange={(e) => setStatus(e.target.value as any)}>
              <option value="active">active</option>
              <option value="draft">draft</option>
            </select>
          </div>

          <textarea
            className="border rounded-lg px-4 py-3 w-full"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <input
              type="file"
              multiple
              onChange={(e) => setFiles(e.target.files)}
            />
            <Button className="bg-green-600 hover:bg-green-700 text-white md:w-[180px]" onClick={create} disabled={loading}>
              Create Product
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* LIST + EDIT INLINE */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left">
                  <th className="p-4 font-semibold">Name</th>
                  <th className="p-4 font-semibold">SKU</th>
                  <th className="p-4 font-semibold">Category</th>
                  <th className="p-4 font-semibold">Price</th>
                  <th className="p-4 font-semibold">Stock</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td className="p-6 text-gray-500" colSpan={7}>
                      {loading ? "Loading..." : "No products yet."}
                    </td>
                  </tr>
                )}

                {rows.map((p) => {
                  const isEdit = editingId === p._id;
                  const catName = typeof p.category === "string" ? "-" : p.category?.name || "-";

                  return (
                    <tr key={p._id} className="border-t align-top">
                      <td className="p-4">
                        {isEdit ? (
                          <input className="border rounded-md px-3 py-2 w-full" value={eName} onChange={(e) => setEName(e.target.value)} />
                        ) : (
                          <span className="font-medium">{p.name}</span>
                        )}
                      </td>

                      <td className="p-4">
                        {isEdit ? (
                          <input className="border rounded-md px-3 py-2 w-full" value={eSku} onChange={(e) => setESku(e.target.value)} />
                        ) : (
                          <span className="text-gray-700">{p.sku}</span>
                        )}
                      </td>

                      <td className="p-4">
                        {isEdit ? (
                          <select className="border rounded-md px-3 py-2 w-full" value={eCategoryId} onChange={(e) => setECategoryId(e.target.value)}>
                            <option value="">Select category</option>
                            {categories.map((c) => (
                              <option key={c._id} value={c._id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-gray-700">{catName}</span>
                        )}
                      </td>

                      <td className="p-4">
                        {isEdit ? (
                          <input className="border rounded-md px-3 py-2 w-full" type="number" value={ePrice} onChange={(e) => setEPrice(Number(e.target.value))} />
                        ) : (
                          <span>{Number(p.price || 0)}</span>
                        )}
                      </td>

                      <td className="p-4">
                        {isEdit ? (
                          <input className="border rounded-md px-3 py-2 w-full" type="number" value={eStock} onChange={(e) => setEStock(Number(e.target.value))} />
                        ) : (
                          <span>{Number(p.stock || 0)}</span>
                        )}
                      </td>

                      <td className="p-4">
                        {isEdit ? (
                          <select className="border rounded-md px-3 py-2 w-full" value={eStatus} onChange={(e) => setEStatus(e.target.value as any)}>
                            <option value="active">active</option>
                            <option value="draft">draft</option>
                          </select>
                        ) : (
                          <span>{p.status}</span>
                        )}
                      </td>

                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          {isEdit ? (
                            <>
                              <label className="text-xs text-gray-600 flex items-center gap-2 border rounded-md px-3 py-2 cursor-pointer">
                                <span>Add images</span>
                                <input type="file" multiple className="hidden" onChange={(e) => setEFiles(e.target.files)} />
                              </label>

                              <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={saveEdit} disabled={loading}>
                                Save
                              </Button>
                              <Button variant="outline" onClick={cancelEdit} disabled={loading}>
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button variant="outline" onClick={() => startEdit(p)} disabled={loading}>
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                className="border-red-500 text-red-600 hover:bg-red-50"
                                onClick={() => remove(p._id)}
                                disabled={loading}
                              >
                                Delete
                              </Button>
                            </>
                          )}
                        </div>

                        {isEdit && (
                          <div className="mt-2">
                            <textarea
                              className="border rounded-md px-3 py-2 w-full text-sm"
                              placeholder="Description"
                              value={eDescription}
                              onChange={(e) => setEDescription(e.target.value)}
                            />
                            {eFiles?.length ? (
                              <p className="text-xs text-gray-500 mt-1">{eFiles.length} image(s) selected</p>
                            ) : null}
                          </div>
                        )}
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
