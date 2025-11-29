"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runOrchestrator = void 0;
// src/services/orchestrator.service.ts
const globalConfig_1 = __importDefault(require("../config/globalConfig"));
const metrics_logger_1 = require("../utils/metrics.logger");
const costEstimator_1 = require("../utils/costEstimator");
const circuitStates = {};
const isCircuitOpen = (provider) => {
    const s = circuitStates[provider];
    if (!s)
        return false;
    if (s.openUntil && Date.now() < s.openUntil)
        return true;
    s.failures = 0;
    s.openUntil = 0;
    return false;
};
const registerFailure = (provider) => {
    if (!circuitStates[provider])
        circuitStates[provider] = { failures: 0, openUntil: 0 };
    circuitStates[provider].failures += 1;
    if (circuitStates[provider].failures > globalConfig_1.default.orchestrator.circuitBreaker.failureThreshold) {
        circuitStates[provider].openUntil = Date.now() + globalConfig_1.default.orchestrator.circuitBreaker.cooldownMs;
        console.warn(`[CB] Opening circuit for ${provider} until ${new Date(circuitStates[provider].openUntil).toISOString()}`);
    }
};
const registerSuccess = (provider) => {
    if (!circuitStates[provider])
        circuitStates[provider] = { failures: 0, openUntil: 0 };
    circuitStates[provider].failures = 0;
    circuitStates[provider].openUntil = 0;
};
/** timeout helper */
const withTimeout = (p, ms = 8000) => {
    let timer;
    const timeout = new Promise((_, rej) => {
        timer = setTimeout(() => rej(new Error("timeout")), ms);
    });
    return Promise.race([p, timeout]).finally(() => clearTimeout(timer));
};
/** provider stubs (expand to real adapters on Day-2) */
const providerAdapters = {
    "openai-primary": {
        call: async (prompt, opts) => {
            if (opts?.forceFail === "openai")
                throw new Error("simulated openai failure");
            const promptTokens = Math.max(1, Math.floor(prompt.length / 4));
            const completionTokens = Math.min(2000, Math.floor(promptTokens * 0.6));
            return { model: "openai/gpt-4o", text: `openai response to: ${prompt.slice(0, 80)}`, promptTokens, completionTokens };
        },
    },
    "gemini-pro": {
        call: async (prompt, opts) => {
            if (opts?.forceFail === "gemini-pro")
                throw new Error("simulated gemini-pro failure");
            const promptTokens = Math.max(1, Math.floor(prompt.length / 5));
            const completionTokens = Math.min(1500, Math.floor(promptTokens * 0.5));
            return { model: "google/gemini-pro", text: `gemini-pro response to: ${prompt.slice(0, 80)}`, promptTokens, completionTokens };
        },
    },
    gemini: {
        call: async (prompt, opts) => {
            if (opts?.forceFail === "gemini")
                throw new Error("simulated gemini failure");
            const promptTokens = Math.max(1, Math.floor(prompt.length / 5));
            const completionTokens = Math.min(1200, Math.floor(promptTokens * 0.5));
            return { model: "google/gemini", text: `gemini response to: ${prompt.slice(0, 80)}`, promptTokens, completionTokens };
        },
    },
    "gpt-4o": {
        call: async (prompt, opts) => {
            if (opts?.forceFail === "gpt4o")
                throw new Error("simulated gpt-4o failure");
            const promptTokens = Math.max(1, Math.floor(prompt.length / 4));
            const completionTokens = Math.min(3000, Math.floor(promptTokens * 0.7));
            return { model: "openai/gpt-4o", text: `gpt-4o response to: ${prompt.slice(0, 80)}`, promptTokens, completionTokens };
        },
    },
    "gpt-4o-mini": {
        call: async (prompt, opts) => {
            if (opts?.forceFail === "mini")
                throw new Error("simulated mini failure");
            const promptTokens = Math.max(1, Math.floor(prompt.length / 6));
            const completionTokens = Math.min(800, Math.floor(promptTokens * 0.4));
            return { model: "openai/gpt-4o-mini", text: `mini response to: ${prompt.slice(0, 80)}`, promptTokens, completionTokens };
        },
    },
    "dev-stub": {
        call: async (prompt, opts) => {
            return { model: "dev/stub", text: `dev-stub: echo: ${prompt.slice(0, 200)}`, promptTokens: 1, completionTokens: 1 };
        },
    },
};
const runOrchestrator = async (prompt, opts = {}) => {
    const fallbackOrder = (opts?.fallbackOrder || globalConfig_1.default.orchestrator.fallbackOrder);
    let lastErr = null;
    for (const providerKey of fallbackOrder) {
        if (isCircuitOpen(providerKey)) {
            console.log(`[Orch] Skipping ${providerKey} because circuit is open`);
            continue;
        }
        const adapter = providerAdapters[providerKey];
        if (!adapter) {
            console.warn(`[Orch] No adapter for ${providerKey}`);
            continue;
        }
        try {
            // call adapter with timeout wrapper (8s default) and force any typing
            const rawPromise = adapter.call(prompt, opts);
            const out = await withTimeout(rawPromise, opts?.timeoutMs || 8000);
            const promptTokens = Number(out.promptTokens || 0);
            const completionTokens = Number(out.completionTokens || 0);
            const totalTokens = promptTokens + completionTokens;
            const estCost = (0, costEstimator_1.estimateCost)(providerKey, totalTokens);
            // metrics
            (0, metrics_logger_1.logCall)({
                timestamp: Date.now(),
                userId: opts?.userId,
                model: out.model || providerKey,
                promptTokens,
                completionTokens,
                totalTokens,
                estCost,
            });
            registerSuccess(providerKey);
            // unified response format
            return {
                ok: true,
                message: out.text || out.response || "",
                provider: providerKey,
                model: out.model || providerKey,
                tokens: { promptTokens, completionTokens, totalTokens },
                estCost,
            };
        }
        catch (err) {
            const errMsg = err?.message || String(err);
            console.warn(`[Orch] Provider ${providerKey} failed: ${errMsg}`);
            registerFailure(providerKey);
            lastErr = err;
        }
    }
    return {
        ok: false,
        error: lastErr ? (lastErr.message || String(lastErr)) : "no providers available",
    };
};
exports.runOrchestrator = runOrchestrator;
exports.default = exports.runOrchestrator;
