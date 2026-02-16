"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Header } from "../../component/header";
import { Footer } from "../../component/footer";
import { Button } from "@/app/auth/components/ui/button";
import { Card } from "@/app/auth/components/ui/card";
import { listPublicProducts } from "@/lib/api/public/products";
import { useCart } from "@/lib/contexts/cart-context";
import { listPublicCategories } from "@/lib/api/public/category";
import { useAuth } from "@/lib/contexts/auth-contexts"; // ✅ NEW

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

function productImageUrl(filename?: string | null) {
  if (!filename) return "/images/placeholder.png";
  if (filename.startsWith("http://") || filename.startsWith("https://"))
    return filename;
  return `${BACKEND_URL}/public/product_images/${filename}`;
}

function money(n: any) {
  const v = Number(n ?? 0);
  return `Rs. ${Number.isFinite(v) ? v : 0}`;
}

type Category = {
  _id: string;
  name: string;
  slug: string;
};

export default function ShopPage() {
  const { add } = useCart();
  const { user } = useAuth(); // ✅ NEW

  // UI state
  const [loading, setLoading] = useState(false);
  const [catsLoading, setCatsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // data
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // filters
  const [search, setSearch] = useState("");
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>("");
  const [sort, setSort] = useState<"newest" | "price_asc" | "price_desc">(
    "newest"
  );
  const [onlyInStock, setOnlyInStock] = useState(false);

  // paging
  const [page, setPage] = useState(1);
  const limit = 12;

  // load categories (same)
  useEffect(() => {
    (async () => {
      setCatsLoading(true);
      try {
        const res = await listPublicCategories();
        setCategories(res.data || []);
      } catch {
        setCategories([]);
      } finally {
        setCatsLoading(false);
      }
    })();
  }, []);

  // fetch products (same)
  const fetchProducts = async (nextPage: number, mode: "replace" | "append") => {
    setLoading(true);
    setError("");
    try {
      const res = await listPublicProducts({
        page: nextPage,
        limit,
        sort,
        search: search.trim() ? search.trim() : undefined,
        categorySlug: selectedCategorySlug || undefined,
      });

      let data = res.data || [];
      if (onlyInStock) {
        data = data.filter((p: any) => Number(p.stock ?? 0) > 0);
      }

      setProducts((prev) => (mode === "append" ? [...prev, ...data] : data));
    } catch (e: any) {
      setError(e?.message || "Failed to load products");
      if (mode === "replace") setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // initial + whenever filters change (same)
  useEffect(() => {
    setPage(1);
    fetchProducts(1, "replace");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort, selectedCategorySlug, onlyInStock]);

  // search submit (same)
  const onSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    await fetchProducts(1, "replace");
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-1">
        {/* Header strip (professional marketplace style) */}
        <section className="bg-white border-b">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              {/* ✅ Updated: keep existing text, add quick actions (no logic changes) */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">Shop</h1>
                  <p className="text-slate-600 mt-1">
                    Find products by category, compare prices, and add to cart.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {user && (
                    <Link href="/user/dashboard/orders">
                      <Button
                        variant="outline"
                        className="border-slate-300 h-10 rounded-xl"
                      >
                        My Orders
                      </Button>
                    </Link>
                  )}

                  <Link href="/user/dashboard/cart">
                    <Button className="bg-green-600 hover:bg-green-700 text-white h-10 rounded-xl">
                      View Cart
                    </Button>
                  </Link>
                </div>
              </div>

              <form onSubmit={onSearch} className="w-full lg:w-[640px]">
                <div className="flex gap-2">
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search products (name / SKU)…"
                    className="flex-1 h-11 rounded-xl border bg-white px-4 outline-none focus:ring-2 focus:ring-green-200"
                  />
                  <Button className="h-11 bg-green-600 hover:bg-green-700 text-white px-6">
                    Search
                  </Button>
                </div>

                {/* toolbar line */}
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Sort</span>
                    <select
                      value={sort}
                      onChange={(e) => setSort(e.target.value as any)}
                      className="h-9 rounded-xl border bg-white px-3 text-sm outline-none"
                    >
                      <option value="newest">Newest</option>
                      <option value="price_asc">Price: Low → High</option>
                      <option value="price_desc">Price: High → Low</option>
                    </select>
                  </div>

                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={onlyInStock}
                      onChange={(e) => setOnlyInStock(e.target.checked)}
                      className="h-4 w-4"
                    />
                    In stock only
                  </label>

                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 border-slate-300"
                    onClick={() => {
                      setSearch("");
                      setSelectedCategorySlug("");
                      setOnlyInStock(false);
                      setSort("newest");
                      setPage(1);
                      fetchProducts(1, "replace");
                    }}
                  >
                    Reset
                  </Button>

                  <div className="ml-auto text-xs text-slate-500">
                    {loading ? "Loading…" : `${products.length} items`}
                  </div>
                </div>
              </form>
            </div>
          </div>
        </section>

        {/* Marketplace layout */}
        <section className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Sidebar */}
            <aside className="lg:col-span-3">
              <div className="sticky top-24">
                <Card className="rounded-2xl p-5">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-slate-900">Categories</div>
                    {catsLoading && (
                      <div className="text-xs text-slate-500">Loading…</div>
                    )}
                  </div>

                  <div className="mt-4 space-y-1">
                    <button
                      onClick={() => setSelectedCategorySlug("")}
                      className={`w-full text-left px-3 py-2 rounded-xl text-sm transition ${
                        selectedCategorySlug === ""
                          ? "bg-green-50 text-green-700 font-semibold"
                          : "hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      All Categories
                    </button>

                    <div className="max-h-[420px] overflow-auto pr-1 pt-1">
                      {!catsLoading && categories.length === 0 ? (
                        <div className="text-sm text-slate-500 px-3 py-3">
                          No categories available
                        </div>
                      ) : (
                        categories.map((c) => (
                          <button
                            key={c._id}
                            onClick={() => setSelectedCategorySlug(c.slug)}
                            className={`w-full text-left px-3 py-2 rounded-xl text-sm transition ${
                              selectedCategorySlug === c.slug
                                ? "bg-green-50 text-green-700 font-semibold"
                                : "hover:bg-slate-50 text-slate-700"
                            }`}
                          >
                            {c.name}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </Card>

                {/* Small help card */}
                <div className="mt-4 rounded-2xl border bg-white p-5">
                  <div className="text-sm font-semibold text-slate-900">
                    Tips
                  </div>
                  <ul className="mt-2 text-sm text-slate-600 space-y-1 list-disc pl-5">
                    <li>Use search for SKU / name</li>
                    <li>Sort by price to compare quickly</li>
                    <li>Toggle stock filter if needed</li>
                  </ul>
                </div>
              </div>
            </aside>

            {/* Main */}
            <div className="lg:col-span-9">
              {/* Heading line */}
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-slate-600">
                  {selectedCategorySlug ? (
                    <span>
                      Category:{" "}
                      <b className="text-slate-900">{selectedCategorySlug}</b>
                    </span>
                  ) : (
                    <span>Showing all products</span>
                  )}
                </div>
              </div>

              {error && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {products.map((p) => {
                  const firstImage = Array.isArray(p.images) ? p.images[0] : null;
                  const hasDiscount =
                    p.discountPrice !== null &&
                    p.discountPrice !== undefined &&
                    Number(p.discountPrice) < Number(p.price);

                  const displayPrice = hasDiscount ? p.discountPrice : p.price;
                  const inStock = Number(p.stock ?? 0) > 0;

                  return (
                    <div
                      key={p._id}
                      className="group rounded-2xl border bg-white overflow-hidden shadow-sm hover:shadow-md transition"
                    >
                      <Link
                        href={`/user/dashboard/shop/${p.slug}`}
                        className="block"
                      >
                        <div className="relative h-44 bg-slate-50 flex items-center justify-center overflow-hidden">
                          <img
                            src={productImageUrl(firstImage)}
                            alt={p.name}
                            className="h-full w-full object-contain group-hover:scale-[1.03] transition-transform"
                          />

                          {/* badges */}
                          <div className="absolute top-3 left-3 flex gap-2">
                            {hasDiscount && (
                              <span className="text-xs px-2 py-1 rounded-full bg-red-50 text-red-700 font-semibold">
                                Sale
                              </span>
                            )}
                            {!inStock && (
                              <span className="text-xs px-2 py-1 rounded-full bg-slate-200 text-slate-700 font-semibold">
                                Out
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="p-3">
                          <div className="text-[11px] text-slate-500 mb-1">
                            {p.category?.name || "Uncategorized"}
                          </div>

                          <div className="font-semibold text-slate-900 text-sm line-clamp-2 min-h-[40px]">
                            {p.name}
                          </div>

                          <div className="mt-2 flex items-center justify-between">
                            <div>
                              <div className="text-green-700 font-extrabold text-sm">
                                {money(displayPrice)}
                              </div>
                              {hasDiscount && (
                                <div className="text-[11px] text-slate-500 line-through">
                                  {money(p.price)}
                                </div>
                              )}
                            </div>

                            <div className="text-[11px] text-slate-500">
                              Stock: {Number(p.stock ?? 0)}
                            </div>
                          </div>
                        </div>
                      </Link>

                      <div className="p-3 pt-0 flex gap-2">
                        <Button
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => add(p._id, 1)}
                          disabled={!inStock}
                        >
                          {inStock ? "Add to cart" : "Out of stock"}
                        </Button>

                        <Link
                          href={`/user/dashboard/shop/${p.slug}`}
                          className="h-10 px-3 rounded-xl border border-slate-300 flex items-center justify-center text-sm hover:bg-slate-50"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  );
                })}

                {!loading && products.length === 0 && !error && (
                  <div className="col-span-2 md:col-span-3 xl:col-span-4 rounded-2xl border bg-white p-10 text-center text-slate-600">
                    No products found.
                  </div>
                )}
              </div>

              {/* Load more */}
              <div className="mt-8 flex justify-center">
                <Button
                  variant="outline"
                  className="border-slate-300"
                  disabled={loading}
                  onClick={async () => {
                    const next = page + 1;
                    setPage(next);
                    await fetchProducts(next, "append");
                  }}
                >
                  {loading ? "Loading..." : "Load more"}
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
