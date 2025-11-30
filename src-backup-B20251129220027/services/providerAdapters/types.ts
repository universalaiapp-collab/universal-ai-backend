// src/services/providerAdapters/types.ts
export type AdapterResponse = {
  provider: string;
  model: string;
  text: string;
  promptTokens: number;
  completionTokens: number;
};
