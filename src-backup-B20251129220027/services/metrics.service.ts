/**
 * src/services/metrics.service.ts
 * Mongo-persisting metrics service
 *
 * NOTE: adjust MONGO_URL / MONGO_DB via env (.env).
 */
import { getDb } from "../lib/mongo";

export type MetricRecord = {
  timestamp: number; // epoch ms
  route: string;
  provider?: string;
  success: boolean;
  latencyMs?: number;
  retryCount?: number;
  statusCode?: number;
  errorMessage?: string;
  routingMeta?: any;
};

const METRICS_BUF: MetricRecord[] = [];
const METRICS_FLUSH_SIZE = 100;

/**
 * recordMetric(metric)
 */
export function recordMetric(metric: MetricRecord) {
  METRICS_BUF.push(metric);

  try {
    console.info(
      "[METRIC]",
      metric.route ?? "unknown",
      "provider=" + (metric.provider ?? "none"),
      "success=" + String(metric.success),
      "latency=" + (typeof metric.latencyMs !== "undefined" ? String(metric.latencyMs) : "n/a"),
      "retry=" + (typeof metric.retryCount !== "undefined" ? String(metric.retryCount) : "n/a")
    );
  } catch (e) {
    // swallow logging errors
  }

  if (METRICS_BUF.length >= METRICS_FLUSH_SIZE) {
    void flushMetrics().catch((err) => {
      console.error("[METRICS] flush error", err);
    });
  }
}

/**
 * flushMetrics() - persists the in-memory buffer to MongoDB
 */
export async function flushMetrics(): Promise<void> {
  if (!METRICS_BUF.length) return;

  // Copy and empty buffer immediately to avoid blocking
  const copy = METRICS_BUF.splice(0, METRICS_BUF.length);

  try {
    const db = await getDb();
    const coll = db.collection("metrics");
    // Convert epoch -> Date for db stored timestamp
    const docs = copy.map((m) => ({
      ...m,
      timestamp: new Date(m.timestamp), // store as Date
    }));
    // insertMany with ordered: false to be resilient
    await coll.insertMany(docs, { ordered: false });
    console.info(`[METRICS] Flushed ${docs.length} metrics -> MongoDB`);
  } catch (err) {
    // In case of DB errors, push the copy back to buffer start (best-effort)
    try {
      METRICS_BUF.unshift(...copy);
    } catch (e) {
      // if rebuffer fails, log and drop (we don't want to crash)
      console.error("[METRICS] failed to rebuffer after DB error", e);
    }
    console.error("[METRICS] persist error", err);
  }
}

/**
 * queryMetrics(q, limit)
 * When running against DB, this will read from the metrics collection.
 * This function retains in-memory behavior if DB isn't available.
 */
export async function queryMetrics(q: string, limit = 100) {
  const key = q ? q.trim().toLowerCase() : "";

  try {
    const db = await getDb();
    const coll = db.collection("metrics");
    const filter: any = {};
    if (key) {
      // simple OR search over common fields
      filter.$or = [
        { route: { $regex: key, $options: "i" } },
        { provider: { $regex: key, $options: "i" } },
        { errorMessage: { $regex: key, $options: "i" } },
      ];
      const maybeNum = Number(key);
      if (!Number.isNaN(maybeNum)) {
        filter.$or.push({ statusCode: maybeNum });
      }
    }
    const docs = await coll.find(filter).sort({ timestamp: -1 }).limit(limit).toArray();
    return docs;
  } catch (err) {
    // fallback to in-memory search when DB isn't available
    const matched = (METRICS_BUF || []).filter((metric) => {
      try {
        if (!key) return true;
        if (metric.route && metric.route.toLowerCase().includes(key)) return true;
        if (metric.provider && metric.provider.toLowerCase().includes(key)) return true;
        if (metric.errorMessage && metric.errorMessage.toString().toLowerCase().includes(key)) return true;
        if (metric.statusCode && String(metric.statusCode) === key) return true;
        return false;
      } catch (e) {
        return false;
      }
    });
    return matched.slice(0, limit);
  }
}

/** peekMetricsBuffer — useful for debugging / admin */
export function peekMetricsBuffer() {
  return METRICS_BUF.slice(-500).reverse();
}
