// src/utils/costEstimator.ts
// Exports named 'estimateCost' and default to avoid importer mismatch.

export function estimateCost(modelKey: string, tokens: number): number {
  const globalAny = (global as any) as any;
  const costMap = (globalAny.GLOBAL?.cost?.costPer1KTokens as any) ?? {
    "openai-primary": 0.02,
    gemini: 0.015,
    "gpt-4o-mini": 0.03,
    "dev-stub": 0.01,
  };

  const per1k = (costMap as any)[modelKey] ?? 0.01;
  const cost = (tokens / 1000) * per1k;
  return Number(cost.toFixed(6));
}

export default estimateCost;
