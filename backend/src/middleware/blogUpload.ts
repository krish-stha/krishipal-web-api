import multer from "multer";
import path from "path";
import fs from "fs";

const dir = path.resolve(process.cwd(), "public", "uploads", "blogs");
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, dir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const safeExt = ext || ".jpg";
    cb(null, `blog-${Date.now()}-${Math.random().toString(16).slice(2)}${safeExt}`);
  },
});

export const blogUpload = multer({ storage });