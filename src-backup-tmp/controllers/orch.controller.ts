// src/controllers/orch.controller.ts
import { Request, Response } from "express";
import { getOrderedCandidates, Candidate } from "../services/scoring.service";
import { isOpen, recordFailure, recordSuccess } from "../lib/circuitBreaker";

/**
 * Orchestrator controller integrated with:
 * - scoring.service (model scoring / ordering)
 * - circuitBreaker (memory circuit breaker)
 *
 * Still uses the same simulated provider call but now uses meta-router + CB.
 */

type OrchRequestBody = {
  prompt?: string;
  userId?: string;
  timeoutMs?: number;
};

function delay(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

async function callSimulatedProvider(provider: string, model: string, prompt: string) {
  const env = process.env;
  const slowKey = `SLOW_PROVIDER_${provider.toUpperCase()}`;
  const slowMs = Number(env[slowKey] ?? 0);
  const failKey = `FAIL_PROVIDER_${provider.toUpperCase()}`;
  const shouldFail = (env[failKey] ?? "").toLowerCase() === "true";

  const baseLatency = provider === "openai" ? 200 : provider === "gemini" ? 350 : 250;
  const latency = baseLatency + slowMs + Math.floor(Math.random() * 150);
  await delay(latency);

  if (shouldFail) {
    const e: any = new Error(`${provider} simulated failure`);
    e.provider = provider;
    throw e;
  }

  return {
    text: `Simulated response from ${provider}/${model}. Prompt length ${prompt.length}`,
    meta: {
      latency,
      provider,
      model,
    },
  };
}

export async function orchHandler(req: Request, res: Response) {
  const body = req.body as OrchRequestBody;
  if (!body || !body.prompt || typeof body.prompt !== "string") {
    return res.status(400).json({ ok: false, error: "missing_prompt", message: "Missing 'prompt' in body." });
  }

  const prompt = body.prompt;
  const timeoutMs = typeof body.timeoutMs === "number" ? body.timeoutMs : 12000;

  // Fetch ordered candidates from scoring service (meta-router)
  const candidates = getOrderedCandidates();

  const start = Date.now();
  const errors: any[] = [];

  for (const c of candidates) {
    // Skip if circuit-breaker is open
    if (isOpen(c.provider)) {
      console.warn(`Skipping ${c.provider} because circuit is open.`);
      errors.push({ provider: c.provider, error: "circuit_open" });
      continue;
    }

    try {
      // Timeout wrapper per provider
      const resultPromise = callSimulatedProvider(c.provider, c.model, prompt);
      const timeoutPromise = new Promise((_r, rej) => setTimeout(() => rej(new Error("Operation timed out")), timeoutMs));
      const result = await Promise.race([resultPromise, timeoutPromise]) as any;

      // Success -> notify CB and return
      recordSuccess(c.provider);
      const latency = Date.now() - start;
      return res.json({ provider: c.provider, model: c.model, response: result, latency });
    } catch (err) {
      // Record failure in circuit-breaker and try next candidate
      console.warn(`Provider ${c.provider} failed, trying next. Error:`, (err as any)?.message || err);
      recordFailure(c.provider);
      errors.push({ provider: c.provider, error: (err as any)?.message || String(err) });
      continue;
    }
  }

  // If here, all providers failed or were skipped
  return res.status(502).json({ ok: false, error: "providers_unavailable", message: "All providers failed or are unavailable.", details: errors });
}

// provide named + default export
export const orchController = orchHandler;
export default orchHandler;