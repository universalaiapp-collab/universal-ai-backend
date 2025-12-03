import { OpenAIAdapter } from "./openai.adapter";
import { AnthropicAdapter } from "./anthropic.adapter";
import { GoogleAdapter } from "./google.adapter";
import { MetaAdapter } from "./meta.adapter";

/**
 * Export ready-to-use instances for legacy imports that expect named adapters
 * e.g. import { openaiAdapter } from "../providers/openai.adapter";
 * This file provides openaiAdapter, anthropicAdapter, googleAdapter, metaAdapter
 * using env keys if present.
 */

export const openaiAdapter = new OpenAIAdapter(process.env.OPENAI_API_KEY || "", process.env.OPENAI_BASE);
export const anthropicAdapter = new AnthropicAdapter(process.env.ANTHROPIC_API_KEY || "", process.env.ANTHROPIC_BASE);
export const googleAdapter = new GoogleAdapter(process.env.GOOGLE_API_KEY || "", process.env.GOOGLE_BASE);
export const metaAdapter = new MetaAdapter(process.env.META_API_KEY || "", process.env.META_BASE);
