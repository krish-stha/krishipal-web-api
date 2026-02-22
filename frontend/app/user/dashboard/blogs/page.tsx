"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Header } from "@/app/user/component/header";
import { Footer } from "@/app/user/component/footer";
import { publicListBlogs } from "@/lib/api/public/blog";

type Blog = {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  coverImage?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export default function BlogsPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(9);
  const [search, setSearch] = useState("");

  const [rows, setRows] = useState<Blog[]>([]);
  const [meta, setMeta] = useState<{ total: number; page: number; limit: number } | null>(null);

  const fetchAll = async (p = page, l = limit) => {
    setLoading(true);
    setError("");
    try {
      const res = await publicListBlogs({ page: p, limit: l, search: search.trim() || undefined });

      const data = res?.data ?? res;
      const metaObj = res?.meta ?? data?.meta ?? null;

      setRows(data?.data ?? data ?? []);
      setMeta(metaObj ?? null);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to load blogs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll(1, limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalPages = useMemo(() => {
    const t = meta?.total ?? rows.length;
    return Math.max(1, Math.ceil(t / (meta?.limit ?? limit)));
  }, [meta, rows.length, limit]);

  const applySearch = async () => {
    setPage(1);
    await fetchAll(1, limit);
  };

  const goPrev = async () => {
    const p = Math.max(1, page - 1);
    setPage(p);
    await fetchAll(p, limit);
  };

  const goNext = async () => {
    const p = Math.min(totalPages, page + 1);
    setPage(p);
    await fetchAll(p, limit);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-b from-green-50 to-white border-b">
          <div className="container mx-auto px-4 py-12">
            <div className="max-w-2xl">
              <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900">
                Agriculture Blogs
              </h1>
              <p className="mt-3 text-slate-600">
                Practical farming tips, product guides, and local agriculture insights — written for Nepali farmers and students.
              </p>

              {/* Search */}
              <div className="mt-6 flex gap-2">
                <input
                  className="h-12 flex-1 rounded-2xl border px-4 text-sm outline-none focus:ring-2 focus:ring-green-200"
                  placeholder="Search articles..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") applySearch();
                  }}
                />
                <button
                  onClick={applySearch}
                  className="h-12 rounded-2xl bg-green-600 px-5 text-sm font-semibold text-white hover:bg-green-700"
                  disabled={loading}
                >
                  Search
                </button>
              </div>

              {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
            </div>
          </div>
        </section>

        {/* Grid */}
        <section className="container mx-auto px-4 py-10">
          {loading && rows.length === 0 ? (
            <div className="text-slate-500">Loading...</div>
          ) : rows.length === 0 ? (
            <div className="rounded-2xl border bg-slate-50 p-8 text-center text-slate-600">
              No blog posts yet.
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {rows.map((b) => (
                <Link
                  key={b._id}
                  href={`/blogs/${b.slug}`}
                  className="group rounded-3xl border bg-white overflow-hidden hover:shadow-lg transition"
                >
                  <div className="aspect-[16/9] bg-slate-100 overflow-hidden">
                    {/* If you serve images from backend: use NEXT_PUBLIC_BACKEND_URL + /public/... */}
                    {b.coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`${process.env.NEXT_PUBLIC_BACKEND_URL}/public/uploads/blogs/${b.coverImage}`}
                        alt={b.title}
                        className="h-full w-full object-cover group-hover:scale-[1.03] transition"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-slate-400 text-sm">
                        No cover
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <div className="text-xs text-slate-500">
                      {b.createdAt ? new Date(b.createdAt).toDateString() : ""}
                    </div>
                    <div className="mt-1 text-lg font-bold text-slate-900 group-hover:text-green-700 transition">
                      {b.title}
                    </div>
                    <p className="mt-2 text-sm text-slate-600 line-clamp-3">
                      {b.excerpt || ""}
                    </p>
                    <div className="mt-4 text-sm font-semibold text-green-700">
                      Read more →
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          <div className="mt-10 flex items-center justify-between">
            <div className="text-sm text-slate-600">
              Page <span className="font-semibold">{page}</span> / <span className="font-semibold">{totalPages}</span>
              {meta?.total != null ? <span className="ml-2 text-slate-400">(Total: {meta.total})</span> : null}
            </div>

            <div className="flex gap-2">
              <button
                className="h-10 rounded-xl border px-4 text-sm disabled:opacity-50"
                onClick={goPrev}
                disabled={loading || page <= 1}
              >
                Prev
              </button>
              <button
                className="h-10 rounded-xl border px-4 text-sm disabled:opacity-50"
                onClick={goNext}
                disabled={loading || page >= totalPages}
              >
                Next
              </button>

              <select
                className="h-10 rounded-xl border px-3 text-sm"
                value={limit}
                onChange={async (e) => {
                  const l = Number(e.target.value);
                  setLimit(l);
                  setPage(1);
                  await fetchAll(1, l);
                }}
              >
                <option value={6}>6 / page</option>
                <option value={9}>9 / page</option>
                <option value={12}>12 / page</option>
              </select>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}