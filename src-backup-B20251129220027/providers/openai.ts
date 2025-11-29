import axios from "axios";
import { ProviderConfig } from "../config/providers";

export async function callOpenAI(
  config: ProviderConfig,
  messages: { role: string; content: string }[],
  timeoutMs = 30000
) {
  if (!config.apiKey) {
    // return a safe mock so server works without keys
    return {
      provider: "openai",
      raw: null,
      text: "[mock] OpenAI API key not set. Provide OPENAI_API_KEY in .env for real calls.",
      usage: null,
    };
  }

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

  const text = res?.data?.choices?.[0]?.message?.content ?? JSON.stringify(res.data);
  const usage = res?.data?.usage ?? null;
  return { provider: "openai", raw: res.data, text, usage };
}
