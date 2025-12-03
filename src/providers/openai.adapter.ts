import fetch from "node-fetch";

export interface ProviderResponse {
  success: boolean;
  data?: any;
  error?: any;
  costEstimate?: number;
}

export class OpenAIAdapter {
  private apiKey: string;
  private base: string;

  constructor(apiKey: string, base = process.env.OPENAI_BASE || "https://api.openai.com/v1") {
    this.apiKey = apiKey;
    this.base = base;
  }

  /**
   * callChat - basic chat completion caller
   */
  async callChat(payload: { model: string; messages: any[]; max_tokens?: number }): Promise<ProviderResponse> {
    const url = `${this.base}/chat/completions`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      return { success: res.ok, data: json, costEstimate: this.estimateCost(payload) };
    } catch (err) {
      return { success: false, error: err };
    }
  }

  /**
   * callImage - uses OpenAI images endpoint (conservative payload)
   * Note: endpoint path may vary by provider; change if necessary.
   */
  async callImage(payload: { prompt: string; size?: string }): Promise<ProviderResponse> {
    const url = `${this.base}/images/generations`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          prompt: payload.prompt,
          size: payload.size || "1024x1024",
        }),
      });
      const json = await res.json();
      return { success: res.ok, data: json, costEstimate: 0 };
    } catch (err) {
      return { success: false, error: err };
    }
  }

  /**
   * estimateCost - crude estimator (tokens ~= chars/4)
   */
  estimateCost(payload: { model: string; messages: any[]; max_tokens?: number }) {
    try {
      const chars = Array.isArray(payload.messages) ? payload.messages.map((m: any) => m.content || "").join("").length : 0;
      const tokens = Math.ceil(chars / 4) + (payload.max_tokens || 0);
      const ratePerToken = (payload.model || "").includes("gpt-4") ? 0.00006 : 0.00002;
      return tokens * ratePerToken;
    } catch {
      return 0;
    }
  }
}

export const openAIAdapterInstance = new OpenAIAdapter(process.env.OPENAI_API_KEY || "", process.env.OPENAI_BASE);
