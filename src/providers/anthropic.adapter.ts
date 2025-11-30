import fetch from "node-fetch";
import { retryWithBackoff } from "../utils/retry-wrapper";
import { ProviderResponse } from "./openai.adapter";

export class AnthropicAdapter {
  private apiKey: string;
  private base: string;

  constructor(apiKey: string, base = process.env.ANTHROPIC_BASE || "https://api.anthropic.com") {
    this.apiKey = apiKey;
    this.base = base;
  }

  async callChat(payload: { model: string; messages: any[]; max_tokens?: number }): Promise<ProviderResponse> {
    const url = `${this.base}/v1/complete`;
    try {
      const result = await retryWithBackoff(async () => {
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": this.apiKey,
          },
          body: JSON.stringify({
            model: payload.model,
            prompt: payload.messages.map(m => (m.role === "user" ? m.content : "")).join("\n"),
            max_tokens: payload.max_tokens || 512,
          }),
        });
        if (!res.ok) {
          const text = await res.text();
          const error = new Error(`Anthropic error ${res.status}: ${text}`);
          (error as any).status = res.status;
          throw error;
        }
        return res.json();
      }, { retries: 4, initialDelayMs: 250 });

      return { success: true, data: result, costEstimate: this.estimateCost(payload) };
    } catch (err) {
      return { success: false, error: (err as any)?.message || err };
    }
  }

  estimateCost(payload: { model: string; messages: any[]; max_tokens?: number }) {
    const chars = payload.messages.map(m => m.content || "").join("").length;
    const tokens = Math.ceil(chars / 4) + (payload.max_tokens || 0);
    // crude rate
    const ratePerToken = 0.000025;
    return tokens * ratePerToken;
  }
}
