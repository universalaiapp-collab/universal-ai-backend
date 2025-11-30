// src/controllers/orch.controller.js
const { callOpenAI, callGemini } = require('../services/providerAdapters');
const walletService = require('../services/wallet.service');
const metricsService = require('../services/metrics.service');
const day2Config = require('../config/day2Config');

function callProviderWithTimeout(providerFn, prompt, opts, timeoutMs) {
  return new Promise((resolve, reject) => {
    let finished = false;
    const timer = setTimeout(() => {
      if (finished) return;
      finished = true;
      reject(new Error('provider_timeout'));
    }, timeoutMs);

    providerFn(prompt, opts)
      .then(r => { if (finished) return; finished = true; clearTimeout(timer); resolve(r); })
      .catch(err => { if (finished) return; finished = true; clearTimeout(timer); reject(err); });
  });
}

async function orchController(req, res) {
  const user = req.user;
  const prompt = (req.body && req.body.prompt) || '';
  const maxTokens = req.body && req.body.maxTokens;
  const fallbackOrder = (req.body && req.body.fallbackOrder) || ['openai', 'gemini'];
  const forceFail = req.body && req.body.forceFail;

  const estTokens = req.estimatedTokens || Math.ceil((prompt.length || 0) / 4) + (maxTokens || 100);
  const costPerToken = 0.00001;
  const estCost = estTokens * costPerToken;

  const reserveResp = await walletService.reserveCredits(user.id, estCost);
  if (!reserveResp.success) {
    return res.status(402).json({ ok: false, error: 'insufficient_credits', message: 'Not enough credits. Please top up.' });
  }

  try {
    let lastErr = null;
    for (const provider of fallbackOrder) {
      try {
        const opts = { maxTokens, forceFail };
        const timeoutMs = day2Config.providerTimeoutMs;
        const resp = provider === 'openai'
          ? await callProviderWithTimeout(callOpenAI, prompt, opts, timeoutMs)
          : await callProviderWithTimeout(callGemini, prompt, opts, timeoutMs);

        const totalTokens = resp.promptTokens + resp.completionTokens;
        const charged = totalTokens * costPerToken;

        await walletService.finalizeDeduction(user.id, charged, { provider: resp.provider, model: resp.model });

        await metricsService.recordMetrics({
          userId: user.id,
          provider: resp.provider,
          model: resp.model,
          promptTokens: resp.promptTokens,
          completionTokens: resp.completionTokens,
          totalTokens,
          estCost
        });

        return res.json({
          ok: true,
          message: 'success',
          provider: resp.provider,
          model: resp.model,
          tokens: { promptTokens: resp.promptTokens, completionTokens: resp.completionTokens, totalTokens },
          costCharged: charged,
          text: resp.text
        });
      } catch (err) {
        lastErr = err;
        // continue to next provider
      }
    }

    // all providers failed
    await walletService.refundReserved(user.id, estCost, 'provider_failure_refund');
    return res.status(502).json({ ok: false, error: 'provider_failure', message: lastErr && lastErr.message || 'All providers failed' });
  } catch (err) {
    await walletService.refundReserved(user.id, estCost, 'unexpected_error_refund');
    return res.status(500).json({ ok: false, error: 'internal_error', message: err.message });
  }
}

module.exports = { orchController };
