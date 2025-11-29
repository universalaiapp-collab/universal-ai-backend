"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/services/providerClient.ts
const axios_1 = __importDefault(require("axios"));
const timeout_1 = require("../utils/timeout");
async function callProvider({ provider, model, prompt, timeoutMs = 12000 }) {
    // If OPENAI_API_KEY present and provider indicates openai, call the real API.
    const openaiKey = process.env.OPENAI_API_KEY;
    if (provider === "openai" && openaiKey) {
        return (0, timeout_1.withTimeout)(callOpenAIChat({ apiKey: openaiKey, model, prompt }), timeoutMs);
    }
    // If no real key (or provider not openai), fall back to simulated provider to avoid breaking local dev.
    return (0, timeout_1.withTimeout)(_callSimulatedProvider(provider, model, prompt), timeoutMs);
}
/**
 * Real OpenAI Chat call (axios + AbortController).
 * Adjust endpoint/payload to match your account/usage (this uses v1/chat/completions).
 */
async function callOpenAIChat({ apiKey, model, prompt }) {
    const url = "https://api.openai.com/v1/chat/completions";
    const payload = {
        model,
        messages: [{ role: "user", content: prompt }],
        // optional: max_tokens, temperature, top_p, etc.
        // max_tokens: 512,
    };
    // Axios supports AbortController for request cancellation
    const controller = new AbortController();
    const cfg = {
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        signal: controller.signal,
        timeout: 0, // we rely on withTimeout wrapper instead of axios timeout
    };
    const resp = await axios_1.default.post(url, payload, cfg);
    // Normalize to { text, meta }
    const text = resp.data?.choices?.[0]?.message?.content ??
        resp.data?.choices?.[0]?.text ??
        JSON.stringify(resp.data);
    return {
        text: text,
        meta: { provider: "openai", model, raw: resp.data },
    };
}
/**
 * Simulated provider call — kept for local dev.
 */
async function _callSimulatedProvider(provider, model, prompt) {
    const env = process.env;
    const failKey = `FAIL_PROVIDER_${provider.toUpperCase()}`;
    const slowKey = `SLOW_PROVIDER_${provider.toUpperCase()}`;
    const baseLatency = Number(env[`LATENCY_${provider.toUpperCase()}`]) || (provider === "openai" ? 200 : provider === "gemini" ? 400 : 350);
    const slowExtra = Number(env[slowKey]) || 0;
    const latency = baseLatency + slowExtra + Math.floor(Math.random() * 200);
    await new Promise((r) => setTimeout(r, latency));
    if (env[failKey] && env[failKey]?.toLowerCase() === "true") {
        const err = new Error(`${provider} simulated failure`);
        err.provider = provider;
        throw err;
    }
    return {
        text: `Simulated response from ${provider}/${model}. Prompt length ${prompt.length}`,
        meta: { latency, provider, model },
    };
}
exports.default = { callProvider };
