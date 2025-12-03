import fetch from "node-fetch";

export interface ProviderResponse {
  success: boolean;
  data?: any;
  error?: any;
  costEstimate?: number;
}

export class MetaAdapter {
  private apiKey: string;
  private base: string;

  constructor(apiKey: string, base = process.env.META_BASE || "https://api.meta.ai") {
    this.apiKey = apiKey;
    this.base = base;
  }

  async callChat(payload: { model: string; messages: any[]; max_tokens?: number }): Promise<ProviderResponse> {
    // Lightweight placeholder implementation
    return { success: false, error: "meta_callChat_not_implemented" };
  }

  async callImage(_payload: { prompt: string; size?: string }): Promise<ProviderResponse> {
    // Not implemented (stub)
    return { success: false, error: "meta_image_not_implemented" };
  }

  estimateCost(_payload: { model: string; messages: any[]; max_tokens?: number }) {
    return 0;
  }
}

export const metaAdapter = new MetaAdapter(process.env.META_API_KEY || "", process.env.META_BASE);
