// src/providers/openai.ts
import axios from "axios";
import { ProviderConfig } from "../config/providers";

export async function callOpenAI(
  config: ProviderConfig,
  messages: { role: string; content: string }[],
  timeoutMs = 30000
) {
  if (!config.apiKey) throw new Error("OpenAI API key not configured");
  const url = "https://api.openai.com/v1/chat/completions";

  const body = {
    model: config.model || "gpt-4o-mini",
    messages: messages.map(m => ({ role: m.role, content: m.content })),
    max_tokens: 800,
  };

  const res = await axios.post(url, body, {
    timeout: timeoutMs,
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
  });

  // normalize output
  const text =
    res?.data?.choices?.[0]?.message?.content ?? String(res?.data ?? "");
  const usage = res?.data?.usage ?? null;
  return {
    provider: "openai",
    raw: res.data,
    text,
    usage,
  };
}
