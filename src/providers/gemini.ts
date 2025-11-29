import axios from "axios";
import { ProviderConfig } from "../config/providers";

export async function callGemini(
  config: ProviderConfig,
  messages: { role: string; content: string }[],
  timeoutMs = 30000
) {
  if (!config.apiKey) {
    return {
      provider: "gemini",
      raw: null,
      text: "[mock] Gemini API key not set. Provide GOOGLE_API_KEY in .env for real calls.",
      usage: null,
    };
  }

  // Attempt to call Google Generative API (endpoint may vary by account)
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateText`;
  const prompt = messages.map(m => `${m.role}: ${m.content}`).join("\n");

  const body = {
    prompt: { text: prompt },
    maxOutputTokens: 800,
  };

  const res = await axios.post(endpoint, body, {
    timeout: timeoutMs,
    params: { key: config.apiKey },
    headers: { "Content-Type": "application/json" },
  });

  // try multiple likely response shapes
  const text =
    res?.data?.candidates?.[0]?.output ??
    res?.data?.candidates?.[0]?.content ??
    res?.data?.output?.[0]?.content ??
    JSON.stringify(res.data);

  return { provider: "gemini", raw: res.data, text, usage: null };
}
