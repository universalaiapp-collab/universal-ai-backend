import express from "express";
import { decideProvider, createProviders } from "../core/smart-router";

const router = express.Router();

/**
 * POST /api/image
 * body: { prompt: string, size?: string, style?: string }
 */
router.post("/", async (req, res) => {
  const { prompt, size = "1024x1024", style } = req.body || {};
  if (!prompt) return res.status(400).json({ ok: false, error: "missing_prompt" });

  try {
    // ask router for the best provider for image tasks
    const decision = await decideProvider("image", { prompt, size, style });
    const providers = createProviders();
    const adapter: any = (providers as any)[decision.provider];

    // helper: if provider implements callImage, use it; else fallback to callChat with an image instruction
    if (adapter && typeof adapter.callImage === "function") {
      const result = await adapter.callImage({ prompt, size });
      if (!result.success) return res.status(502).json({ ok: false, error: result.error, decision });
      return res.json({ ok: true, decision, image: result.data });
    } else if (adapter && typeof adapter.callChat === "function") {
      // fallback: use text->image style prompt (less ideal, but keeps flow working)
      const systemPrompt = `You are an image generation assistant. Generate an image with this prompt: ${prompt} (size: ${size})`;
      const chatResult = await adapter.callChat({ model: "gpt-4o-mini", messages: [{ role: "system", content: systemPrompt }] });
      if (!chatResult.success) return res.status(502).json({ ok: false, error: chatResult.error, decision });
      return res.json({ ok: true, decision, imageFallback: chatResult.data });
    } else {
      return res.status(500).json({ ok: false, error: "no_image_adapter", decision });
    }
  } catch (err) {
    console.error("Image route error:", err);
    return res.status(500).json({ ok: false, error: "internal_error", message: (err as any)?.message });
  }
});

export default router;
