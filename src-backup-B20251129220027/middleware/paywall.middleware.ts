// src/middleware/paywall.middleware.ts
import { Request, Response, NextFunction } from 'express';
import day2Config from '../config/day2Config';

export function paywallMiddleware(req: Request, res: Response, next: NextFunction) {
  // This middleware expects that quota and wallet checks have already run.
  // If we want to centrally enforce behavior based on app.locals.paywallMode, do it here.
  const mode = process.env.PAYWALL_MODE || (day2Config as any).paywallMode || 'hard';
  (req as any).paywallMode = mode;
  next();
}
