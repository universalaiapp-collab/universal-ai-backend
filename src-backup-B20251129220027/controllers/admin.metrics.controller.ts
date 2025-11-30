import { Request, Response } from "express";
import { getDb } from "../lib/mongo";

/**
 * GET /admin/metrics?q=...&limit=100
 */
export async function getMetrics(req: Request, res: Response) {
  try {
    const q = (req.query.q as string) || "";
    const limit = Number(req.query.limit) || 100;
    const db = await getDb();
    const coll = db.collection("metrics");
    const filter: any = {};
    if (q && q.trim()) {
      const key = q.trim();
      filter.$or = [
        { route: { $regex: key, $options: "i" } },
        { provider: { $regex: key, $options: "i" } },
        { errorMessage: { $regex: key, $options: "i" } }
      ];
      const maybeNum = Number(key);
      if (!Number.isNaN(maybeNum)) filter.$or.push({ statusCode: maybeNum });
    }
    const docs = await coll.find(filter).sort({ timestamp: -1 }).limit(limit).toArray();
    res.json({ ok: true, count: docs.length, metrics: docs });
  } catch (err) {
    console.error("[ADMIN/METRICS] error", err);
    res.status(500).json({ ok: false, error: "server_error" });
  }
}

/**
 * DELETE /admin/metrics?confirm=yes
 * - Requires requireAdmin middleware (protects /admin routes)
 */
export async function clearMetrics(req: Request, res: Response) {
  try {
    const confirm = (req.query.confirm as string) || "";
    if (confirm !== "yes") {
      return res.status(400).json({
        ok: false,
        error: "confirmation_required",
        message: "To delete metrics, call DELETE /admin/metrics?confirm=yes"
      });
    }

    const db = await getDb();
    const coll = db.collection("metrics");
    const result = await coll.deleteMany({});
    console.info(`[ADMIN/METRICS] cleared metrics, deletedCount=${result.deletedCount ?? 0}`);
    res.json({ ok: true, deleted: result.deletedCount ?? 0 });
  } catch (err) {
    console.error("[ADMIN/METRICS] clear error", err);
    res.status(500).json({ ok: false, error: "server_error" });
  }
}
