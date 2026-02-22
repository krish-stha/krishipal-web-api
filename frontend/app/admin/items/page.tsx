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

type PageMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

function catIdOf(p: Product) {
  if (!p.category) return "";
  if (typeof p.category === "string") return p.category;
  return p.category._id;
}

function catNameOf(p: Product) {
  if (!p.category) return "-";
  if (typeof p.category === "string") return "-";
  return p.category.name || "-";
}

function normalizeSku(s: string) {
  return s.trim().toUpperCase();
}

export default function AdminItemsPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [products, setProducts] = useState<Product[]>([]);
  const [meta, setMeta] = useState<PageMeta>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const [categories, setCategories] = useState<Category[]>([]);

  // list controls
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");

  // create form (use strings for numbers so you can backspace)
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [priceStr, setPriceStr] = useState("");
  const [stockStr, setStockStr] = useState("");
  const [status, setStatus] = useState<"active" | "draft">("active");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);

  // edit form
  const [editingId, setEditingId] = useState<string | null>(null);
  const [eName, setEName] = useState("");
  const [eSku, setESku] = useState("");
  const [ePriceStr, setEPriceStr] = useState("");
  const [eStockStr, setEStockStr] = useState("");
  const [eStatus, setEStatus] = useState<"active" | "draft">("active");
  const [eCategoryId, setECategoryId] = useState("");
  const [eDescription, setEDescription] = useState("");
  const [eFiles, setEFiles] = useState<FileList | null>(null);

  const fetchAll = async (p = page, l = limit, s = search) => {
    setLoading(true);
    setError("");
    try {
      const [pRes, cRes] = await Promise.all([
        adminListProducts({ page: p, limit: l, search: s.trim() || undefined }),
        adminListCategories(),
      ]);

      // support both shapes:
      // 1) {success,data,meta}
      // 2) {success,data} (no meta) -> fallback
      const data = pRes?.data ?? [];
      const m = pRes?.meta;

      setProducts(Array.isArray(data) ? data : []);
      setMeta(
        m ?? {
          total: Array.isArray(data) ? data.length : 0,
          page: p,
          limit: l,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: p > 1,
        }
      );

      setCategories(cRes?.data ?? []);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Network Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll(page, limit, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  const onSearch = async () => {
    setPage(1);
    await fetchAll(1, limit, search);
  };

  const create = async () => {
    const n = name.trim();
    const s = normalizeSku(sku);
    if (!n) return setError("Product name is required");
    if (!s) return setError("SKU is required");
    if (!categoryId) return setError("Category is required");

    const price = priceStr.trim() === "" ? 0 : Number(priceStr);
    const stock = stockStr.trim() === "" ? 0 : Number(stockStr);

    if (!Number.isFinite(price) || price < 0) return setError("Price must be 0 or more");
    if (!Number.isFinite(stock) || stock < 0) return setError("Stock must be 0 or more");

    const fd = new FormData();
    fd.append("name", n);
    fd.append("sku", s);
    fd.append("price", String(price));
    fd.append("stock", String(stock));
    fd.append("status", status);
    fd.append("categoryId", categoryId);
    fd.append("description", description || "");

    if (files) Array.from(files).forEach((f) => fd.append("images", f));

    setLoading(true);
    setError("");
    try {
      await adminCreateProduct(fd);

      // reset
      setName("");
      setSku("");
      setPriceStr("");
      setStockStr("");
      setStatus("active");
      setCategoryId("");
      setDescription("");
      setFiles(null);

      await fetchAll(page, limit, search);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Create failed");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (p: Product) => {
    setEditingId(p._id);
    setEName(p.name || "");
    setESku(p.sku || "");
    setEPriceStr(String(p.price ?? ""));
    setEStockStr(String(p.stock ?? ""));
    setEStatus(p.status || "active");
    setECategoryId(catIdOf(p));
    setEDescription(p.description || "");
    setEFiles(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEName("");
    setESku("");
    setEPriceStr("");
    setEStockStr("");
    setEStatus("active");
    setECategoryId("");
    setEDescription("");
    setEFiles(null);
  };

  const saveEdit = async () => {
    if (!editingId) return;

    const n = eName.trim();
    const s = normalizeSku(eSku);
    if (!n) return setError("Product name is required");
    if (!s) return setError("SKU is required");
    if (!eCategoryId) return setError("Category is required");

    const price = ePriceStr.trim() === "" ? 0 : Number(ePriceStr);
    const stock = eStockStr.trim() === "" ? 0 : Number(eStockStr);

    if (!Number.isFinite(price) || price < 0) return setError("Price must be 0 or more");
    if (!Number.isFinite(stock) || stock < 0) return setError("Stock must be 0 or more");

    const fd = new FormData();
    fd.append("name", n);
    fd.append("sku", s);
    fd.append("price", String(price));
    fd.append("stock", String(stock));
    fd.append("status", eStatus);
    fd.append("categoryId", eCategoryId);
    fd.append("description", eDescription || "");

    if (eFiles) Array.from(eFiles).forEach((f) => fd.append("images", f));

    setLoading(true);
    setError("");
    try {
      await adminUpdateProduct(editingId, fd);
      cancelEdit();
      await fetchAll(page, limit, search);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    setLoading(true);
    setError("");
    try {
      await adminSoftDeleteProduct(id);
      await fetchAll(page, limit, search);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Delete failed");
    } finally {
      setLoading(false);
    }
  };

  const rows = useMemo(() => products || [], [products]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Products</h1>
        <p className="text-gray-500">Create, edit, and manage items in your store.</p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* CREATE */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Product name</label>
              <input
                className="mt-1 border rounded-lg px-4 py-3 w-full"
                placeholder="e.g. Urea Fertilizer 50kg"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium">SKU</label>
              <input
                className="mt-1 border rounded-lg px-4 py-3 w-full"
                placeholder="e.g. UREA-50KG"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">Must be unique. Auto uppercased on save.</p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium">Price (Rs.)</label>
              <input
                className="mt-1 border rounded-lg px-4 py-3 w-full"
                placeholder="e.g. 1200"
                inputMode="numeric"
                value={priceStr}
                onChange={(e) => setPriceStr(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Initial stock</label>
              <input
                className="mt-1 border rounded-lg px-4 py-3 w-full"
                placeholder="e.g. 50"
                inputMode="numeric"
                value={stockStr}
                onChange={(e) => setStockStr(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">Leave blank to default to 0.</p>
            </div>

            <div>
              <label className="text-sm font-medium">Status</label>
              <select className="mt-1 border rounded-lg px-4 py-3 w-full" value={status} onChange={(e) => setStatus(e.target.value as any)}>
                <option value="active">Active (visible)</option>
                <option value="draft">Draft (hidden)</option>
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Category</label>
              <select className="mt-1 border rounded-lg px-4 py-3 w-full" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Images</label>
              <input className="mt-1" type="file" multiple onChange={(e) => setFiles(e.target.files)} />
              {files?.length ? <p className="text-xs text-gray-500 mt-1">{files.length} image(s) selected</p> : null}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Description</label>
            <textarea
              className="mt-1 border rounded-lg px-4 py-3 w-full"
              placeholder="Short description shown on product page"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <Button className="bg-green-600 hover:bg-green-700 text-white md:w-[180px]" onClick={create} disabled={loading}>
            {loading ? "Creating..." : "Create Product"}
          </Button>
        </CardContent>
      </Card>

      {/* LIST CONTROLS */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row md:items-center gap-3 justify-between">
          <div className="flex gap-2 items-center w-full md:w-auto">
            <input
              className="border rounded-lg px-3 py-2 w-full md:w-[320px]"
              placeholder="Search by name or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSearch();
              }}
            />
            <Button variant="outline" onClick={onSearch} disabled={loading}>
              Search
            </Button>
          </div>

          <div className="flex gap-2 items-center">
            <span className="text-sm text-gray-600">Rows:</span>
            <select
              className="border rounded-lg px-3 py-2"
              value={limit}
              onChange={(e) => {
                setPage(1);
                setLimit(Number(e.target.value));
              }}
            >
              {[5, 10, 20, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>

            <div className="ml-2 text-sm text-gray-600">
              {meta.total ? `Total: ${meta.total}` : null}
            </div>
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
                      {loading ? "Loading..." : "No products found."}
                    </td>
                  </tr>
                )}

                {rows.map((p) => {
                  const isEdit = editingId === p._id;

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
                          <span className="text-gray-700">{catNameOf(p)}</span>
                        )}
                      </td>

                      <td className="p-4">
                        {isEdit ? (
                          <input
                            className="border rounded-md px-3 py-2 w-full"
                            inputMode="numeric"
                            value={ePriceStr}
                            onChange={(e) => setEPriceStr(e.target.value)}
                          />
                        ) : (
                          <span>Rs. {Number(p.price || 0)}</span>
                        )}
                      </td>

                      <td className="p-4">
                        {isEdit ? (
                          <input
                            className="border rounded-md px-3 py-2 w-full"
                            inputMode="numeric"
                            value={eStockStr}
                            onChange={(e) => setEStockStr(e.target.value)}
                          />
                        ) : (
                          <span className={p.stock <= 5 ? "font-semibold text-red-600" : ""}>{Number(p.stock || 0)}</span>
                        )}
                      </td>

                      <td className="p-4">
                        {isEdit ? (
                          <select className="border rounded-md px-3 py-2 w-full" value={eStatus} onChange={(e) => setEStatus(e.target.value as any)}>
                            <option value="active">Active</option>
                            <option value="draft">Draft</option>
                          </select>
                        ) : (
                          <span className={p.status === "active" ? "text-green-700" : "text-gray-600"}>{p.status}</span>
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
                            {eFiles?.length ? <p className="text-xs text-gray-500 mt-1">{eFiles.length} image(s) selected</p> : null}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination footer */}
          <div className="flex items-center justify-between p-4 border-t">
            <div className="text-sm text-gray-600">
              Page {meta.page} / {meta.totalPages}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={loading || !meta.hasPrevPage}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </Button>
              <Button
                variant="outline"
                disabled={loading || !meta.hasNextPage}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}