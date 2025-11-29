"use strict";
// src/lib/smart-router.ts
// Robust provider loader + smart router (fixed to search inside `providers/` directory)
// Works for both dev (src/) and built (dist/) runs.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chooseAndRun = chooseAndRun;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const tryProvider_1 = require("./tryProvider");
const circuitBreaker_1 = require("../lib/circuitBreaker");
function tryRequire(p) {
    try {
        return require(p);
    }
    catch (e) {
        throw e;
    }
}
/**
 * Try a set of plausible absolute paths to the module.
 * We check:
 *  - dist/providers/<name>.js  (runtime compiled)
 *  - dist/<name>.js            (older layout)
 *  - src/providers/<name>.ts   (dev / ts-node)
 *  - src/providers/<name>.js   (if transpiled locally)
 *  - process.cwd()/<name>
 *  - fallback to require('../providers/<name>')
 */
function loadProviderCandidates(name) {
    const candPaths = [
        path_1.default.join(__dirname, '..', 'providers', name), // dist/lib -> dist/providers/<name>
        path_1.default.join(__dirname, '..', name), // dist/lib -> dist/<name>
        path_1.default.join(process.cwd(), 'dist', 'providers', name), // absolute: project/dist/providers/<name>
        path_1.default.join(process.cwd(), 'dist', name), // absolute: project/dist/<name>
        path_1.default.join(process.cwd(), 'src', 'providers', name), // src/providers/<name>
        path_1.default.join(process.cwd(), 'src', name), // src/<name>
        path_1.default.join(process.cwd(), name), // project root fallback
    ];
    for (const c of candPaths) {
        try {
            // accept .js or .ts or direct path
            if (fs_1.default.existsSync(c + '.js') || fs_1.default.existsSync(c + '.ts') || fs_1.default.existsSync(c)) {
                const mod = tryRequire(c);
                return mod?.default ?? mod;
            }
        }
        catch (err) {
            // ignore and try next
        }
    }
    // last-resort relative require
    try {
        const mod = tryRequire(`../providers/${name}`);
        return mod?.default ?? mod;
    }
    catch (err) {
        // couldn't load
        return null;
    }
}
/* Load providers */
const providerA = loadProviderCandidates('providerA');
const providerB = loadProviderCandidates('providerB');
const openaiProvider = loadProviderCandidates(path_1.default.join('providers', 'openai.provider'));
const geminiProvider = loadProviderCandidates(path_1.default.join('providers', 'gemini.provider'));
const anthropicProvider = loadProviderCandidates(path_1.default.join('providers', 'anthropic.provider'));
const ollamaProvider = loadProviderCandidates(path_1.default.join('providers', 'ollama.provider'));
// Startup debug: will show which providers were found (true = loaded)
console.info('[smart-router] providerA loaded?', !!providerA, 'providerB loaded?', !!providerB, 'openai?', !!openaiProvider, 'gemini?', !!geminiProvider);
const DEFAULT_PRIORITY = (process.env.PROVIDER_PRIORITY || 'providerA,openai,gemini,providerB,anthropic,ollama')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
const REGISTRY = {
    providerA,
    providerB,
    openai: openaiProvider,
    gemini: geminiProvider,
    anthropic: anthropicProvider,
    ollama: ollamaProvider,
};
async function chooseAndRun(kind, payload, opts = {}) {
    const priority = opts.priority ?? DEFAULT_PRIORITY;
    const errors = [];
    for (const pid of priority) {
        const p = REGISTRY[pid];
        if (!p) {
            errors.push({ provider: pid, error: 'unknown_provider' });
            continue;
        }
        if (p.supports && kind !== 'generic' && !p.supports.includes(kind)) {
            errors.push({ provider: pid, error: 'unsupported_kind' });
            continue;
        }
        try {
            if ((0, circuitBreaker_1.isOpen)(pid)) {
                errors.push({ provider: pid, error: 'circuit_open' });
                continue;
            }
        }
        catch (e) {
            console.warn('[smart-router] circuitChecker error', e);
        }
        try {
            const r = await (0, tryProvider_1.tryProvider)(pid, p.call.bind(p), payload, { timeoutMs: opts.timeoutMs, retries: opts.retries });
            if (r && r.ok) {
                try {
                    (0, circuitBreaker_1.recordSuccess)(pid);
                }
                catch (e) { }
                const rAny = r;
                return {
                    success: true,
                    provider: pid,
                    data: rAny.response?.data ?? rAny.response ?? null,
                    latencyMs: rAny.duration ?? rAny.response?.latencyMs ?? 0,
                    costTokens: rAny.costTokens ?? rAny.response?.costTokens ?? 0,
                };
            }
            else {
                try {
                    (0, circuitBreaker_1.recordFailure)(pid);
                }
                catch (e) { }
                errors.push({ provider: pid, error: r?.error ?? r });
                continue;
            }
        }
        catch (outerErr) {
            try {
                (0, circuitBreaker_1.recordFailure)(pid);
            }
            catch (e) { }
            errors.push({ provider: pid, error: outerErr });
            continue;
        }
    }
    return { success: false, errors };
}
