import { NextFunction, Request, Response } from "express";
import multer from "multer";

export function multerErrorHandler(
  err: any,
  _req: Request,
  res: Response,
  next: NextFunction
) {
  if (!err) return next();

  if (err instanceof multer.MulterError) {
    return res.status(400).json({ success: false, message: err.message });
  }

  return res.status(400).json({
    success: false,
    message: err.message || "Upload failed",
  });
}
