import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: "Validation failed",
      details: err.errors,
    });
    return;
  }

  // Multer file errors
  if (err.message?.includes("Invalid file type") || err.message?.includes("File too large")) {
    res.status(400).json({
      success: false,
      error: err.message,
    });
    return;
  }

  // Custom application errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code,
    });
    return;
  }

  // Unexpected errors
  console.error("[ERROR]", err);
  res.status(500).json({
    success: false,
    error: "Internal server error",
  });
}
