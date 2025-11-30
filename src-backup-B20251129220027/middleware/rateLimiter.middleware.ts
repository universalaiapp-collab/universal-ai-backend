// src/middleware/rateLimiter.middleware.ts
import { Request, Response, NextFunction } from 'express';
import day2Config from '../config/day2Config';

type Key = string;
const store = new Map<Key, { count: number; windowStart: number }>();

function keyForReq(req: Request) {
  if (req.user && (req.user as any).id) return `user:${(req.user as any).id}`;
  return `ip:${req.ip}`;
}

export function rateLimiterMiddleware(req: Request, res: Response, next: NextFunction) {
  const cfg = day2Config.rateLimiter;
  const key = keyForReq(req);
  const now = Date.now();
  const windowMs = cfg.windowMs;

  const tier = (req.user && (req.user as any).tier) || 'FREE';
  const tierKey = tier.toLowerCase();
  const limit = (cfg as any)[tierKey]?.max ?? cfg.free.max;

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
