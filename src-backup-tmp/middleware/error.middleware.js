"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = errorHandler;
function errorHandler(err, req, res, next) {
    console.error("UnhandledError:", err);
    const status = err?.status || 500;
    const msg = err?.message || "Internal server error";
    res.status(status).json({ ok: false, error: msg });
}
