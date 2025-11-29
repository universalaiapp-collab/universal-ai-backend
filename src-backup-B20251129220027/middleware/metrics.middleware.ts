// src/middleware/metrics.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { recordMetric } from '../services/metrics.service';

export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  // instrument send to capture status
  const originalSend = res.send.bind(res);
  // attach helper
  (res.locals as any).recordProviderMetric = (payload: any) => {
    const latency = Date.now() - start;
    recordMetric({
      timestamp: Date.now(),
      route: req.originalUrl,
      provider: payload.provider,
      success: payload.success,
      latencyMs: payload.latencyMs ?? latency,
      retryCount: payload.retryCount,
      statusCode: payload.statusCode ?? res.statusCode,
      errorMessage: payload.errorMessage,
      routingMeta: payload.routingMeta,
    });
  };

  // continue
  res.send = function patchedSend(body?: any) {
    // optionally log total req latency
    const total = Date.now() - start;
    // small metric for route itself
    recordMetric({
      timestamp: Date.now(),
      route: req.originalUrl,
      provider: undefined,
      success: res.statusCode < 500,
      latencyMs: total,
      retryCount: undefined,
      statusCode: res.statusCode,
      errorMessage: undefined,
      routingMeta: undefined,
    });
    return originalSend(body);
  };

  next();
}
