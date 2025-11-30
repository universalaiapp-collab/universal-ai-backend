// src/engine/router.ts
import { PROVIDERS } from "../config/providers";
import { callOpenAI } from "../providers/openai";
import { callGemini } from "../providers/gemini";
import { writeMetric } from "../lib/metrics"; // adapt to your existing metric writer

type Message = { role: string; content: string };

async function tryProviderWithRetries(
  providerKey: string,
  messages: Message[],
  timeoutMs = 30000,
  retries = 2
) {
  const cfg = PROVIDERS[providerKey];
  if (!cfg || !cfg.enabled) throw new Error(`${providerKey} disabled`);

  let lastErr: any = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (providerKey === "openai") {
        return await callOpenAI(cfg, messages, timeoutMs);
      } else if (providerKey === "gemini") {
        return await callGemini(cfg, messages, timeoutMs);
      } else {
        throw new Error("Unknown provider");
      }
    } catch (err: any) {
      lastErr = err;
      // quick backoff
      await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
      // continue to retry
    }
  }
  throw lastErr;
}

export async function smartRoute(messages: Message[], userId: string) {
  // provider priority: prefer openai then gemini (adjust weights later)
  const order = ["openai", "gemini"].filter(k => PROVIDERS[k]?.enabled);

  const tried: string[] = [];
  let finalResult: any = null;

  for (const key of order) {
    tried.push(key);
    try {
      const start = Date.now();
      const resp = await tryProviderWithRetries(key, messages, 30000, 2);
      const duration = Date.now() - start;

      // write metric (adapt fields)
      await writeMetric({
        route: "/api/v1/chat",
        provider: key,
        userId,
        duration,
        status: "ok",
        errorMessage: null,
        meta: { tokens: resp.usage ?? null, providerRaw: resp.raw ?? null },
      });

      finalResult = {
        provider: key,
        text: resp.text,
        tried,
      };
      break; // success
    } catch (err: any) {
      // log metric for failure
      await writeMetric({
        route: "/api/v1/chat",
        provider: key,
        userId,
        duration: null,
        status: "error",
        errorMessage: String(err.message ?? err),
        meta: { tried },
      });
      // continue to next provider
    }
  }

  if (!finalResult) {
    throw new Error(`All providers failed: ${JSON.stringify(tried)}`);
  }

  return finalResult;
}
