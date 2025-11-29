// src/routes/orch.ts
import express from "express";
import orchHandlerDefault, { orchController } from "../controllers/orch.controller";

const router = express.Router();

// prefer named exported orchController if present; otherwise use default
const orchHandler = typeof orchController === "function"
  ? orchController
  : (typeof orchHandlerDefault === "function" ? orchHandlerDefault : null);

if (!orchHandler) {
  throw new Error("orch handler not found: expected named export `orchController` or default export from controllers/orch.controller");
}

// Safe wrapper: ensure req.user exists (fall back to body.userId) and log detailed errors
router.post("/orch", async (req, res) => {
  try {
    // defensive: if some middleware expects req.user.id, set a fallback
    if (!req.user && req.body && typeof req.body.userId === "string") {
      (req as any).user = { id: req.body.userId };
    }

    // call the real handler
    await orchHandler(req, res);
  } catch (err) {
    // log full error stack for diagnostics
    try {
      console.error("Unexpected error in /orch route (stack):", (err as any)?.stack || err);
    } catch (logErr) {
      console.error("Unexpected error in /orch route (fallback log):", err);
    }
    return res.status(500).json({ ok: false, error: "internal_error", message: (err as any)?.message || "Internal error", details: { stack: (err as any)?.stack } });
  }
});

export default router;
