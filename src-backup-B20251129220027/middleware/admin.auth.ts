import { Request, Response, NextFunction } from "express";

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const header = (req.get("x-admin-token") || "").toString();
  if (!ADMIN_TOKEN) {
    console.warn("[ADMIN/AUTH] ADMIN_TOKEN not set - admin routes are open (dev only)");
    return next();
  }
  if (header && header === ADMIN_TOKEN) return next();
  res.status(401).json({ ok: false, error: "unauthorized" });
}
