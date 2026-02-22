import { api } from "../axios";
import { endpoints } from "../endpoints";

export async function adminListProducts(params?: { page?: number; limit?: number; search?: string}  ) {
  const res = await api.get(endpoints.admin.products, { params });
  return res.data;
}

export async function adminCreateProduct(fd: FormData) {
  // fd must include "images" files (multiple)
  const res = await api.post(endpoints.admin.products, fd);
  return res.data;
}

export async function adminUpdateProduct(id: string, fd: FormData) {
  const res = await api.put(endpoints.admin.productById(id), fd);
  return res.data;
}

export async function adminSoftDeleteProduct(id: string) {
  const res = await api.delete(endpoints.admin.productById(id));
  return res.data;
}

export async function adminHardDeleteProduct(id: string) {
  const res = await api.delete(endpoints.admin.productHardDelete(id));
  return res.data;
}
