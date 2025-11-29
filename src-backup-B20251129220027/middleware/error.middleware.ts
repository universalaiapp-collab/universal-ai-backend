import { Request, Response, NextFunction } from "express";

export default function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error("UnhandledError:", err);
  const status = err?.status || 500;
  const msg = err?.message || "Internal server error";
  res.status(status).json({ ok: false, error: msg });
}
