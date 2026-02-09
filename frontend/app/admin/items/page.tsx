"use client";

import { useEffect, useState } from "react";
import { adminListCategories } from "@/lib/api/admin/category";
import { adminCreateProduct, adminListProducts, adminSoftDeleteProduct } from "@/lib/api/admin/product";

type Category = { _id: string; name: string; slug: string };
type Product = {
  _id: string;
  name: string;
  sku: string;
  slug: string;
  price: number;
  stock: number;
  status: "active" | "draft";
  images: string[];
  category?: { name: string; slug: string } | null;
};

export default function AdminItemsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    sku: "",
    price: "",
    stock: "0",
    categoryId: "",
    status: "active",
    description: "",
  });

  const [images, setImages] = useState<File[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const catRes = await adminListCategories();
      setCategories(catRes?.data || []);

      const prodRes = await adminListProducts();
      setProducts(prodRes?.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onCreate = async () => {
    if (!form.name || !form.sku || !form.price || !form.categoryId) {
      return alert("name, sku, price, category required");
    }

    const fd = new FormData();
    fd.append("name", form.name);
    fd.append("sku", form.sku);
    fd.append("price", form.price);
    fd.append("stock", form.stock);
    fd.append("categoryId", form.categoryId);
    fd.append("status", form.status);
    fd.append("description", form.description);

    // fieldname MUST be "images"
    images.forEach((f) => fd.append("images", f));

    await adminCreateProduct(fd);

    setForm({ name: "", sku: "", price: "", stock: "0", categoryId: "", status: "active", description: "" });
    setImages([]);
    await load();
  };

  const onDelete = async (id: string) => {
    const ok = confirm("Delete this product?");
    if (!ok) return;
    await adminSoftDeleteProduct(id);
    await load();
  };

  return (
    <div>
      <div className="text-sm text-slate-500">Admin / Items</div>
      <h1 className="mt-2 text-2xl font-semibold text-slate-900">Products (Items)</h1>

      <div className="mt-6 rounded-2xl border bg-slate-50 p-4 space-y-3">
        <div className="grid md:grid-cols-2 gap-3">
          <input
            className="rounded-xl border px-3 py-2 text-sm"
            placeholder="Product name"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          />
          <input
            className="rounded-xl border px-3 py-2 text-sm"
            placeholder="SKU (unique)"
            value={form.sku}
            onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))}
          />
          <input
            className="rounded-xl border px-3 py-2 text-sm"
            placeholder="Price"
            value={form.price}
            onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
          />
          <input
            className="rounded-xl border px-3 py-2 text-sm"
            placeholder="Stock"
            value={form.stock}
            onChange={(e) => setForm((p) => ({ ...p, stock: e.target.value }))}
          />

          <select
            className="rounded-xl border px-3 py-2 text-sm"
            value={form.categoryId}
            onChange={(e) => setForm((p) => ({ ...p, categoryId: e.target.value }))}
          >
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>

          <select
            className="rounded-xl border px-3 py-2 text-sm"
            value={form.status}
            onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
          >
            <option value="active">active</option>
            <option value="draft">draft</option>
          </select>
        </div>

        <textarea
          className="w-full rounded-xl border px-3 py-2 text-sm"
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
        />

        <div className="flex items-center gap-3">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => setImages(Array.from(e.target.files || []))}
          />
          <button
            onClick={onCreate}
            className="rounded-xl bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm"
          >
            Create Product
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border overflow-hidden">
        <div className="px-4 py-3 bg-white font-semibold">Product List</div>

        {loading ? (
          <div className="p-4 text-slate-500">Loading...</div>
        ) : products.length === 0 ? (
          <div className="p-4 text-slate-500">No products yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">SKU</th>
                <th className="text-left p-3">Category</th>
                <th className="text-left p-3">Price</th>
                <th className="text-left p-3">Stock</th>
                <th className="text-left p-3">Status</th>
                <th className="text-right p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p._id} className="border-t">
                  <td className="p-3">{p.name}</td>
                  <td className="p-3 text-slate-500">{p.sku}</td>
                  <td className="p-3">{p.category?.name || "-"}</td>
                  <td className="p-3">{p.price}</td>
                  <td className="p-3">{p.stock}</td>
                  <td className="p-3">{p.status}</td>
                  <td className="p-3 text-right">
                    <button className="text-red-600 hover:underline" onClick={() => onDelete(p._id)}>
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
