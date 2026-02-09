import multer from "multer";
import path from "path";
import fs from "fs";

const MAX_IMAGE_SIZE = 3 * 1024 * 1024; // 3MB
const productDir = path.join(process.cwd(), "public", "product_images");

if (!fs.existsSync(productDir)) {
  fs.mkdirSync(productDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, productDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `product-${Date.now()}-${Math.floor(Math.random() * 1e6)}${ext}`);
  },
});

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  // Field name for products = "images"
  if (file.fieldname !== "images") {
    return cb(new Error("Invalid field name. Use images"));
  }

  const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error(`Only JPG/PNG/GIF/WEBP allowed. Got: ${file.mimetype}`));
  }
  cb(null, true);
};

export const uploadProductImages = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_IMAGE_SIZE },
});
