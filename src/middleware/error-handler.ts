import { Request, Response, NextFunction } from "express";

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error("Unhandled error:", JSON.stringify(err?.stack || err, null, 2));
  const status = err?.status || 500;
  res.status(status).json({ ok: false, error: err?.message || "server_error" });
}
