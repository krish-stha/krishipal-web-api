import path from "path";
import fs from "fs";
import { SettingsService } from "./settings.service";

export type CompanyInfo = {
  name: string;
  address: string;
  email: string;
  phone: string;
  logoPath: string; // local path on server
};

export async function getCompanyFromSettings(): Promise<CompanyInfo> {
  const ss = new SettingsService();
  const s: any = await ss.getOrCreate();

  const fallback = path.join(process.cwd(), "public", "logo.png");

  const uploaded =
    s?.storeLogo
      ? path.join(process.cwd(), "public", "store_logo", String(s.storeLogo))
      : "";

  const logoPath = uploaded && fs.existsSync(uploaded) ? uploaded : fallback;

  return {
    name: String(s?.storeName || "KrishiPal").trim() || "KrishiPal",
    address: String(s?.storeAddress || "Nepal").trim() || "Nepal",
    email: String(s?.storeEmail || "").trim() || "-",
    phone: String(s?.storePhone || "").trim() || "-",
    logoPath,
  };
}