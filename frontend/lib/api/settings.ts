import { api } from "./axios";
import { endpoints } from "./endpoints";

export async function getPublicSettings() {
  const res = await api.get(endpoints.settings.public);
  return res.data;
}