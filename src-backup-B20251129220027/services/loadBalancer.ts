// src/services/loadBalancer.ts
import { getProviderStates, isProviderDown } from '../utils/circuitBreaker';

type ProviderScore = {
  name: string;
  score: number; // higher = better
  reasons?: string[];
};

const LATENCY_PENALTY_PER_MS = 0.0005; // small penalty per ms
const DOWN_PENALTY = 1000; // large penalty if down

/** compute provider scores using lastLatencyMs and failure counts */
export function computeProviderScores(providerNames: string[]): ProviderScore[] {
  const states = getProviderStates();
  const stateMap = new Map(states.map((s: any) => [s.name, s]));

  const scores: ProviderScore[] = providerNames.map((name) => {
    const s: any = stateMap.get(name) || {};
    let base = 100; // base score
    const reasons: string[] = [];

    if (isProviderDown(name)) {
      base -= DOWN_PENALTY;
      reasons.push('DOWN');
    }

    const latency = s.lastLatencyMs ?? 200; // assume 200ms default if unknown
    const latencyPenalty = latency * LATENCY_PENALTY_PER_MS;
    base -= latencyPenalty;
    if (latencyPenalty > 5) reasons.push(`latency:${Math.round(latency)}ms`);

    const recentFailures = (s.failures || []).length;
    base -= recentFailures * 10;
    if (recentFailures) reasons.push(`failures:${recentFailures}`);

    return { name, score: Math.max(-10000, base), reasons };
  });

  // sort descending by score
  scores.sort((a, b) => b.score - a.score);
  return scores;
}

/** pick best provider name from list */
export function pickBestProvider(providerNames: string[]) {
  const scores = computeProviderScores(providerNames);
  return scores[0];
}
