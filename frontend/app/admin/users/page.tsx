"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/app/auth/components/ui/button";
import { adminListUsers, adminSoftDeleteUser } from "@/lib/api/admin/user";
import {
  Users,
  Plus,
  Shield,
  User as UserIcon,
  Search,
  Filter,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Download,
  Trash2,
} from "lucide-react";

type RoleFilter = "all" | "admin" | "user";
type SortKey =
  | "created_desc"
  | "created_asc"
  | "name_asc"
  | "name_desc"
  | "email_asc"
  | "email_desc";

const formatDate = (value?: string) => {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};

const getCreatedValue = (u: any): string | undefined => u.createdAt || u.created_at;

const asTime = (value?: string) => {
  if (!value) return 0;
  const t = new Date(value).getTime();
  return Number.isFinite(t) ? t : 0;
};

const csvEscape = (v: any) => {
  const s = String(v ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

// ✅ added only for avatar rendering (does NOT change other functionality)
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

function normalizePhotoUrl(photo: string | null): string | null {
  if (!photo) return null;

  if (photo.startsWith("http://") || photo.startsWith("https://")) return photo;

  // filename only -> /public/profile_photo/<filename>
  if (!photo.includes("/")) return `${BACKEND_URL}/public/profile_photo/${photo}`;

  if (photo.startsWith("public/")) return `${BACKEND_URL}/${photo}`;
  if (photo.startsWith("/public/")) return `${BACKEND_URL}${photo}`;

  if (photo.startsWith("profile_photo/")) return `${BACKEND_URL}/public/${photo}`;
  if (photo.startsWith("/profile_photo/")) return `${BACKEND_URL}/public${photo}`;

  if (!photo.startsWith("/")) return `${BACKEND_URL}/${photo}`;
  return `${BACKEND_URL}${photo}`;
}

function withCacheBust(url: string | null): string | null {
  if (!url) return null;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}t=${Date.now()}`;
}

type Meta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [meta, setMeta] = useState<Meta>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters (client-side on current page)
  const [q, setQ] = useState("");
  const [role, setRole] = useState<RoleFilter>("all");

  // Sorting (client-side on current page)
  const [sort, setSort] = useState<SortKey>("created_desc");

  // Backend Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchUsers = async (p = page, l = pageSize) => {
    setLoading(true);
    setError(null);

    try {
      // ✅ NEW: request backend pagination
      const res = await adminListUsers({ page: p, limit: l });

      const list = Array.isArray(res.data) ? res.data : [];
const m = res.meta ?? null;

setUsers(list);

      // backend meta exists when page/limit used
      if (m) {
        setMeta({
          total: m.total ?? 0,
          page: m.page ?? p,
          limit: m.limit ?? l,
          totalPages: m.totalPages ?? 1,
          hasNextPage: m.hasNextPage,
          hasPrevPage: m.hasPrevPage,
        });
      } else {
        // fallback if API still returns non-paginated
        setMeta({
          total: list.length,
          page: p,
          limit: l,
          totalPages: Math.max(1, Math.ceil(list.length / l)),
        });
      }
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Unable to load users";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch when page or pageSize changes (server pagination)
  useEffect(() => {
    let mounted = true;

    (async () => {
      if (!mounted) return;
      await fetchUsers(page, pageSize);
    })();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]);

  // reset to page 1 when filters/sort/pageSize change
  useEffect(() => {
    setPage(1);
  }, [q, role, sort, pageSize]);

  // Stats (total is from backend; role split is from current page)
  const stats = useMemo(() => {
    const total = meta.total;
    const adminsOnPage = users.filter((u) => u.role === "admin").length;
    const usersOnPage = users.filter((u) => u.role !== "admin").length;
    return { total, adminsOnPage, usersOnPage };
  }, [users, meta.total]);

  // Filter + Sort on current page only (still useful UX)
  const filteredAndSorted = useMemo(() => {
    const query = q.trim().toLowerCase();

    const filtered = users.filter((u) => {
      const roleOk =
        role === "all"
          ? true
          : role === "admin"
          ? u.role === "admin"
          : u.role !== "admin";

      if (!roleOk) return false;
      if (!query) return true;

      const hay = [u.fullName, u.email, u._id].filter(Boolean).join(" ").toLowerCase();
      return hay.includes(query);
    });

    const sorted = [...filtered].sort((a, b) => {
      const aName = String(a.fullName || "").toLowerCase();
      const bName = String(b.fullName || "").toLowerCase();
      const aEmail = String(a.email || "").toLowerCase();
      const bEmail = String(b.email || "").toLowerCase();

      const aCreated = asTime(getCreatedValue(a));
      const bCreated = asTime(getCreatedValue(b));

      switch (sort) {
        case "created_desc":
          return bCreated - aCreated;
        case "created_asc":
          return aCreated - bCreated;
        case "name_asc":
          return aName.localeCompare(bName);
        case "name_desc":
          return bName.localeCompare(aName);
        case "email_asc":
          return aEmail.localeCompare(bEmail);
        case "email_desc":
          return bEmail.localeCompare(aEmail);
        default:
          return 0;
      }
    });

    return sorted;
  }, [users, q, role, sort]);

  const totalPages = Math.max(1, meta.totalPages || 1);
  const safePage = Math.min(page, totalPages);

  const range = useMemo(() => {
    const totalItems = meta.total ?? 0;
    if (!totalItems) return { from: 0, to: 0 };
    const from = (safePage - 1) * pageSize + 1;
    const to = Math.min(safePage * pageSize, totalItems);
    return { from, to };
  }, [safePage, pageSize, meta.total]);

  const pageButtons = useMemo(() => {
    const maxButtons = 5;
    if (totalPages <= maxButtons) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: number[] = [];
    const left = Math.max(1, safePage - 1);
    const right = Math.min(totalPages, safePage + 1);

    pages.push(1);
    if (left > 2) pages.push(-1);
    for (let p = left; p <= right; p++) {
      if (p !== 1 && p !== totalPages) pages.push(p);
    }
    if (right < totalPages - 1) pages.push(-1);
    pages.push(totalPages);

    return pages.filter((v, i, arr) => (v === -1 ? arr[i - 1] !== -1 : true));
  }, [safePage, totalPages]);

  const exportCsv = () => {
    // exports CURRENT PAGE (already server paginated)
    const rows = filteredAndSorted.map((u) => ({
      id: u._id ?? "",
      name: u.fullName ?? "",
      email: u.email ?? "",
      role: u.role ?? "",
      created: formatDate(getCreatedValue(u) as any),
    }));

    const header = ["ID", "Name", "Email", "Role", "Created"];
    const lines = [
      header.join(","),
      ...rows.map((r) => [r.id, r.name, r.email, r.role, r.created].map(csvEscape).join(",")),
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "users_page.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleDeleteFromList = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      await adminSoftDeleteUser(userId);

      // Refetch current page after delete.
      // If last item deleted on page and page > 1, go back one page.
      const willBeEmpty = users.length === 1 && page > 1;
      if (willBeEmpty) {
        setPage((p) => Math.max(1, p - 1));
      } else {
        await fetchUsers(page, pageSize);
      }

      alert("User deleted ✅");
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || "Delete failed");
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="text-xs font-semibold tracking-wide text-slate-500">USER ADMINISTRATION</div>

          <h1 className="mt-2 text-2xl font-semibold text-slate-900">Users</h1>

          <p className="mt-1 text-sm text-slate-500">Manage accounts, roles, and access privileges.</p>

          <div className="mt-4 flex flex-wrap gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-sm text-slate-700">
              <Users className="h-4 w-4 text-green-700" />
              Total: <b className="text-slate-900">{stats.total}</b>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-sm text-slate-700">
              <Shield className="h-4 w-4 text-green-700" />
              Admins (this page): <b className="text-slate-900">{stats.adminsOnPage}</b>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-sm text-slate-700">
              <UserIcon className="h-4 w-4 text-green-700" />
              Users (this page): <b className="text-slate-900">{stats.usersOnPage}</b>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={exportCsv}
            disabled={loading || !!error || filteredAndSorted.length === 0}
          >
            <Download className="h-4 w-4" />
            Export CSV (page)
          </Button>

          <Link href="/admin/users/create">
            <Button className="bg-green-600 hover:bg-green-700 gap-2">
              <Plus className="h-4 w-4" />
              Create User
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6 grid gap-3 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search (current page) by name, email, or ID..."
              className="w-full rounded-xl border bg-white pl-9 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-200"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-2 text-sm text-slate-600 shrink-0">
            <Filter className="h-4 w-4" />
            Role
          </div>
          <select
            className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-200"
            value={role}
            onChange={(e) => setRole(e.target.value as RoleFilter)}
          >
            <option value="all">All</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-2 text-sm text-slate-600 shrink-0">
            <ArrowUpDown className="h-4 w-4" />
            Sort
          </div>
          <select
            className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-200"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
          >
            <option value="created_desc">Created: Newest</option>
            <option value="created_asc">Created: Oldest</option>
            <option value="name_asc">Name: A → Z</option>
            <option value="name_desc">Name: Z → A</option>
            <option value="email_asc">Email: A → Z</option>
            <option value="email_desc">Email: Z → A</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-sm text-slate-600 shrink-0">Rows</div>
          <select
            className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-200"
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="mt-5">
        {loading && (
          <div className="rounded-2xl border bg-slate-50 p-6 text-slate-600">Loading users...</div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>
        )}

        {!loading && !error && (
          <div className="overflow-hidden rounded-2xl border">
            <div className="border-b bg-white px-4 py-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-900">User Directory</div>
                <div className="text-xs text-slate-500">
                  Showing {range.from}–{range.to} of {meta.total}
                </div>
              </div>

              {/* Desktop pagination */}
              <div className="hidden md:flex items-center gap-2">
                <Button
                  variant="outline"
                  className="h-8 px-2"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {pageButtons.map((p, idx) =>
                  p === -1 ? (
                    <span key={`e-${idx}`} className="px-2 text-slate-400">
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={[
                        "h-8 min-w-8 rounded-lg border px-2 text-sm font-medium transition",
                        p === safePage
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white text-slate-700 hover:bg-slate-50",
                      ].join(" ")}
                    >
                      {p}
                    </button>
                  )
                )}

                <Button
                  variant="outline"
                  className="h-8 px-2"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3 hidden sm:table-cell">
                      <span className="inline-flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Created
                      </span>
                    </th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {filteredAndSorted.map((u) => {
                    const initial = (u.fullName?.trim()?.[0] || u.email?.[0] || "U").toUpperCase();
                    const isAdmin = u.role === "admin";

                    const photoUrl = withCacheBust(normalizePhotoUrl(u.profile_picture || null));

                    return (
                      <tr key={u._id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full overflow-hidden bg-green-50 ring-1 ring-green-100 flex items-center justify-center font-semibold text-green-800">
                              {photoUrl ? (
                                <img
                                  src={photoUrl}
                                  alt="Profile"
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.src = "";
                                  }}
                                />
                              ) : (
                                initial
                              )}
                            </div>

                            <div>
                              <div className="font-medium text-slate-900">{u.fullName || "—"}</div>
                              <div className="text-xs text-slate-500 font-mono">{u._id}</div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3 text-sm text-slate-700">{u.email}</td>

                        <td className="px-4 py-3">
                          <span
                            className={[
                              "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
                              isAdmin
                                ? "bg-green-50 text-green-800 ring-1 ring-green-100"
                                : "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
                            ].join(" ")}
                          >
                            {u.role}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-sm text-slate-600 hidden sm:table-cell">
                          {formatDate(getCreatedValue(u))}
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3 text-sm">
                            <Link
                              href={`/admin/users/${u._id}`}
                              className="font-medium text-slate-700 hover:text-slate-900"
                            >
                              View
                            </Link>
                            <Link
                              href={`/admin/users/${u._id}/edit`}
                              className="font-medium text-green-700 hover:text-green-800"
                            >
                              Edit
                            </Link>

                            {/* ✅ Professor requirement: delete button in table with confirm */}
                            <button
                              onClick={() => handleDeleteFromList(u._id)}
                              className="inline-flex items-center gap-1 font-medium text-red-600 hover:text-red-700"
                              title="Delete user"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {!filteredAndSorted.length && (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                        No users match your filters (current page).
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile pagination footer */}
            <div className="md:hidden flex items-center justify-between gap-2 border-t bg-white px-4 py-3">
              <Button
                variant="outline"
                className="h-9"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
              >
                Prev
              </Button>

              <div className="text-sm text-slate-600">
                Page <b className="text-slate-900">{safePage}</b> / {totalPages}
              </div>

              <Button
                variant="outline"
                className="h-9"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
