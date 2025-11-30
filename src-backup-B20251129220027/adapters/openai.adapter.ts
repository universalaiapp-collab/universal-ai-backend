// src/adapters/openai.adapter.ts
// Modern OpenAI Node.js SDK usage (v4+)
// Install: npm install openai

import OpenAI from "openai";

const key = process.env.OPENAI_API_KEY || "";
const client = new OpenAI({ apiKey: key });

/**
 * callOpenAI(prompt, opts)
 * - prompt: string
 * - opts: { model?, maxTokens?, temperature?, timeout? }
 *
 * Returns a response shaped similarly to the older SDK (choices + usage),
 * but note the new SDK returns a slightly different structure. We normalize minimally.
 */
export async function callOpenAI(prompt: string, opts: any = {}) {
  if (!prompt) throw new Error("openai.adapter: missing prompt");

  const model = opts.model || process.env.OPENAI_MODEL || "gpt-4o-mini";
  const max_tokens = opts.maxTokens ?? 512;
  const temperature = opts.temperature ?? 0.2;

  // If no API key provided, return a harmless mock (developer convenience)
  if (!key) {
    return {
      choices: [{ text: `OPENAI-MOCK: ${prompt.slice(0, 200)}` }],
      usage: { total_tokens: Math.min(50, Math.ceil(prompt.length / 4)) },
    };
  }

  // Use the chat completions endpoint
  // The current OpenAI JS SDK exposes client.chat.completions.create(...)
  const resp = await client.chat.completions.create({
    model,
    messages: [{ role: "user", content: prompt }],
    max_tokens,
    temperature,
  });

  // resp is the SDK response object. Normalize to keep backward compatibility:
  // Build a simple shape with choices[] and usage if available
  const normalized: any = {};

  // The new SDK's resp has structure: { id, object, created, model, choices: [{id, delta?, message?, ...}], usage? }
  if (resp) {
    // Build choices.text like older SDK
    normalized.choices = (resp.choices || []).map((c: any) => {
      // c.message?.content or c.delta?.content
      const text =
        (c.message && (c.message.content || c.message?.role && c.message?.content)) ||
        (c.delta && c.delta?.content) ||
        c.text ||
        "";
      return { text, raw: c };
    });

    // usage may be provided under resp.usage
    normalized.usage = resp.usage || null;
    normalized.raw = resp;
  }

  return normalized;
}

export default { callOpenAI };
