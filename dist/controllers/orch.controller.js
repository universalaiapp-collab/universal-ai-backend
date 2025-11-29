"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.orchController = orchController;
const providerAdapters_1 = require("../services/providerAdapters");
const walletService = __importStar(require("../services/wallet.service"));
const metricsService = __importStar(require("../services/metrics.service"));
const day2Config_1 = __importDefault(require("../config/day2Config"));
async function callProviderWithTimeout(providerFn, prompt, opts, timeoutMs) {
    return new Promise((resolve, reject) => {
        let finished = false;
        const timer = setTimeout(() => {
            if (finished)
                return;
            finished = true;
            reject(new Error('provider_timeout'));
        }, timeoutMs);
        providerFn(prompt, opts)
            .then((r) => { if (finished)
            return; finished = true; clearTimeout(timer); resolve(r); })
            .catch((err) => { if (finished)
            return; finished = true; clearTimeout(timer); reject(err); });
    });
}
async function orchController(req, res) {
    const user = req.user;
    const prompt = req.body?.prompt || '';
    const maxTokens = req.body?.maxTokens;
    const fallbackOrder = req.body?.fallbackOrder || ['openai', 'gemini'];
    const forceFail = req.body?.forceFail; // for tests
    const estTokens = req.estimatedTokens || Math.ceil((prompt.length || 0) / 4) + (maxTokens || 100);
    const costPerToken = 0.00001; // sample pricing; replace with your pricing calc
    const estCost = estTokens * costPerToken;
    // Reserve credits
    const reserveResp = await walletService.reserveCredits(user.id, estCost);
    if (!reserveResp.success) {
        return res.status(402).json({ ok: false, error: 'insufficient_credits', message: 'Not enough credits. Please top up.' });
    }
    let charged = 0;
    let usedMetrics = null;
    try {
        let lastErr = null;
        for (const provider of fallbackOrder) {
            try {
                const opts = { maxTokens, forceFail };
                const timeoutMs = day2Config_1.default.providerTimeoutMs;
                const resp = provider === 'openai'
                    ? await callProviderWithTimeout(providerAdapters_1.callOpenAI, prompt, opts, timeoutMs)
                    : await callProviderWithTimeout(providerAdapters_1.callGemini, prompt, opts, timeoutMs);
                const totalTokens = resp.promptTokens + resp.completionTokens;
                charged = totalTokens * costPerToken;
                // finalize deduction (may be different from estCost)
                await walletService.finalizeDeduction(user.id, charged, { provider: resp.provider, model: resp.model });
                // record metrics
                await metricsService.recordMetrics({
                    userId: user.id,
                    provider: resp.provider,
                    model: resp.model,
                    promptTokens: resp.promptTokens,
                    completionTokens: resp.completionTokens,
                    totalTokens,
                    estCost
                });
                usedMetrics = { provider: resp.provider, model: resp.model, totalTokens, charged };
                return res.json({
                    ok: true,
                    message: 'success',
                    provider: resp.provider,
                    model: resp.model,
                    tokens: { promptTokens: resp.promptTokens, completionTokens: resp.completionTokens, totalTokens },
                    costCharged: charged,
                    text: resp.text
                });
            }
            catch (err) {
                lastErr = err;
                // continue to next provider
            }
        }
        // if we exit loop, all providers failed
        // refund reserved
        await walletService.refundReserved(user.id, estCost, 'provider_failure_refund');
        return res.status(502).json({ ok: false, error: 'provider_failure', message: lastErr?.message || 'All providers failed' });
    }
    catch (err) {
        // on unexpected error, refund reserved
        await walletService.refundReserved(user.id, estCost, 'unexpected_error_refund');
        return res.status(500).json({ ok: false, error: 'internal_error', message: err?.message || 'Internal error' });
    }
}
