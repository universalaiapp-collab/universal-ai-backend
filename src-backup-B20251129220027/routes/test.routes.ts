// src/routes/test.routes.ts
import { Router } from 'express';
import geminiAdapter from '../adapters/gemini.adapter';

const router = Router();

/**
 * POST /test/gemini
 * Body: { prompt: "..." }
 * Calls gemini.adapter.callGemini and returns normalized result.
 * If Gemini API returns 404/401 (no key/ADC), return a helpful mock result instead.
 */
router.post('/gemini', async (req, res) => {
  try {
    const prompt = (req.body && req.body.prompt) || '';
    if (!prompt) return res.status(400).json({ ok: false, error: 'Missing prompt' });

    const result = await geminiAdapter.callGemini(prompt, {});
    return res.json({ ok: true, result });
  } catch (err: any) {
    console.error('test.routes /gemini error:', err);

    // If it's a 404/401 from remote API - likely missing key/ADC. Return a mock enabling local testing.
    const msg = (err?.message || String(err)).toLowerCase();
    if (msg.includes('404') || msg.includes('401') || msg.includes('unauthorized') || msg.includes('not found') || msg.includes('invalid')) {
      const mock = {
        choices: [{ text: `GEMINI-MOCK: ${((req.body && req.body.prompt) || '').slice(0, 300)}` }],
        usage: { total_tokens: Math.min(60, Math.ceil(((req.body && req.body.prompt) || '').length / 4)) },
        raw: { mocked: true, reason: msg },
      };
      return res.status(200).json({
        ok: true,
        note: 'Gemini returned an API error (likely missing API key or ADC). Returning a mock response to allow local testing.',
        mock,
        errorRaw: err?.message || String(err),
      });
    }

    // Otherwise return the error
    return res.status(err?.status || 500).json({ ok: false, error: err?.message || String(err) });
  }
});

export default router;
