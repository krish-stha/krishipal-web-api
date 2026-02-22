"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/app/auth/components/ui/button";
import { Card, CardContent } from "@/app/auth/components/ui/card";
import {
  adminCreateBlog,
  adminDeleteBlog,
  adminListBlogs,
  adminUpdateBlog,
  AdminBlogStatus,
} from "@/lib/api/admin/blog";

type Blog = {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  cover?: string | null;
  status: AdminBlogStatus;
  createdAt?: string;
  updatedAt?: string;
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function StatusBadge({ status }: { status: AdminBlogStatus }) {
  const base = "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border";
  if (status === "published") return <span className={`${base} bg-green-50 text-green-700 border-green-200`}>Published</span>;
  return <span className={`${base} bg-slate-50 text-slate-700 border-slate-200`}>Draft</span>;
}

export default function AdminBlogsPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // pagination + filters
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | AdminBlogStatus>("all");

  const [rows, setRows] = useState<Blog[]>([]);
  const [meta, setMeta] = useState<{ total: number; page: number; limit: number } | null>(null);

  // create form (strings so you can backspace)
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<AdminBlogStatus>("draft");
  const [cover, setCover] = useState<File | null>(null);

  // edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [eTitle, setETitle] = useState("");
  const [eSlug, setESlug] = useState("");
  const [eExcerpt, setEExcerpt] = useState("");
  const [eContent, setEContent] = useState("");
  const [eStatus, setEStatus] = useState<AdminBlogStatus>("draft");
  const [eCover, setECover] = useState<File | null>(null);

  const fetchAll = async (p = page, l = limit) => {
    setLoading(true);
    setError("");
    try {
      const res = await adminListBlogs({
        page: p,
        limit: l,
        search: search.trim() || undefined,
        status: statusFilter,
      });

      // support both shapes:
      // {success:true,data,meta} OR {data,meta}
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

  const onCreate = async () => {
    if (!title.trim()) return setError("Title is required");
    if (!slug.trim()) return setError("Slug is required");
    if (!excerpt.trim()) return setError("Excerpt is required");
    if (!content.trim()) return setError("Content is required");

    const fd = new FormData();
    fd.append("title", title.trim());
    fd.append("slug", slug.trim());
    fd.append("excerpt", excerpt.trim());
    fd.append("content", content.trim());
    fd.append("status", status);
    if (cover) fd.append("cover", cover);

    setLoading(true);
    setError("");
    try {
      await adminCreateBlog(fd);
      setTitle("");
      setSlug("");
      setExcerpt("");
      setContent("");
      setStatus("draft");
      setCover(null);
      await fetchAll(1, limit);
      setPage(1);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Create failed");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (b: Blog) => {
    setEditingId(b._id);
    setETitle(b.title || "");
    setESlug(b.slug || "");
    setEExcerpt(b.excerpt || "");
    setEContent(b.content || "");
    setEStatus(b.status || "draft");
    setECover(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setETitle("");
    setESlug("");
    setEExcerpt("");
    setEContent("");
    setEStatus("draft");
    setECover(null);
  };

  const onSaveEdit = async () => {
    if (!editingId) return;
    if (!eTitle.trim()) return setError("Title is required");
    if (!eSlug.trim()) return setError("Slug is required");
    if (!eExcerpt.trim()) return setError("Excerpt is required");
    if (!eContent.trim()) return setError("Content is required");

    const fd = new FormData();
    fd.append("title", eTitle.trim());
    fd.append("slug", eSlug.trim());
    fd.append("excerpt", eExcerpt.trim());
    fd.append("content", eContent.trim());
    fd.append("status", eStatus);
    if (eCover) fd.append("cover", eCover);

    setLoading(true);
    setError("");
    try {
      await adminUpdateBlog(editingId, fd);
      cancelEdit();
      await fetchAll(page, limit);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm("Delete this blog post?")) return;
    setLoading(true);
    setError("");
    try {
      await adminDeleteBlog(id);
      // if last item on page deleted, go back a page
      const nextPage = page > 1 && rows.length === 1 ? page - 1 : page;
      setPage(nextPage);
      await fetchAll(nextPage, limit);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Delete failed");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = async () => {
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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Blogs</h1>
          <p className="text-sm text-slate-600">Create and publish agriculture content for users.</p>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* CREATE */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-slate-900">Create new post</div>
            <div className="text-xs text-slate-500">Tip: keep excerpt short for best preview.</div>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600">Title</label>
              <input
                className="mt-1 w-full h-11 rounded-xl border px-4 text-sm"
                placeholder="e.g. 7 Tips for Better Tomato Farming"
                value={title}
                onChange={(e) => {
                  const v = e.target.value;
                  setTitle(v);
                  // auto-suggest slug only if slug empty or equals old slugify(title)
                  setSlug((prev) => (prev.trim() ? prev : slugify(v)));
                }}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600">Slug</label>
              <input
                className="mt-1 w-full h-11 rounded-xl border px-4 text-sm"
                placeholder="e.g. tomato-farming-tips"
                value={slug}
                onChange={(e) => setSlug(slugify(e.target.value))}
              />
              <p className="mt-1 text-[11px] text-slate-500">Used in URL: /blogs/{slug || "your-slug"}</p>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600">Excerpt (shown in list)</label>
            <textarea
              className="mt-1 w-full rounded-xl border px-4 py-3 text-sm min-h-[90px]"
              placeholder="Short summary (1–2 lines)."
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600">Content</label>
            <textarea
              className="mt-1 w-full rounded-xl border px-4 py-3 text-sm min-h-[180px]"
              placeholder="Write the full blog content here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600">Cover image</label>
              <input
                className="mt-1 block w-full text-sm"
                type="file"
                accept="image/*"
                onChange={(e) => setCover(e.target.files?.[0] ?? null)}
              />
              {cover ? <p className="mt-1 text-[11px] text-slate-500">{cover.name}</p> : null}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600">Status</label>
              <select
                className="mt-1 w-full h-11 rounded-xl border px-4 text-sm"
                value={status}
                onChange={(e) => setStatus(e.target.value as AdminBlogStatus)}
              >
                <option value="draft">Draft (not visible to users)</option>
                <option value="published">Published (visible to users)</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button className="bg-green-600 hover:bg-green-700 text-white" disabled={loading} onClick={onCreate}>
              Create Post
            </Button>
            <Button
              variant="outline"
              disabled={loading}
              onClick={() => {
                setTitle("");
                setSlug("");
                setExcerpt("");
                setContent("");
                setStatus("draft");
                setCover(null);
              }}
            >
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* FILTERS */}
      <Card>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-slate-600">Search</label>
              <input
                className="mt-1 w-full h-11 rounded-xl border px-4 text-sm"
                placeholder="Search by title / slug..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600">Status</label>
              <select
                className="mt-1 w-full h-11 rounded-xl border px-4 text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
              >
                <option value="all">All</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>

            <div className="flex items-end gap-2">
              <Button className="bg-green-600 hover:bg-green-700 text-white" disabled={loading} onClick={applyFilters}>
                Apply
              </Button>
              <select
                className="h-11 rounded-xl border px-3 text-sm"
                value={limit}
                onChange={async (e) => {
                  const l = Number(e.target.value);
                  setLimit(l);
                  setPage(1);
                  await fetchAll(1, l);
                }}
              >
                <option value={5}>5 / page</option>
                <option value={10}>10 / page</option>
                <option value={20}>20 / page</option>
              </select>
            </div>
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
                  <th className="p-4 font-semibold">Title</th>
                  <th className="p-4 font-semibold">Slug</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Updated</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {!loading && rows.length === 0 ? (
                  <tr>
                    <td className="p-6 text-slate-500" colSpan={5}>
                      No blog posts found.
                    </td>
                  </tr>
                ) : (
                  rows.map((b) => {
                    const isEdit = editingId === b._id;

                    return (
                      <tr key={b._id} className="border-t align-top">
                        <td className="p-4">
                          {isEdit ? (
                            <input
                              className="w-full h-10 rounded-xl border px-3 text-sm"
                              value={eTitle}
                              onChange={(e) => {
                                const v = e.target.value;
                                setETitle(v);
                                setESlug((prev) => (prev.trim() ? prev : slugify(v)));
                              }}
                            />
                          ) : (
                            <div className="space-y-1">
                              <div className="font-semibold text-slate-900">{b.title}</div>
                              <div className="text-xs text-slate-500 line-clamp-2">{b.excerpt || "-"}</div>
                            </div>
                          )}
                        </td>

                        <td className="p-4">
                          {isEdit ? (
                            <input
                              className="w-full h-10 rounded-xl border px-3 text-sm"
                              value={eSlug}
                              onChange={(e) => setESlug(slugify(e.target.value))}
                            />
                          ) : (
                            <span className="text-slate-700">{b.slug}</span>
                          )}
                        </td>

                        <td className="p-4">
                          {isEdit ? (
                            <select
                              className="w-full h-10 rounded-xl border px-3 text-sm"
                              value={eStatus}
                              onChange={(e) => setEStatus(e.target.value as AdminBlogStatus)}
                            >
                              <option value="draft">draft</option>
                              <option value="published">published</option>
                            </select>
                          ) : (
                            <StatusBadge status={b.status} />
                          )}
                        </td>

                        <td className="p-4 text-slate-700">
                          {b.updatedAt ? new Date(b.updatedAt).toLocaleString() : "-"}
                        </td>

                        <td className="p-4">
                          <div className="flex justify-end gap-2">
                            {isEdit ? (
                              <>
                                <label className="h-10 inline-flex items-center gap-2 rounded-xl border px-3 text-xs cursor-pointer">
                                  <span>Cover</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => setECover(e.target.files?.[0] ?? null)}
                                  />
                                </label>

                                <Button className="bg-green-600 hover:bg-green-700 text-white" disabled={loading} onClick={onSaveEdit}>
                                  Save
                                </Button>
                                <Button variant="outline" disabled={loading} onClick={cancelEdit}>
                                  Cancel
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button variant="outline" disabled={loading} onClick={() => startEdit(b)}>
                                  Edit
                                </Button>
                                <Button
                                  variant="outline"
                                  className="border-red-500 text-red-600 hover:bg-red-50"
                                  disabled={loading}
                                  onClick={() => onDelete(b._id)}
                                >
                                  Delete
                                </Button>
                              </>
                            )}
                          </div>

                          {isEdit ? (
                            <div className="mt-3 space-y-2">
                              <textarea
                                className="w-full rounded-xl border px-3 py-2 text-sm min-h-[80px]"
                                placeholder="Excerpt"
                                value={eExcerpt}
                                onChange={(e) => setEExcerpt(e.target.value)}
                              />
                              <textarea
                                className="w-full rounded-xl border px-3 py-2 text-sm min-h-[120px]"
                                placeholder="Content"
                                value={eContent}
                                onChange={(e) => setEContent(e.target.value)}
                              />
                              {eCover ? <p className="text-xs text-slate-500">New cover: {eCover.name}</p> : null}
                            </div>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between p-4 border-t bg-white">
            <div className="text-sm text-slate-600">
              Page <span className="font-semibold">{page}</span> / <span className="font-semibold">{totalPages}</span>  
              {meta?.total != null ? <span className="ml-2 text-slate-400">(Total: {meta.total})</span> : null}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" disabled={loading || page <= 1} onClick={goPrev}>
                Prev
              </Button>
              <Button variant="outline" disabled={loading || page >= totalPages} onClick={goNext}>
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}