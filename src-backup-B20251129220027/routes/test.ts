// src/routes/test.ts
import { Router, Request, Response } from "express";

const router = Router();

/**
 * POST /test/gemini
 * Simple test endpoint you referenced in logs
 */
router.post("/gemini", (req: Request, res: Response) => {
  console.log("[test] /gemini called");
  const body = req.body ?? {};
  res.json({ ok: true, route: "test/gemini", echo: body, ts: Date.now() });
});

export default router;
