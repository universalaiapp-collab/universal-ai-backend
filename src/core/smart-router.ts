import { OpenAIAdapter } from "../providers/openai.adapter";
import { AnthropicAdapter } from "../providers/anthropic.adapter";
import { GoogleAdapter } from "../providers/google.adapter";
import { MetaAdapter } from "../providers/meta.adapter";

type ProviderKey = "openai" | "anthropic" | "google" | "meta";

export interface RouterDecision {
  provider: ProviderKey;
  reason: string;
  estimatedCost?: number;
}

export function createProviders() {
  return {
    openai: new OpenAIAdapter(process.env.OPENAI_API_KEY || "", process.env.OPENAI_BASE),
    anthropic: new AnthropicAdapter(process.env.ANTHROPIC_API_KEY || "", process.env.ANTHROPIC_BASE),
    google: new GoogleAdapter(process.env.GOOGLE_API_KEY || "", process.env.GOOGLE_BASE),
    meta: new MetaAdapter(process.env.META_API_KEY || "", process.env.META_BASE),
  };
}

export async function decideProvider(taskType: string, payload: any): Promise<RouterDecision> {
  const providers = createProviders();

  if (taskType === "image") {
    if (providers.google) return { provider: "google", reason: "image task -> google generative", estimatedCost: 0 };
    if (providers.meta) return { provider: "meta", reason: "image fallback -> meta", estimatedCost: 0 };
  }

  const estimates: { key: ProviderKey; cost: number }[] = [];
  for (const k of Object.keys(providers) as ProviderKey[]) {
    try {
      const p: any = (providers as any)[k];
      const est = p && typeof p.estimateCost === "function" ? p.estimateCost(payload) : Number.MAX_SAFE_INTEGER;
      estimates.push({ key: k, cost: est });
    } catch {
      // ignore provider if estimator fails
    }
  }

  if (estimates.length === 0) {
    // fallback to openai
    return { provider: "openai", reason: "no estimates available - fallback to openai", estimatedCost: 0 };
  }

  estimates.sort((a, b) => a.cost - b.cost);
  const chosen = estimates[0];
  return {
    provider: chosen.key,
    reason: `lowest estimated cost (${chosen.cost})`,
    estimatedCost: chosen.cost,
  };
}
