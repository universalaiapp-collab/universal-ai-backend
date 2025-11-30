// src/providers/gemini.ts
import axios from "axios";
import { ProviderConfig } from "../config/providers";

export async function callGemini(
  config: ProviderConfig,
  messages: { role: string; content: string }[],
  timeoutMs = 30000
) {
  if (!config.apiKey) throw new Error("Gemini API key not configured");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateText`;

  // Google generative API expects prompt in a different shape
  const prompt = messages.map(m => `${m.role}: ${m.content}`).join("\n");

  const body = {
    prompt: { text: prompt },
    // optional: temperature, max output tokens
    maxOutputTokens: 800,
  };

  const res = await axios.post(url, body, {
    timeout: timeoutMs,
    params: { key: config.apiKey },
    headers: {
      "Content-Type": "application/json",
    },
  });

  // Attempt to extract text (API shapes vary; adapt if needed)
  const text =
    res?.data?.candidates?.[0]?.content ??
    res?.data?.output?.[0]?.content ??
    JSON.stringify(res?.data ?? {});

  return {
    provider: "gemini",
    raw: res.data,
    text,
    usage: null,
  };
}
