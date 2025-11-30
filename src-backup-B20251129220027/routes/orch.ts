// src/routes/orch.ts
import { Router, Request, Response } from "express";
import * as orchController from '../controllers/orch.controller';
const { orchestratorChat, orchestratorController } = orchController as any;

const router = Router();

/**
 * Basic health/route checks
 */
router.get("/", (_req: Request, res: Response) => {
  return res.json({ ok: true, route: "/orch/", healthy: true });
});

// explicit health path user asked for
router.get("/health", (_req: Request, res: Response) => {
  return res.json({ ok: true, service: "orchestrator", env: process.env.NODE_ENV || "development" });
});

/**
 * Primary generic endpoints
 */
router.post("/", (req: Request, res: Response) => orchestratorChat(req, res));
router.post("/orchestrate", (req: Request, res: Response) => orchestratorChat(req, res));

/**
 * Typed endpoints (chat / image / embedding)
 */
router.post("/chat", (req: Request, res: Response) => {
  req.body = req.body ?? {};
  req.body.kind = "chat";
  return orchestratorChat(req, res);
});

router.post("/image", (req: Request, res: Response) => {
  req.body = req.body ?? {};
  req.body.kind = "image";
  return orchestratorChat(req, res);
});

router.post("/embedding", (req: Request, res: Response) => {
  req.body = req.body ?? {};
  req.body.kind = "embedding";
  return orchestratorChat(req, res);
});

export default router;

