import { api } from "../axios";

export async function adminGetAbout() {
  const res = await api.get("/admin/about");
  return res.data;
}

export async function adminUpdateAbout(payload: any) {
  const res = await api.put("/admin/about", payload);
  return res.data;
}

export async function adminUploadMissionImage(file: File) {
  const fd = new FormData();
  fd.append("image", file);
  const res = await api.post("/admin/about/mission-image", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function adminUploadVisionImage(file: File) {
  const fd = new FormData();
  fd.append("image", file);
  const res = await api.post("/admin/about/vision-image", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}