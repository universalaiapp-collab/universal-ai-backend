// src/middleware/quota.middleware.js
const day2Config = require('../config/day2Config');
const UserModel = require('../models/user.model'); // simple stub

function estimateTokens(prompt = '', maxTokens) {
  const promptEstimate = Math.ceil((prompt.length || 0) / 4);
  const completionEstimate = maxTokens || 100;
  return promptEstimate + completionEstimate;
}

async function quotaMiddleware(req, res, next) {
  const user = req.user;
  if (!user) return res.status(401).json({ ok: false, message: 'Unauthenticated' });

  const dailyLimits = day2Config.dailyTokenBudget;
  const tier = (user.tier || 'FREE').toUpperCase();
  const dailyLimit = dailyLimits[tier] || dailyLimits.FREE;

  let used = 0;
  try {
    const doc = await UserModel.findOne({ email: user.id }).lean();
    used = (doc && doc.dailyTokensUsed) || 0;
  } catch (e) {
    used = 0;
  }

  const prompt = req.body && req.body.prompt || '';
  const est = estimateTokens(prompt, req.body && req.body.maxTokens);

  if (used + est > dailyLimit) {
    res.setHeader('X-DailyLimit', String(dailyLimit));
    return res.status(402).json({
      ok: false,
      error: 'daily_token_budget_exceeded',
      message: 'Daily token budget exceeded — upgrade or wait until tomorrow',
      dailyLimit,
      used,
      estimatedRequired: est
    });
  }

  req.estimatedTokens = est;
  return next();
}

module.exports = quotaMiddleware;
