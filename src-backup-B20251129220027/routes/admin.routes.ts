import { Router } from "express";
import { getMetrics, clearMetrics } from "../controllers/admin.metrics.controller";
import { requireAdmin } from "../middleware/admin.auth";

const router = Router();

// GET /admin/metrics (secured)
router.get("/metrics", requireAdmin, getMetrics);

// DELETE /admin/metrics?confirm=yes (secured)
router.delete("/metrics", requireAdmin, clearMetrics);

export default router;
