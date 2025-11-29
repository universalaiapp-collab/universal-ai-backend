// src/config/providers.ts
export type ProviderConfig = {
  enabled: boolean;
  apiKey?: string;
  model?: string;
  name: string;
};

export const PROVIDERS: Record<string, ProviderConfig> = {
  openai: {
    name: "openai",
    enabled: true,
    apiKey: process.env.OPENAI_API_KEY,
    model: "gpt-4o-mini", // change if needed
  },
  gemini: {
    name: "gemini",
    enabled: true,
    apiKey: process.env.GOOGLE_API_KEY,
    model: "gemini-1.5-flash",
  },
  // add others later
};
