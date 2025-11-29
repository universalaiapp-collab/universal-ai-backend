"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orchController = void 0;
exports.orchHandler = orchHandler;
const scoring_service_1 = require("../services/scoring.service");
const circuitBreaker_1 = require("../lib/circuitBreaker");
function delay(ms) {
    return new Promise((res) => setTimeout(res, ms));
}
async function callSimulatedProvider(provider, model, prompt) {
    const env = process.env;
    const slowKey = `SLOW_PROVIDER_${provider.toUpperCase()}`;
    const slowMs = Number(env[slowKey] ?? 0);
    const failKey = `FAIL_PROVIDER_${provider.toUpperCase()}`;
    const shouldFail = (env[failKey] ?? "").toLowerCase() === "true";
    const baseLatency = provider === "openai" ? 200 : provider === "gemini" ? 350 : 250;
    const latency = baseLatency + slowMs + Math.floor(Math.random() * 150);
    await delay(latency);
    if (shouldFail) {
        const e = new Error(`${provider} simulated failure`);
        e.provider = provider;
        throw e;
    }
    return {
        text: `Simulated response from ${provider}/${model}. Prompt length ${prompt.length}`,
        meta: {
            latency,
            provider,
            model,
        },
    };
}
async function orchHandler(req, res) {
    const body = req.body;
    if (!body || !body.prompt || typeof body.prompt !== "string") {
        return res.status(400).json({ ok: false, error: "missing_prompt", message: "Missing 'prompt' in body." });
    }
    const prompt = body.prompt;
    const timeoutMs = typeof body.timeoutMs === "number" ? body.timeoutMs : 12000;
    // Fetch ordered candidates from scoring service (meta-router)
    const candidates = (0, scoring_service_1.getOrderedCandidates)();
    const start = Date.now();
    const errors = [];
    for (const c of candidates) {
        // Skip if circuit-breaker is open
        if ((0, circuitBreaker_1.isOpen)(c.provider)) {
            console.warn(`Skipping ${c.provider} because circuit is open.`);
            errors.push({ provider: c.provider, error: "circuit_open" });
            continue;
        }
        try {
            // Timeout wrapper per provider
            const resultPromise = callSimulatedProvider(c.provider, c.model, prompt);
            const timeoutPromise = new Promise((_r, rej) => setTimeout(() => rej(new Error("Operation timed out")), timeoutMs));
            const result = await Promise.race([resultPromise, timeoutPromise]);
            // Success -> notify CB and return
            (0, circuitBreaker_1.recordSuccess)(c.provider);
            const latency = Date.now() - start;
            return res.json({ provider: c.provider, model: c.model, response: result, latency });
        }
        catch (err) {
            // Record failure in circuit-breaker and try next candidate
            console.warn(`Provider ${c.provider} failed, trying next. Error:`, err?.message || err);
            (0, circuitBreaker_1.recordFailure)(c.provider);
            errors.push({ provider: c.provider, error: err?.message || String(err) });
            continue;
        }
    }
    // If here, all providers failed or were skipped
    return res.status(502).json({ ok: false, error: "providers_unavailable", message: "All providers failed or are unavailable.", details: errors });
}
// provide named + default export
exports.orchController = orchHandler;
exports.default = orchHandler;
