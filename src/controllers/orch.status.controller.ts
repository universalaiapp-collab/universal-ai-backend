// src/controllers/orch.status.controller.ts
import { Request, Response } from 'express';
import { getProviderStates, isProviderDown } from '../utils/circuitBreaker';
import { computeProviderScores } from '../services/loadBalancer';

export function statusHandler(req: Request, res: Response) {
  const providerStates = getProviderStates();
  const names = providerStates.map((p: any) => p.name);
  const scores = computeProviderScores(names);

  const info = {
    appEnv: process.env.NODE_ENV || 'development',
    uptimeMs: process.uptime() * 1000,
    now: new Date().toISOString(),
    providers: providerStates,
    scores,
  };

  res.json(info);
}
