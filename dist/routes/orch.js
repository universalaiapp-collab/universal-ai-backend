"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/orch.ts
const express_1 = require("express");
const orch_controller_1 = require("../controllers/orch.controller");
const router = (0, express_1.Router)();
/**
 * Basic health/route checks
 */
router.get("/", (_req, res) => {
    return res.json({ ok: true, route: "/orch/", healthy: true });
});
// explicit health path user asked for
router.get("/health", (_req, res) => {
    return res.json({ ok: true, service: "orchestrator", env: process.env.NODE_ENV || "development" });
});
/**
 * Primary generic endpoints
 */
router.post("/", (req, res) => (0, orch_controller_1.orchestratorChat)(req, res));
router.post("/orchestrate", (req, res) => (0, orch_controller_1.orchestratorChat)(req, res));
/**
 * Typed endpoints (chat / image / embedding)
 */
router.post("/chat", (req, res) => {
    req.body = req.body ?? {};
    req.body.kind = "chat";
    return (0, orch_controller_1.orchestratorChat)(req, res);
});
router.post("/image", (req, res) => {
    req.body = req.body ?? {};
    req.body.kind = "image";
    return (0, orch_controller_1.orchestratorChat)(req, res);
});
router.post("/embedding", (req, res) => {
    req.body = req.body ?? {};
    req.body.kind = "embedding";
    return (0, orch_controller_1.orchestratorChat)(req, res);
});
exports.default = router;
