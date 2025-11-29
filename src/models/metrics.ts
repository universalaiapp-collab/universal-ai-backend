/**
 * Minimal MetricsModel shim to prevent crashes when the real mongoose model
 * is not available during quick local runs. If you already have a Mongoose model,
 * replace this file with the real model.
 */
export const MetricsModel = {
  async create(doc: any) {
    try {
      // non-blocking: just log to console in local dev
      console.log("[MetricsModel.create]", JSON.stringify(doc));
      return doc;
    } catch (e) {
      console.warn("MetricsModel.create failed", e);
      return null;
    }
  }
};
