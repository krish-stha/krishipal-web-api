import { api } from "../axios";
import { endpoints } from "../endpoints";

export async function listPublicCategories() {
  const res = await api.get(endpoints.public.categories);
  return res.data; // { success, data }
}
