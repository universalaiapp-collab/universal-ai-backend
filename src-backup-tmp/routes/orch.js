"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/orch.ts
const express_1 = __importDefault(require("express"));
const orch_controller_1 = __importStar(require("../controllers/orch.controller"));
const router = express_1.default.Router();
// prefer named exported orchController if present; otherwise use default
const orchHandler = typeof orch_controller_1.orchController === "function"
    ? orch_controller_1.orchController
    : (typeof orch_controller_1.default === "function" ? orch_controller_1.default : null);
if (!orchHandler) {
    throw new Error("orch handler not found: expected named export `orchController` or default export from controllers/orch.controller");
}
// Safe wrapper: ensure req.user exists (fall back to body.userId) and log detailed errors
router.post("/orch", async (req, res) => {
    try {
        // defensive: if some middleware expects req.user.id, set a fallback
        if (!req.user && req.body && typeof req.body.userId === "string") {
            req.user = { id: req.body.userId };
        }
        // call the real handler
        await orchHandler(req, res);
    }
    catch (err) {
        // log full error stack for diagnostics
        try {
            console.error("Unexpected error in /orch route (stack):", err?.stack || err);
        }
        catch (logErr) {
            console.error("Unexpected error in /orch route (fallback log):", err);
        }
        return res.status(500).json({ ok: false, error: "internal_error", message: err?.message || "Internal error", details: { stack: err?.stack } });
    }
});
exports.default = router;
