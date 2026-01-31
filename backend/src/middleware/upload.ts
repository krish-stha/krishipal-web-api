import multer from "multer";
import path from "path";
import fs from "fs";

const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
const profilePhotoDir = path.join(process.cwd(), "public", "profile_photo");

if (!fs.existsSync(profilePhotoDir)) {
  fs.mkdirSync(profilePhotoDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, profilePhotoDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `pro-pic-${Date.now()}${ext}`);
  },
});

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  if (file.fieldname !== "profilePicture") {
    return cb(new Error("Invalid field name. Use profilePicture"));
  }

  const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];

  if (!allowed.includes(file.mimetype)) {
    return cb(
      new Error(`Only JPG/PNG/GIF/WEBP allowed. Got: ${file.mimetype}`)
    );
  }

  cb(null, true);
};


export const uploadProfilePicture = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_IMAGE_SIZE },
});
