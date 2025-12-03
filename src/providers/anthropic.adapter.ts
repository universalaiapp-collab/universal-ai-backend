import fetch from "node-fetch";

export interface ProviderResponse {
  success: boolean;
  data?: any;
  error?: any;
  costEstimate?: number;
}

export class AnthropicAdapter {
  private apiKey: string;
  private base: string;

  constructor(apiKey: string, base = process.env.ANTHROPIC_BASE || "https://api.anthropic.com") {
    this.apiKey = apiKey;
    this.base = base;
  }

  async callChat(payload: { model: string; messages: any[]; max_tokens?: number }): Promise<ProviderResponse> {
    // Lightweight placeholder implementation
    return { success: false, error: "anthropic_callChat_not_implemented" };
  }

  async callImage(_payload: { prompt: string; size?: string }): Promise<ProviderResponse> {
    // Not implemented (stub)
    return { success: false, error: "anthropic_image_not_implemented" };
  }

  estimateCost(_payload: { model: string; messages: any[]; max_tokens?: number }) {
    return 0;
  }
}

export const anthropicAdapter = new AnthropicAdapter(process.env.ANTHROPIC_API_KEY || "", process.env.ANTHROPIC_BASE);
