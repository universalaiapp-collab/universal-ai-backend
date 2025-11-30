import express from "express";
import { decideProvider, createProviders } from "../core/smart-router";

const router = express.Router();

router.post("/chat", async (req, res) => {
  const { taskType = "chat", messages, model } = req.body || {};
  try {
    const decision = await decideProvider(taskType, { model, messages });
    const providers = createProviders();
    const adapter: any = (providers as any)[decision.provider];

    if (!adapter) return res.status(500).json({ ok: false, error: "Provider adapter missing" });

    const result = await adapter.callChat({ model: model || "gpt-4o-mini", messages, max_tokens: 800 });

    if (!result.success) {
      return res.status(502).json({ ok: false, error: result.error, decision });
    }
    return res.json({ ok: true, decision, response: result.data });
  } catch (err) {
    console.error("Chat route error:", err);
    return res.status(500).json({ ok: false, error: "internal_error", message: (err as any)?.message });
  }
});

export default router;
