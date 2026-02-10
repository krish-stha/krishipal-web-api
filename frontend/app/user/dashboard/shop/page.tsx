"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Header } from "../../component/header";
import { Card, CardContent } from "@/app/auth/components/ui/card";
import { Button } from "@/app/auth/components/ui/button";
import { Footer } from "../../component/footer";
import { listPublicProducts } from "@/lib/api/public/products";
import { useCart } from "@/lib/contexts/cart-context";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

function productImageUrl(filename?: string | null) {
  if (!filename) return "/images/placeholder.png";
  if (filename.startsWith("http://") || filename.startsWith("https://")) return filename;
  // backend stores at /public/product_images/<file>
  return `${BACKEND_URL}/public/product_images/${filename}`;
}

export default function ShopPage() {
  const { add } = useCart();

  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [error, setError] = useState<string>("");

  // keep your category cards UI (placeholder) – later we can connect real categories API
  const categories = [
    { id: 1, name: "Seeds", icon: "🌱", image: "/images/assorted-seeds.png" },
    { id: 2, name: "Fertilizers", icon: "🧪", image: "/images/fertilizers-variety.png" },
    { id: 3, name: "Tools", icon: "🔧", image: "/images/tool.png" },
    { id: 4, name: "Pesticides", icon: "🛡️", image: "/images/pesticide-application.png" },
    { id: 5, name: "Irrigation", icon: "💧", image: "/images/agricultural-irrigation.png" },
    { id: 6, name: "Equipment", icon: "🚜", image: "/images/vintage-farm-equipment.png" },
  ];

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await listPublicProducts({ page: 1, limit: 12, sort: "newest" });
        setProducts(res.data || []);
      } catch (e: any) {
        setError(e?.message || "Failed to load products");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const featured = useMemo(() => products.slice(0, 2), [products]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <section className="py-12">
          <div className="container mx-auto px-4">
            {/* Featured Products */}
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              {featured.map((p, idx) => {
                const price =
                  p.discountPrice !== null && p.discountPrice !== undefined ? p.discountPrice : p.price;

                const bg = idx === 0 ? "bg-gray-100" : "bg-blue-100";
                const firstImage = Array.isArray(p.images) ? p.images[0] : null;

                return (
                  <Card key={p._id} className={`overflow-hidden ${bg}`}>
                    <CardContent className="p-8">
                      <div className="flex items-center justify-between gap-6">
                        <div className="min-w-0">
                          <p className="text-sm text-gray-600 mb-2">
                            {p.category?.name ? p.category.name : "Featured"}
                          </p>
                          <h2 className="text-3xl md:text-4xl font-bold mb-4 truncate">{p.name}</h2>

                          <p className="text-gray-600 mb-2">Starting At</p>
                          <p className="text-3xl font-bold text-red-600 mb-6">Rs. {price}</p>

                          <div className="flex gap-3">
                            <Button
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => add(p._id, 1)}
                              disabled={Number(p.stock ?? 0) <= 0}
                            >
                              {Number(p.stock ?? 0) <= 0 ? "Out of stock" : "Add to cart"}
                            </Button>
                          </div>
                        </div>

                        <div className="relative w-52 h-52 md:w-64 md:h-64 shrink-0">
                          <img
                            src={productImageUrl(firstImage)}
                            alt={p.name}
                            className="h-full w-full object-contain"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {/* If no products exist */}
              {!loading && featured.length === 0 && (
                <div className="col-span-2 rounded-2xl border bg-slate-50 p-10 text-center text-slate-600">
                  No products available. Add products from Admin first.
                </div>
              )}
            </div>

            {/* View All Products (simple list below) */}
            <div className="bg-yellow-50 rounded-2xl p-8 md:p-12 text-center mb-12">
              <Button
                className="bg-green-600 hover:bg-green-700 text-white px-12 py-6 text-lg"
                onClick={() => {
                  // scroll to products grid below
                  const el = document.getElementById("all-products");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                View All Products →
              </Button>
            </div>

            {/* Categories (still UI placeholders) */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold mb-6">Categories</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                {categories.map((category) => (
                  <div key={category.id} className="group cursor-pointer">
                    <div className="relative aspect-square bg-white/30 backdrop-blur-sm border-2 border-green-200 rounded-lg p-6 flex items-center justify-center hover:border-green-500 hover:bg-green-50/50 transition-all duration-300 shadow-sm hover:shadow-md">
                      <div className="relative w-full h-full">
                        <Image
                          src={category.image || "/placeholder.svg"}
                          alt={category.name}
                          fill
                          className="object-contain group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                    </div>
                    <p className="text-center mt-3 font-medium text-gray-700 group-hover:text-green-600 transition-colors">
                      {category.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* All products grid */}
            <div id="all-products" className="mb-12">
              <h2 className="text-3xl font-bold mb-6">All Products</h2>

              {error && <p className="text-red-600 mb-4">{error}</p>}
              {loading && <p className="text-gray-500 mb-4">Loading products...</p>}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.map((p) => {
                  const firstImage = Array.isArray(p.images) ? p.images[0] : null;
                  const price =
                    p.discountPrice !== null && p.discountPrice !== undefined ? p.discountPrice : p.price;

                  return (
                    <div key={p._id} className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                      <div className="h-44 bg-slate-50 flex items-center justify-center">
                        <img
                          src={productImageUrl(firstImage)}
                          alt={p.name}
                          className="h-40 w-full object-contain"
                        />
                      </div>

                      <div className="p-4">
                        <div className="text-xs text-slate-500 mb-1">
                          {p.category?.name || "Uncategorized"}
                        </div>
                        <div className="font-semibold text-slate-900 line-clamp-1">{p.name}</div>

                        <div className="mt-2 flex items-center justify-between">
                          <div className="text-green-700 font-bold">Rs. {price}</div>
                          <div className="text-xs text-slate-500">Stock: {p.stock ?? 0}</div>
                        </div>

                        <Button
                          className="mt-3 w-full bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => add(p._id, 1)}
                          disabled={Number(p.stock ?? 0) <= 0}
                        >
                          {Number(p.stock ?? 0) <= 0 ? "Out of stock" : "Add to cart"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Keep your “Latest Blogs” + Features exactly as before */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold mb-4">Latest Blogs</h2>
              <p className="text-gray-600 mb-6">
                Present posts in a best way to highlight interesting moments of your blog.
              </p>
              <p className="text-gray-600 mb-6">
                Stay informed and connected with the latest trends and developments in agriculture through our dedicated
                blog section.
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="font-semibold">Free Shipping</h3>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold">Best Price</h3>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold">Free Curbside Pickup</h3>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold">24/7 Support</h3>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
