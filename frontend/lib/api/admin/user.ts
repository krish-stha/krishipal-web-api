import { api } from "../axios";
import { endpoints } from "../endpoints";

/**
 * GET /api/admin/users
 */
export async function adminListUsers() {
  const res = await api.get(endpoints.admin.users);
  return res.data; // { success: true, data: [...] }
}

/**
 * GET /api/admin/users/:id
 */
export async function adminGetUserById(id: string) {
  const res = await api.get(endpoints.admin.userById(id));
  return res.data; // { success: true, data: {...} }
}

/**
 * POST /api/admin/users  (Multer)
 * MUST send FormData (even if no image)
 */
export async function adminCreateUser(fd: FormData) {
  const res = await api.post(endpoints.admin.users, fd);
  return res.data; // { success: true, data: {...} }
}

/**
 * PUT /api/admin/users/:id  (Multer)
 * MUST send FormData (even if no image)
 */
export async function adminUpdateUser(id: string, fd: FormData) {
  const res = await api.put(endpoints.admin.userById(id), fd);
  return res.data; // { success: true, data: {...} }
}

/**
 * DELETE /api/admin/users/:id  (SOFT DELETE)
 */
export async function adminSoftDeleteUser(id: string) {
  const res = await api.delete(endpoints.admin.userById(id));
  return res.data; // { success: true, data: {...} }
}

/**
 * DELETE /api/admin/users/:id/hard (HARD DELETE)
 */
export async function adminHardDeleteUser(id: string) {
  const res = await api.delete(endpoints.admin.hardDelete(id));
  return res.data; // { success: true, data: {...} }
}
