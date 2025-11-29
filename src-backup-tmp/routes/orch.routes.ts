// src/routes/orch.routes.ts
import express from 'express';
import { orchController } from '../controllers/orch.controller';
import { rateLimiterMiddleware } from '../middleware/rateLimiter.middleware';
import { quotaMiddleware } from '../middleware/quota.middleware';
import { paywallMiddleware } from '../middleware/paywall.middleware';

const router = express.Router();

router.post('/orch',
  // assume authentication middleware runs before and sets req.user
  rateLimiterMiddleware,
  quotaMiddleware,
  paywallMiddleware,
  orchController
);

export default router;
