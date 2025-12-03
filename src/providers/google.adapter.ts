import fetch from "node-fetch";

export interface ProviderResponse {
  success: boolean;
  data?: any;
  error?: any;
  costEstimate?: number;
}

export class GoogleAdapter {
  private apiKey: string;
  private base: string;

  constructor(apiKey: string, base = process.env.GOOGLE_BASE || "https://generativelanguage.googleapis.com/v1") {
    this.apiKey = apiKey;
    this.base = base;
  }

  async callChat(payload: { model: string; messages: any[]; max_tokens?: number }): Promise<ProviderResponse> {
    // Lightweight placeholder implementation
    return { success: false, error: "google_callChat_not_implemented" };
  }

  async callImage(_payload: { prompt: string; size?: string }): Promise<ProviderResponse> {
    // Not implemented (stub)
    return { success: false, error: "google_image_not_implemented" };
  }

  estimateCost(_payload: { model: string; messages: any[]; max_tokens?: number }) {
    return 0;
  }
}

export const googleAdapter = new GoogleAdapter(process.env.GOOGLE_API_KEY || "", process.env.GOOGLE_BASE);
