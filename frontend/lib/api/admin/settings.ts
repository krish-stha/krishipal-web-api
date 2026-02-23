import { api } from "@/lib/api/axios";
import { endpoints } from "@/lib/api/endpoints";

export const adminGetSettings = () => api.get(endpoints.admin.settings);
export const adminUpdateSettings = (payload: any) => api.put(endpoints.admin.settings, payload);
export const adminUploadLogo = (file: File) => {
  const fd = new FormData();
  fd.append("logo", file);

  return api.post("/admin/settings/logo", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};