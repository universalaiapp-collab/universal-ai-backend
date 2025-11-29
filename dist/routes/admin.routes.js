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
// src/routes/admin.routes.ts
const express_1 = __importDefault(require("express"));
const metricsService = __importStar(require("../services/metrics.service"));
const wallet_model_1 = __importDefault(require("../models/wallet.model"));
const router = express_1.default.Router();
function adminGuard(req, res, next) {
    const user = req.user;
    const apiKey = req.headers['x-admin-api-key'];
    if ((user && user.role === 'admin') || apiKey === process.env.ADMIN_API_KEY)
        return next();
    return res.status(403).json({ ok: false, message: 'forbidden' });
}
router.use(adminGuard);
router.get('/admin/metrics', async (req, res) => {
    const q = {};
    if (req.query.userId)
        q.userId = req.query.userId;
    const rows = await metricsService.queryMetrics(q, 200);
    res.json({ ok: true, count: rows.length, rows });
});
router.get('/admin/wallets/:userId', async (req, res) => {
    const w = await wallet_model_1.default.findOne({ userId: req.params.userId }).lean();
    if (!w)
        return res.status(404).json({ ok: false });
    return res.json({ ok: true, wallet: w });
});
router.get('/admin/circuit-breakers', async (req, res) => {
    // simple placeholder: list of providers and manual CB states may be stored in DB later.
    return res.json({ ok: true, cb: { openai: { failures: 0 }, gemini: { failures: 0 } } });
});
exports.default = router;
