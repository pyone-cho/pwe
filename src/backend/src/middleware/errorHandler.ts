import { Request, Response, NextFunction } from "express";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  console.error("Error:", err);

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: { code: err.constructor.name, message: err.message },
    });
    return;
  }

  // Prisma errors
  if (err.name === "PrismaClientKnownRequestError") {
    const prismaErr = err as { code?: string };
    if (prismaErr.code === "P2025") {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Record not found" } });
      return;
    }
    if (prismaErr.code === "P2002") {
      res.status(409).json({ success: false, error: { code: "CONFLICT", message: "Record already exists" } });
      return;
    }
  }

  // Default error — never leak internal details
  res.status(500).json({
    success: false,
    error: { code: "INTERNAL_ERROR", message: "Internal server error" },
  });
}
