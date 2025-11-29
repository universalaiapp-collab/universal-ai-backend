"use strict";
// src/core/parsers/universal.parser.ts
/**
 * Universal parser: normalizes responses from multiple LLM providers
 * into a consistent shape used by the Orchestrator.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseGeminiChat = parseGeminiChat;
exports.parseOpenAIChat = parseOpenAIChat;
exports.parseEmbedding = parseEmbedding;
exports.parseUniversalResponse = parseUniversalResponse;
/* ---------------------------
   Helper utilities
   --------------------------- */
function safeString(v) {
    if (typeof v === "string")
        return v;
    try {
        return JSON.stringify(v);
    }
    catch {
        return String(v);
    }
}
function joinPieces(arr) {
    return arr
        .map((c) => {
        if (typeof c === "string")
            return c;
        if (c == null)
            return "";
        if (typeof c === "object") {
            // common shapes
            if (typeof c.text === "string")
                return c.text;
            if (typeof c.content === "string")
                return c.content;
            return safeString(c);
        }
        return String(c);
    })
        .filter(Boolean)
        .join("\n");
}
/* ---------------------------
   Gemini parser
   --------------------------- */
function parseGeminiChat(raw) {
    try {
        if (!raw) {
            return { success: false, provider: "gemini", type: "text", output: "", raw };
        }
        // 1) raw.output[0].content[0].text or content array
        if (raw.output && Array.isArray(raw.output) && raw.output.length > 0) {
            const out0 = raw.output[0];
            if (out0) {
                if (Array.isArray(out0.content) && out0.content.length > 0) {
                    const text = joinPieces(out0.content);
                    return { success: true, provider: "gemini", type: "text", output: text, raw };
                }
                if (typeof out0.text === "string") {
                    return { success: true, provider: "gemini", type: "text", output: out0.text, raw };
                }
            }
        }
        // 2) raw.candidates[0].content
        if (Array.isArray(raw.candidates) && raw.candidates.length > 0) {
            const cand = raw.candidates[0];
            if (cand?.content) {
                if (typeof cand.content === "string") {
                    return { success: true, provider: "gemini", type: "text", output: cand.content, raw };
                }
                if (Array.isArray(cand.content)) {
                    const joined = joinPieces(cand.content);
                    return { success: true, provider: "gemini", type: "text", output: joined, raw };
                }
                // object fallback
                return { success: true, provider: "gemini", type: "text", output: safeString(cand.content), raw };
            }
        }
        // 3) raw.response or raw.text or raw.message
        if (raw.response && typeof raw.response === "string") {
            return { success: true, provider: "gemini", type: "text", output: raw.response, raw };
        }
        if (raw.text && typeof raw.text === "string") {
            return { success: true, provider: "gemini", type: "text", output: raw.text, raw };
        }
        if (raw.message && typeof raw.message === "string") {
            return { success: true, provider: "gemini", type: "text", output: raw.message, raw };
        }
        // 4) raw.outputs array shape
        if (Array.isArray(raw.outputs) && raw.outputs.length > 0) {
            const texts = raw.outputs.map((o) => {
                if (typeof o === "string")
                    return o;
                if (o?.content && Array.isArray(o.content))
                    return joinPieces(o.content);
                if (o?.text)
                    return o.text;
                return safeString(o);
            });
            return { success: true, provider: "gemini", type: "text", output: texts.join("\n"), raw };
        }
        // Fallback: try to extract any top-level string-like fields
        const candidateFields = ["answer", "result", "output", "value"];
        for (const f of candidateFields) {
            if (raw[f] && typeof raw[f] === "string") {
                return { success: true, provider: "gemini", type: "text", output: raw[f], raw };
            }
        }
        // Last resort: stringify raw and return
        return { success: true, provider: "gemini", type: "text", output: safeString(raw), raw };
    }
    catch (err) {
        return { success: false, provider: "gemini", type: "unknown", output: "", raw };
    }
}
/* ---------------------------
   OpenAI parser (basic)
   --------------------------- */
function parseOpenAIChat(raw) {
    try {
        if (!raw)
            return { success: false, provider: "openai", type: "text", output: "", raw };
        // Chat completions / responses with choices
        if (Array.isArray(raw.choices) && raw.choices.length > 0) {
            const first = raw.choices[0];
            // new ChatCompletions style
            if (first?.message?.content && typeof first.message.content === "string") {
                return { success: true, provider: "openai", type: "text", output: first.message.content, raw };
            }
            // text completions style
            if (typeof first?.text === "string") {
                return { success: true, provider: "openai", type: "text", output: first.text, raw };
            }
        }
        // direct fields
        if (raw?.message && typeof raw.message === "string") {
            return { success: true, provider: "openai", type: "text", output: raw.message, raw };
        }
        // fallback
        return { success: true, provider: "openai", type: "text", output: safeString(raw), raw };
    }
    catch (err) {
        return { success: false, provider: "openai", type: "unknown", output: "", raw };
    }
}
/* ---------------------------
   Embedding parser (generic)
   --------------------------- */
function parseEmbedding(provider, raw) {
    try {
        // OpenAI-style embeddings: data[0].embedding
        if (raw?.data && Array.isArray(raw.data) && raw.data[0]?.embedding) {
            return { success: true, provider, type: "embedding", output: raw.data.map((d) => d.embedding), raw };
        }
        // Some providers return embeddings as result[0].vector or embeddings array
        if (Array.isArray(raw?.embeddings)) {
            return { success: true, provider, type: "embedding", output: raw.embeddings, raw };
        }
        // Fallback
        return { success: false, provider, type: "embedding", output: [], raw };
    }
    catch (err) {
        return { success: false, provider, type: "unknown", output: [], raw };
    }
}
/* ---------------------------
   Universal router
   --------------------------- */
function parseUniversalResponse(provider, raw) {
    const p = (provider || "").toLowerCase();
    // Quick: handle embedding shapes
    if (raw && (raw?.data || raw?.embeddings || raw?.embedding)) {
        return parseEmbedding(p, raw);
    }
    switch (p) {
        case "gemini":
            return parseGeminiChat(raw);
        case "openai":
        case "open-ai":
        case "open ai":
            return parseOpenAIChat(raw);
        default:
            // Generic best-effort parser: try common shapes, then stringify
            if (raw == null)
                return { success: false, provider, type: "unknown", output: "", raw };
            if (typeof raw === "string")
                return { success: true, provider, type: "text", output: raw, raw };
            if (typeof raw === "object") {
                // if object has message/text/response fields prefer them
                if (typeof raw?.text === "string")
                    return { success: true, provider, type: "text", output: raw.text, raw };
                if (typeof raw?.response === "string")
                    return { success: true, provider, type: "text", output: raw.response, raw };
                if (typeof raw?.message === "string")
                    return { success: true, provider, type: "text", output: raw.message, raw };
                // finally, stringify
                return { success: true, provider, type: "text", output: safeString(raw), raw };
            }
            return { success: true, provider, type: "text", output: String(raw), raw };
    }
}
/* ---------------------------
   Exports
   --------------------------- */
exports.default = {
    parseGeminiChat,
    parseOpenAIChat,
    parseEmbedding,
    parseUniversalResponse,
};
