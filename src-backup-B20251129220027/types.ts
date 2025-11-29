// src/types.ts
export interface ProviderResponse {
  success: boolean;
  data?: any;
  latencyMs: number;
  costTokens?: number;
  error?: string;
}

export type ProviderCall = (input: any) => Promise<ProviderResponse>;

export interface Provider {
  id: string;
  call: ProviderCall;
  baseCostTokens?: number;
}
