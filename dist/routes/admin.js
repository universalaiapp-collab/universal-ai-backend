"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/admin.ts
const express_1 = require("express");
const router = (0, express_1.Router)();
/**
 * GET /admin/metrics
 * Return simple runtime metrics
 */
router.get("/metrics", (_req, res) => {
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
router.post("/metrics", (req, res) => {
    console.log("[admin] /metrics POST", req.body ?? {});
    res.json({ ok: true, accepted: true, ts: Date.now() });
});
exports.default = router;
