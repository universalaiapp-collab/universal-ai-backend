// src/providers/openai.provider.ts
import axios from "axios";

type ChatArgs = {
  model: string;
  messages?: { role: string; content: string }[];
  input?: string | string[];
  temperature?: number;
  absoluteUrl?: string;
  bearerToken?: string;
  extra?: any;
};

const PROVIDER = "openai";

async function openaiChat(args: ChatArgs): Promise<any> {
  const ENABLE_FAKE = String(process.env.ENABLE_FAKE_PROVIDERS || "false") === "true";
  const model = args.model || process.env.OPENAI_MODEL || "gpt-4o-mini";

  if (ENABLE_FAKE) {
    return {
      success: true,
      provider: PROVIDER,
      model,
      type: "text",
      output: `Simulated response for provider ${PROVIDER} model ${model}`,
      raw: {},
      simulated: true,
    };
  }

  const apiKey = args.bearerToken || process.env.OPENAI_API_KEY;
  const url = process.env.OPENAI_API_URL || `https://api.openai.com/v1/chat/completions`;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is missing");
  }

  // Convert messages to provider payload
  const messages = args.messages ?? (typeof args.input === "string" ? [{ role: "user", content: args.input }] : []);

  const payload: any = {
    model,
    messages,
  };
  if (typeof args.temperature === "number") payload.temperature = args.temperature;

  try {
    const res = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      timeout: Number(process.env.AI_TIMEOUT_MS || 120000),
    });

    // Normalize response
    const text = (() => {
      // OpenAI chat completion may return choices[0].message.content
      const data = res.data;
      if (data?.choices && Array.isArray(data.choices) && data.choices[0]) {
        if (data.choices[0].message?.content) return data.choices[0].message.content;
        if (data.choices[0].text) return data.choices[0].text;
      }
      if (typeof data === "string") return data;
      return JSON.stringify(data).slice(0, 2000);
    })();

    return {
      success: true,
      provider: PROVIDER,
      model,
      type: "text",
      output: text,
      raw: res.data,
      simulated: false,
    };
  } catch (err: any) {
    // bubble up with normalised shape
    const message = err?.response?.data || err?.message || String(err);
    return {
      success: false,
      provider: PROVIDER,
      model,
      error: "Request failed",
      details: message,
    };
  }
}

export default {
  openaiChat,
};
