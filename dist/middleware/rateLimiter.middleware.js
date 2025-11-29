"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimiterMiddleware = rateLimiterMiddleware;
const day2Config_1 = __importDefault(require("../config/day2Config"));
const store = new Map();
function keyForReq(req) {
    if (req.user && req.user.id)
        return `user:${req.user.id}`;
    return `ip:${req.ip}`;
}
function rateLimiterMiddleware(req, res, next) {
    const cfg = day2Config_1.default.rateLimiter;
    const key = keyForReq(req);
    const now = Date.now();
    const windowMs = cfg.windowMs;
    const tier = (req.user && req.user.tier) || 'FREE';
    const tierKey = tier.toLowerCase();
    const limit = cfg[tierKey]?.max ?? cfg.free.max;
    const entry = store.get(key);
    if (!entry || now - entry.windowStart >= windowMs) {
        store.set(key, { count: 1, windowStart: now });
        res.setHeader('X-RateLimit-Limit', limit.toString());
        res.setHeader('X-RateLimit-Remaining', (limit - 1).toString());
        return next();
    }
    entry.count += 1;
    const remaining = Math.max(0, limit - entry.count);
    res.setHeader('X-RateLimit-Limit', limit.toString());
    res.setHeader('X-RateLimit-Remaining', remaining.toString());
    const retryAfter = Math.ceil((entry.windowStart + windowMs - now) / 1000);
    if (entry.count > limit) {
        res.setHeader('Retry-After', `${retryAfter}`);
        return res.status(429).json({
            ok: false,
            error: 'rate_limit_exceeded',
            message: `Rate limit exceeded. Try again in ${retryAfter}s.`,
        });
    }
    next();
}
