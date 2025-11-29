"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.quotaMiddleware = quotaMiddleware;
const day2Config_1 = __importDefault(require("../config/day2Config"));
const user_model_1 = __importDefault(require("../models/user.model")); // OPTIONAL: adapt if you have a different user model
// Best-effort token estimator
function estimateTokens(prompt = '', maxTokens) {
    const promptEstimate = Math.ceil((prompt.length || 0) / 4);
    const completionEstimate = maxTokens ?? 100;
    return promptEstimate + completionEstimate;
}
async function quotaMiddleware(req, res, next) {
    const user = req.user;
    if (!user)
        return res.status(401).json({ ok: false, message: 'Unauthenticated' });
    const dailyLimits = day2Config_1.default.dailyTokenBudget;
    const tier = (user.tier || 'FREE').toUpperCase();
    const dailyLimit = dailyLimits[tier] ?? dailyLimits.FREE;
    // Fetch user's used tokens from user doc or a usage collection.
    // We try to read a 'dailyTokensUsed' field on the user doc; if not found, treat as 0.
    let used = 0;
    try {
        const doc = await user_model_1.default.findById(user.id).lean();
        used = (doc && doc.dailyTokensUsed) || 0;
    }
    catch (e) {
        // If user model is not present or error occurs, allow and continue (best-effort).
        used = 0;
    }
    const prompt = req.body?.prompt || '';
    const est = estimateTokens(prompt, req.body?.maxTokens);
    if (used + est > dailyLimit) {
        res.setHeader('X-DailyLimit', String(dailyLimit));
        return res.status(402).json({
            ok: false,
            error: 'daily_token_budget_exceeded',
            message: 'Daily token budget exceeded — upgrade or wait until tomorrow',
            dailyLimit,
            used,
            estimatedRequired: est,
        });
    }
    // Attach estimation for controller to use for reservation
    req.estimatedTokens = est;
    next();
}
