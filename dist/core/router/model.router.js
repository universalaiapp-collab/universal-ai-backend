"use strict";
// src/core/router/model.router.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.MODEL_MAP = void 0;
/**
 * MODEL_MAP determines which provider & model will be used
 * when user sends { model: "<model-key>" } in /orch/chat.
 *
 * Every modelKey must map to:
 *   provider: "openai" | "gemini" | "anthropic" | "groq" | ...
 *   model:    actual provider model name
 *   type:     "chat" | "embedding"
 */
exports.MODEL_MAP = {
    // -------------------------------------------------------
    // 🟦 OPENAI MODELS
    // -------------------------------------------------------
    "gpt-4o-mini": {
        provider: "openai",
        model: "gpt-4o-mini",
        type: "chat",
    },
    // Embedding model example
    "text-embedding-3-large": {
        provider: "openai",
        model: "text-embedding-3-large",
        type: "embedding",
    },
    // -------------------------------------------------------
    // 🟧 GEMINI MODELS (Google)
    // Make sure names match your .env !
    // -------------------------------------------------------
    "gemini-1.5-flash": {
        provider: "gemini",
        model: "gemini-1.5-flash",
        type: "chat",
    },
    // Optional additional aliases
    "gemini-flash": {
        provider: "gemini",
        model: "gemini-1.5-flash",
        type: "chat",
    },
    "gemini-pro": {
        provider: "gemini",
        model: "gemini-pro",
        type: "chat",
    },
    // -------------------------------------------------------
    // 🟩 ANTHROPIC (Claude)
    // -------------------------------------------------------
    "claude-3-haiku": {
        provider: "anthropic",
        model: "claude-3-haiku-20240307",
        type: "chat",
    },
    // -------------------------------------------------------
    // 🟪 GROQ (Llama)
    // -------------------------------------------------------
    "llama3-8b": {
        provider: "groq",
        model: "llama3-8b-8192",
        type: "chat",
    },
};
