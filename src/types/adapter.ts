export interface AdapterResponse {
  success: boolean;
  provider: string;
  model?: string;
  requestId?: string | null;
  data?: any; // usually { text: string, tokens?: number, raw?: any }
  error?: { message: string; code?: string; details?: any } | null;
}
