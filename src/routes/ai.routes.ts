import express from "express";
import { openaiAdapter } from "../providers";
import { cacheResponse } from "../middleware/cache";

const router = express.Router();

/**
 * POST /api/v1/generate
 * body: { prompt: string, model?: string }
 */
router.post("/generate", cacheResponse(), async (req, res) => {
  const prompt = req.body?.prompt || req.query?.prompt;
  if (!prompt) return res.status(400).json({ error: "missing prompt" });

  const model = req.body?.model || process.env.OPENAI_MODEL || "gpt-4o-mini";

  try {
    // Use adapter.callChat to send a messages array
    const messages = [{ role: "user", content: prompt }];
    const result = await openaiAdapter.callChat({ model, messages, max_tokens: 800 });

    if (!result.success) { console.error('Provider error:', JSON.stringify(result.error || result, null, 2));
      return res.status(502).json({ ok: false, error: result.error });
    }

    // Normalized response
    return res.json({
      ok: true,
      provider: "openai-adapter",
      model,
      data: result.data,
      costEstimate: result.costEstimate ?? null
    });
  } catch (err) {
    console.error("AI generate error:", err);
    return res.status(500).json({ ok: false, error: String(err) });
  }
});

export default router;

