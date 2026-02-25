import multer from "multer";
import path from "path";
import fs from "fs";

const MAX_IMAGE_SIZE = 3 * 1024 * 1024; // 3MB
const aboutDir = path.join(process.cwd(), "public", "about");

if (!fs.existsSync(aboutDir)) {
  fs.mkdirSync(aboutDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, aboutDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const section = String(req.params?.section || "about").toLowerCase();
    cb(null, `about-${section}-${Date.now()}${ext}`);
  },
});

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  if (file.fieldname !== "image") return cb(new Error("Invalid field name. Use image"));

  const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!allowed.includes(file.mimetype)) return cb(new Error(`Only JPG/PNG/GIF/WEBP allowed. Got: ${file.mimetype}`));

  cb(null, true);
};

export const uploadAboutImage = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_IMAGE_SIZE },
});