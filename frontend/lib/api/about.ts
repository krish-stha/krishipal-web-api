import { api } from "./axios";

export async function getPublicAbout() {
  const res = await api.get("/about");
  return res.data;
}