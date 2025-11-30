// src/providers/groq.provider.ts
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

const PROVIDER = "groq";

async function groqChat(args: ChatArgs): Promise<any> {
  const ENABLE_FAKE = String(process.env.ENABLE_FAKE_PROVIDERS || "false") === "true";
  const model = args.model || process.env.GROQ_MODEL || "llama3-8b-8192";

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

  const apiKey = args.bearerToken || process.env.GROQ_API_KEY;
  const url = process.env.GROQ_API_URL || "https://api.groq.com/openai/v1/chat/completions";

  if (!apiKey) {
    throw new Error("GROQ_API_KEY is missing");
  }

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

    const data = res.data;
    const text = (data?.choices && data.choices[0]?.message?.content) || data?.output || JSON.stringify(data).slice(0, 2000);

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
  groqChat,
};
