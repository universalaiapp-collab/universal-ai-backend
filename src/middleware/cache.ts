/**
 * Simple in-memory cache middleware with TTL.
 * Not for production — replace with Redis in prod.
 */
import { Request, Response, NextFunction } from "express";
type CacheEntry = { value: any; expiresAt: number };

const cache = new Map<string, CacheEntry>();
const DEFAULT_TTL_MS = Number(process.env.CACHE_TTL_MS || 30000);

function makeCacheKey(req: Request) {
  const body = req.method === "GET" ? "" : JSON.stringify(req.body || {});
  return `${req.method}:${req.originalUrl}:${body}`;
}

export function cacheResponse(ttlMs = DEFAULT_TTL_MS) {
  return function (req: Request, res: Response, next: NextFunction) {
    const key = makeCacheKey(req);
    const entry = cache.get(key);
    if (entry && entry.expiresAt > Date.now()) {
      res.setHeader("x-cache", "HIT");
      return res.json(entry.value);
    }

    // create a newJson function and assign it (avoid inline 'as any' casting)
    const originalJson = res.json.bind(res) as (body: any) => Response;
    const newJson: any = function (body: any) {
      try {
        cache.set(key, { value: body, expiresAt: Date.now() + ttlMs });
        res.setHeader("x-cache", "MISS");
      } catch (err) {
        // swallow cache errors
      }
      return originalJson(body);
    };

    // assign the new json function
    (res as any).json = newJson;

    next();
  };
}

// cleanup
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of cache.entries()) {
    if (v.expiresAt <= now) cache.delete(k);
  }
}, 60000);
