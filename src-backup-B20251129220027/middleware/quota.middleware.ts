// src/middleware/quota.middleware.ts
import { Request, Response, NextFunction } from 'express';
import day2Config from '../config/day2Config';
import UserModel from '../models/user.model'; // OPTIONAL: adapt if you have a different user model

// Best-effort token estimator
function estimateTokens(prompt: string = '', maxTokens?: number) {
  const promptEstimate = Math.ceil((prompt.length || 0) / 4);
  const completionEstimate = maxTokens ?? 100;
  return promptEstimate + completionEstimate;
}

export async function quotaMiddleware(req: Request, res: Response, next: NextFunction) {
  const user = req.user as any;
  if (!user) return res.status(401).json({ ok: false, message: 'Unauthenticated' });

  const dailyLimits = day2Config.dailyTokenBudget;
  const tier = (user.tier || 'FREE').toUpperCase();
  const dailyLimit = (dailyLimits as any)[tier] ?? dailyLimits.FREE;

  // Fetch user's used tokens from user doc or a usage collection.
  // We try to read a 'dailyTokensUsed' field on the user doc; if not found, treat as 0.
  let used = 0;
  try {
    const doc = await UserModel.findById(user.id).lean();
    used = (doc && (doc as any).dailyTokensUsed) || 0;
  } catch (e) {
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
      message: 'Daily token budget exceeded â€” upgrade or wait until tomorrow',
      dailyLimit,
      used,
      estimatedRequired: est,
    });
  }

  // Attach estimation for controller to use for reservation
  (req as any).estimatedTokens = est;
  next();
}
