// src/middleware/rateLimiter.middleware.js
const day2Config = require('../config/day2Config');

// simple in-memory Map: { key -> { count, windowStart } }
const store = new Map();

function keyForReq(req) {
  if (req.user && req.user.id) return `user:${req.user.id}`;
  return `ip:${req.ip || req.connection.remoteAddress || 'unknown'}`;
}

function rateLimiterMiddleware(req, res, next) {
  const cfg = day2Config.rateLimiter;
  const key = keyForReq(req);
  const now = Date.now();
  const windowMs = cfg.windowMs;

  const tier = (req.user && req.user.tier) || 'FREE';
  const tierKey = String(tier).toLowerCase();
  const limit = (cfg[tierKey] && cfg[tierKey].max) || cfg.free.max;

  const entry = store.get(key);
  if (!entry || now - entry.windowStart >= windowMs) {
    store.set(key, { count: 1, windowStart: now });
    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - 1));
    return next();
  }

  entry.count += 1;
  const remaining = Math.max(0, limit - entry.count);
  res.setHeader('X-RateLimit-Limit', limit);
  res.setHeader('X-RateLimit-Remaining', remaining);
  const retryAfter = Math.ceil((entry.windowStart + windowMs - now) / 1000);

  if (entry.count > limit) {
    res.setHeader('Retry-After', retryAfter);
    return res.status(429).json({
      ok: false,
      error: 'rate_limit_exceeded',
      message: `Rate limit exceeded. Try again in ${retryAfter}s.`,
    });
  }

  return next();
}

module.exports = rateLimiterMiddleware;
