"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/test.ts
const express_1 = require("express");
const router = (0, express_1.Router)();
/**
 * POST /test/gemini
 * Simple test endpoint you referenced in logs
 */
router.post("/gemini", (req, res) => {
    console.log("[test] /gemini called");
    const body = req.body ?? {};
    res.json({ ok: true, route: "test/gemini", echo: body, ts: Date.now() });
});
exports.default = router;
