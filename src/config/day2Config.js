// src/config/day2Config.js
module.exports = {
  rateLimiter: {
    windowMs: 60_000, // 1 minute
    free: { max: 30 },
    paid: { max: 120 },
    pro: { max: 1000 },
  },
  dailyTokenBudget: {
    FREE: 2000,
    PAID: 20000,
    PRO: 100000,
  },
  wallet: {
    reserveTimeoutMs: 30_000
  },
  providerTimeoutMs: 8000,
  paywallMode: process.env.PAYWALL_MODE || 'hard'
};
