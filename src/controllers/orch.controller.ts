// src/controllers/orch.controller.ts
import { Request, Response } from 'express';
import { callOpenAI, callGemini } from '../services/providerAdapters';
import * as walletService from '../services/wallet.service';
import * as metricsService from '../services/metrics.service';
import day2Config from '../config/day2Config';

async function callProviderWithTimeout(providerFn: Function, prompt: string, opts: any, timeoutMs: number) {
  return new Promise<any>((resolve, reject) => {
    let finished = false;
    const timer = setTimeout(() => {
      if (finished) return;
      finished = true;
      reject(new Error('provider_timeout'));
    }, timeoutMs);

    providerFn(prompt, opts)
      .then((r: any) => { if (finished) return; finished = true; clearTimeout(timer); resolve(r); })
      .catch((err: any) => { if (finished) return; finished = true; clearTimeout(timer); reject(err); });
  });
}

export async function orchController(req: Request, res: Response) {
  const user = req.user as any;
  const prompt: string = req.body?.prompt || '';
  const maxTokens = req.body?.maxTokens;
  const fallbackOrder: string[] = req.body?.fallbackOrder || ['openai', 'gemini'];
  const forceFail = req.body?.forceFail; // for tests

  const estTokens = (req as any).estimatedTokens || Math.ceil((prompt.length || 0) / 4) + (maxTokens || 100);
  const costPerToken = 0.00001; // sample pricing; replace with your pricing calc
  const estCost = estTokens * costPerToken;

  // Reserve credits
  const reserveResp = await walletService.reserveCredits(user.id, estCost);
  if (!reserveResp.success) {
    return res.status(402).json({ ok: false, error: 'insufficient_credits', message: 'Not enough credits. Please top up.' });
  }
  let charged = 0;
  let usedMetrics: any = null;

  try {
    let lastErr: any = null;
    for (const provider of fallbackOrder) {
      try {
        const opts = { maxTokens, forceFail };
        const timeoutMs = day2Config.providerTimeoutMs;
        const resp = provider === 'openai'
          ? await callProviderWithTimeout(callOpenAI, prompt, opts, timeoutMs)
          : await callProviderWithTimeout(callGemini, prompt, opts, timeoutMs);

        const totalTokens = resp.promptTokens + resp.completionTokens;
        charged = totalTokens * costPerToken;

        // finalize deduction (may be different from estCost)
        await walletService.finalizeDeduction(user.id, charged, { provider: resp.provider, model: resp.model });

        // record metrics
        await metricsService.recordMetrics({
          userId: user.id,
          provider: resp.provider,
          model: resp.model,
          promptTokens: resp.promptTokens,
          completionTokens: resp.completionTokens,
          totalTokens,
          estCost
        });

        usedMetrics = { provider: resp.provider, model: resp.model, totalTokens, charged };
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

    // if we exit loop, all providers failed
    // refund reserved
    await walletService.refundReserved(user.id, estCost, 'provider_failure_refund');
    return res.status(502).json({ ok: false, error: 'provider_failure', message: lastErr?.message || 'All providers failed' });
  } catch (err) {
    // on unexpected error, refund reserved
    await walletService.refundReserved(user.id, estCost, 'unexpected_error_refund');
    return res.status(500).json({ ok: false, error: 'internal_error', message: err?.message || 'Internal error' });
  }
}
