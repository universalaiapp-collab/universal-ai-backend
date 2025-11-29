// src/utils/costEstimator.ts
import GLOBAL from "../config/globalConfig";

/**
 * estimateCost(modelKey, totalTokens)
 * - modelKey: key from GLOBAL.cost.costPer1KTokens (e.g. "openai-primary")
 * - totalTokens: integer
 *
 * Returns number (cost in same currency units used in GLOBAL config, placeholder)
 */
export const estimateCost = (modelKey: string, totalTokens: number) => {
  const per1k = GLOBAL.cost?.costPer1KTokens?.[modelKey] ?? 0.01;
  const cost = per1k * (totalTokens / 1000);
  return cost;
};

export default estimateCost;
