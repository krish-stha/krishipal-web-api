import multer from "multer";
import path from "path";
import fs from "fs";

const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
const logoDir = path.join(process.cwd(), "public", "store_logo");

if (!fs.existsSync(logoDir)) {
  fs.mkdirSync(logoDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, logoDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `store-logo-${Date.now()}${ext}`);
  },
});

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  // ✅ field name must be "logo"
  if (file.fieldname !== "logo") {
    return cb(new Error("Invalid field name. Use logo"));
  }

  const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error(`Only JPG/PNG/GIF/WEBP allowed. Got: ${file.mimetype}`));
  }

  cb(null, true);
};

export const uploadLogo = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_IMAGE_SIZE },
});