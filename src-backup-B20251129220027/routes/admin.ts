// src/routes/admin.ts
import { Router, Request, Response } from "express";

const router = Router();

/**
 * GET /admin/metrics
 * Return simple runtime metrics
 */
router.get("/metrics", (_req: Request, res: Response) => {
  res.json({
    ok: true,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    env: process.env.NODE_ENV ?? "undefined",
  });
});

/**
 * POST /admin/metrics
 * Accept metrics payload (stub)
 */
router.post("/metrics", (req: Request, res: Response) => {
  console.log("[admin] /metrics POST", req.body ?? {});
  res.json({ ok: true, accepted: true, ts: Date.now() });
});

export default router;
