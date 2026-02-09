import { api } from "../axios";
import { endpoints } from "../endpoints";

/**
 * GET /api/admin/users (supports pagination)
 * Example: adminListUsers({ page: 1, limit: 10 })
 */
export async function adminListUsers(params?: { page?: number; limit?: number }) {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));

  const qs = query.toString();

  // ✅ IMPORTANT: use endpoints like other functions
  const base = endpoints.admin.users; // should be "/admin/users" or "admin/users" depending on your endpoints file
  const url = qs ? `${base}?${qs}` : base;

  const res = await api.get(url);
  return res.data; // { success: true, data: [...], meta?: {...} }
}

/**
 * GET /api/admin/users/:id
 */
export async function adminGetUserById(id: string) {
  const res = await api.get(endpoints.admin.userById(id));
  return res.data;
}

/**
 * POST /api/admin/users  (Multer)
 */
export async function adminCreateUser(fd: FormData) {
  const res = await api.post(endpoints.admin.users, fd);
  return res.data;
}

/**
 * PUT /api/admin/users/:id  (Multer)
 */
export async function adminUpdateUser(id: string, fd: FormData) {
  const res = await api.put(endpoints.admin.userById(id), fd);
  return res.data;
}

/**
 * DELETE /api/admin/users/:id  (SOFT DELETE)
 */
export async function adminSoftDeleteUser(id: string) {
  const res = await api.delete(endpoints.admin.userById(id));
  return res.data;
}

/**
 * DELETE /api/admin/users/:id/hard (HARD DELETE)
 */
export async function adminHardDeleteUser(id: string) {
  const res = await api.delete(endpoints.admin.hardDelete(id));
  return res.data;
}
