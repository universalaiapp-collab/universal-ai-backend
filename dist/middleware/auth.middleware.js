"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
// src/middleware/auth.middleware.ts
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_model_1 = __importDefault(require("../models/user.model"));
const wallet_model_1 = __importDefault(require("../models/wallet.model"));
const DEFAULT_TIERS = {
    FREE: { dailyLimit: 2000, maxTokens: 2000 },
    PAID: { dailyLimit: 20000, maxTokens: 16000 },
    PRO: { dailyLimit: 100000, maxTokens: 65536 },
};
const authMiddleware = async (req, res, next) => {
    try {
        const header = req.headers.authorization;
        let payload = null;
        if (header && header.startsWith("Bearer ")) {
            const token = header.split(" ")[1];
            try {
                payload = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            }
            catch (err) {
                return res.status(401).json({ msg: "Invalid token" });
            }
        }
        if (!payload && process.env.NODE_ENV !== "production") {
            req.user = {
                id: "dev-user-id",
                name: "Dev User",
                email: "dev@local",
                tier: "PRO",
                dailyLimit: DEFAULT_TIERS.PRO.dailyLimit,
                maxPromptTokens: DEFAULT_TIERS.PRO.maxTokens,
                maxTokensPerRequest: DEFAULT_TIERS.PRO.maxTokens,
                role: "admin",
                isDev: true,
            };
            return next();
        }
        if (!payload)
            return res.status(401).json({ msg: "No token provided" });
        const userId = payload.id;
        const user = await user_model_1.default.findById(userId).lean();
        let tier = "FREE";
        if (user && user.tier)
            tier = user.tier;
        else if (user)
            tier = "FREE";
        const tierMeta = DEFAULT_TIERS[tier];
        req.user = {
            id: user ? user._id.toString() : userId,
            name: user ? user.name : undefined,
            email: user ? user.email : undefined,
            tier,
            dailyLimit: tierMeta.dailyLimit,
            maxPromptTokens: tierMeta.maxTokens,
            maxTokensPerRequest: tierMeta.maxTokens,
            role: user ? user.role || "user" : "user",
            isDev: false,
        };
        try {
            const wallet = await wallet_model_1.default.findOne({ userId: req.user.id }).lean();
            if (wallet)
                req.user.wallet = { credits: wallet.credits };
        }
        catch { /* ignore wallet errors */ }
        next();
    }
    catch (err) {
        console.error("AuthMiddleware Error:", err);
        return res.status(500).json({ msg: "Auth error" });
    }
};
exports.authMiddleware = authMiddleware;
exports.default = exports.authMiddleware;
