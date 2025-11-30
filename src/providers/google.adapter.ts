import fetch from "node-fetch";
import { retryWithBackoff } from "../utils/retry-wrapper";
import { ProviderResponse } from "./openai.adapter";

export class GoogleAdapter {
  private apiKey: string;
  private base: string;

  constructor(apiKey: string, base = process.env.GOOGLE_BASE || "https://generative.googleapis.com/v1") {
    this.apiKey = apiKey;
    this.base = base;
  }

  async callChat(payload: { model: string; messages: any[]; max_tokens?: number }): Promise<ProviderResponse> {
    const url = `${this.base}/models/${payload.model || "chat-bison"}/generate?key=${this.apiKey}`;
    try {
      const result = await retryWithBackoff(async () => {
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: payload.messages.map(m => (m.role === "user" ? m.content : "")).join("\n"),
            maxOutputTokens: payload.max_tokens || 512,
          }),
        });
        if (!res.ok) {
          const text = await res.text();
          const error = new Error(`Google generative error ${res.status}: ${text}`);
          (error as any).status = res.status;
          throw error;
        }
        return res.json();
      }, { retries: 3, initialDelayMs: 300 });

      return { success: true, data: result, costEstimate: this.estimateCost(payload) };
    } catch (err) {
      return { success: false, error: (err as any)?.message || err };
    }
  }

  estimateCost(payload: { model: string; messages: any[]; max_tokens?: number }) {
    const chars = payload.messages.map(m => m.content || "").join("").length;
    const tokens = Math.ceil(chars / 4) + (payload.max_tokens || 0);
    const ratePerToken = 0.000018;
    return tokens * ratePerToken;
  }
}
