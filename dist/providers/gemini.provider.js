"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.geminiChat = geminiChat;
// src/providers/gemini.provider.ts
const axios_1 = __importDefault(require("axios"));
/**
 * geminiChat
 *
 * - If process.env.ENABLE_FAKE_PROVIDERS === "true" (or === true), returns a simulated response (useful for local testing)
 * - Otherwise, attempts a real API call ONLY if GEMINI_API_KEY and GEMINI_API_URL are configured.
 *
 * NOTE: Google Generative API has multiple endpoints and payload formats between versions.
 * This provider intentionally:
 *  - returns a helpful error when GEMINI real-mode is attempted without required env config
 *  - avoids making unsupported/incorrect payloads blindly
 *
 * You can extend this file to match the exact Google API shape you have access to (generateText, generateMessage, or generateContent).
 */
const ENABLE_FAKE = String(process.env.ENABLE_FAKE_PROVIDERS || "false").toLowerCase() === "true";
async function geminiChat(params) {
    const { model, messages = [], input, temperature = 0.0, extra = {} } = params;
    // 1) Fake provider mode (quick, reliable local testing)
    if (ENABLE_FAKE) {
        const joined = (messages && messages.length)
            ? messages.map((m) => `${m.role}: ${m.content}`).join("\n")
            : (Array.isArray(input) ? input.join("\n") : input || "hello (no input)");
        const simText = `Simulated response for provider gemini model ${model}\n\nrequest:\n${joined}`;
        return {
            success: true,
            provider: "gemini",
            type: "text",
            output: simText,
            raw: { simulated: true, model, messages, input, temperature, extra },
            simulated: true,
        };
    }
    // 2) Real provider mode: validate env
    const apiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY; // prefer exact var
    const apiUrl = process.env.GEMINI_API_URL || process.env.GEMINI_API_URL;
    if (!apiKey || !apiUrl) {
        const msg = "GEMINI_API_KEY or GEMINI_API_URL missing. To enable real Gemini calls set GEMINI_API_KEY and GEMINI_API_URL in your .env";
        console.warn("[gemini.provider] Real mode attempted but missing config:", msg);
        throw new Error(msg);
    }
    // Build a conservative payload mapping:
    // Many public examples for v1beta use: {input: "user: ..." } or structured messages.
    // Because formats vary, we try a minimal safe payload that works with many wrappers:
    const textInput = (messages && messages.length)
        ? messages.map(m => `${m.role}: ${m.content}`).join("\n")
        : (Array.isArray(input) ? input.join("\n") : (input || ""));
    // Default payload for the "generateContent" style endpoints (this may need adjustment depending on your API version)
    const payload = {
        // best-effort fields — adjust to your API version if required
        input: textInput || "Hello",
        // optional params
        temperature,
        // include extra if provided (non-breaking)
        ...(Object.keys(extra || {}).length ? { extra } : {}),
    };
    try {
        // Use axios to POST. Use x-goog-api-key header if API key is used that way.
        const resp = await axios_1.default.request({
            method: "post",
            url: apiUrl.replace("${GEMINI_MODEL}", encodeURIComponent(model)),
            headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": apiKey,
            },
            data: payload,
            timeout: Number(process.env.AI_TIMEOUT_MS || 120000),
        });
        // Attempt to extract a useful text response from returned structure.
        const data = resp?.data;
        let output = "";
        // Common places where text might be:
        if (typeof data === "string") {
            output = data;
        }
        else if (data?.candidates && Array.isArray(data.candidates) && data.candidates[0]?.content) {
            // some GL responses use `candidates` array
            output = Array.isArray(data.candidates)
                ? data.candidates.map((c) => c.content ?? c).join("\n")
                : String(data.candidates);
        }
        else if (data?.output?.[0]?.content) {
            // another possible structure
            output = data.output.map((o) => o.content?.map((c) => c.text ?? c).join("") ?? JSON.stringify(o)).join("\n");
        }
        else if (data?.result) {
            output = typeof data.result === "string" ? data.result : JSON.stringify(data.result);
        }
        else {
            output = JSON.stringify(data);
        }
        return {
            success: true,
            provider: "gemini",
            type: "text",
            output,
            raw: data,
            simulated: false,
        };
    }
    catch (err) {
        // normalize errors for the caller
        console.error("[gemini.provider] error calling Gemini:", err?.response?.data || err?.message || err);
        const details = err?.response?.data ?? { message: err?.message ?? "unknown error" };
        // throw detailed error so upstream returns proper HTTP code
        throw new Error(`Request failed: ${JSON.stringify(details)}`);
    }
}
exports.default = {
    geminiChat,
};
