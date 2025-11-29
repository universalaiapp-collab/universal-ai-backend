import { MetricsModel } from "../models/metrics";

export async function writeMetric(payload: any) {
  try {
    // simple shape normalization
    const doc = {
      timestamp: payload.timestamp ?? new Date(),
      route: payload.route ?? null,
      provider: payload.provider ?? null,
      userId: payload.userId ?? null,
      durationMs: payload.durationMs ?? payload.duration ?? null,
      statusCode: payload.statusCode ?? (payload.status === "ok" ? 200 : 500),
      errorMessage: payload.errorMessage ?? null,
      meta: payload.meta ?? null,
    };
    await MetricsModel.create(doc);
  } catch (e) {
    // never throw from metrics writer
    // eslint-disable-next-line no-console
    console.warn("writeMetric failed", e);
  }
}
