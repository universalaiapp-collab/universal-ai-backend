import express from 'express';
import { openaiAdapter } from '../providers/openai.adapter';
import { cacheResponse } from '../middleware/cache';

const router = express.Router();

/**
 * Example AI generate route — uses cache and ensures unified adapter output.
 */
router.post('/generate', cacheResponse(), async (req, res) => {
  const prompt = req.body?.prompt || req.query?.prompt;
  if (!prompt) return res.status(400).json({ error: 'missing prompt' });

  const model = req.body?.model || process.env.OPENAI_MODEL || 'gpt-4o';
  const result = await openaiAdapter(prompt, { model });

  // Ensure consistent HTTP mapping:
  if (!result.success) {
    return res.status(502).json(result);
  }
  return res.json(result);
});

export default router;
