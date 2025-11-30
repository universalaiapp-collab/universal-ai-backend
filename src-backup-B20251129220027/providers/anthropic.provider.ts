// src/providers/anthropic.provider.ts
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

const PROVIDER = "anthropic";

async function anthropicChat(args: ChatArgs): Promise<any> {
  const ENABLE_FAKE = String(process.env.ENABLE_FAKE_PROVIDERS || "false") === "true";
  const model = args.model || process.env.CLAUDE_MODEL || "claude-3-haiku-20240307";

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

  const apiKey = args.bearerToken || process.env.ANTHROPIC_API_KEY;
  const url = process.env.CLAUDE_API_URL || "https://api.anthropic.com/v1/messages";

  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is missing");
  }

  // Convert incoming messages into a suitable Anthropic payload
  // Anthropic expects a message array or single prompt depending on endpoint
  let prompt = "";
  if (args.messages && args.messages.length) {
    prompt = args.messages.map(m => `${m.role}: ${m.content}`).join("\n");
  } else if (typeof args.input === "string") {
    prompt = args.input;
  }

  // Example payload for Anthropic (adjust if your actual wrapper expects something else)
  const payload: any = {
    model,
    messages: [{ role: "user", content: prompt }],
    temperature: args.temperature ?? 0.2,
  };

  try {
    const res = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      timeout: Number(process.env.AI_TIMEOUT_MS || 120000),
    });

    const data = res.data;
    const text = data?.completion || data?.output || JSON.stringify(data).slice(0, 2000);

    return {
      success: true,
      provider: PROVIDER,
      model,
      type: "text",
      output: text,
      raw: data,
      simulated: false,
    };
  } catch (err: any) {
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
  anthropicChat,
};
