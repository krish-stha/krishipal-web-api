import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";

export const adminOnly = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ success: false, message: "Admin access only" });
  }
  next();
};

export const selfOrAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  const id = req.params.id;
  if (req.user?.role === "admin") return next();
  if (req.user?.id !== id) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }
  next();
};
