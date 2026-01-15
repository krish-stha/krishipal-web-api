import { Request, Response, NextFunction } from "express";
import { HttpError } from "../errors/http-error";

/**
 * Global error handler middleware
 */
export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  // If it's a custom HttpError
  if (err instanceof HttpError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // Mongoose validation errors
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((val: any) => val.message);
    return res.status(400).json({
      success: false,
      message: messages.join(", "),
    });
  }

  console.error("Unexpected Error:", err);

  // Generic server error
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
};
