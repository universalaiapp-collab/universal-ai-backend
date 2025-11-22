// src/services/metrics.service.ts
import MetricsModel from '../models/metrics.model';

export async function recordMetrics(doc: {
  userId: string; provider: string; model: string; promptTokens: number;
  completionTokens: number; totalTokens: number; estCost?: number; meta?: any;
}) {
  return MetricsModel.create(doc);
}

export async function queryMetrics(query: any = {}, limit = 100) {
  return MetricsModel.find(query).sort({ createdAt: -1 }).limit(limit).lean();
}
