// src/config/day2Config.ts
export default {
  rateLimiter: {
    windowMs: 60_000, // 1 minute window
    free: { max: 30 },   // requests/min for FREE tier
    paid: { max: 120 },  // requests/min for PAID tier
    pro: { max: 1000 },  // requests/min for PRO tier
  },
  dailyTokenBudget: {
    FREE: 2000,
    PAID: 20000,
    PRO: 100000,
  },
  wallet: {
    reserveTimeoutMs: 30_000 // time to wait before final deduction
  },
  providerTimeoutMs: 8000, // per-provider call timeout if not provided by client
  paywallMode: process.env.PAYWALL_MODE || 'hard' // 'hard' | 'soft'
} as const;
