"use strict";
// src/adapters/gemini.adapter.ts
// Gemini adapter (REST) supporting both Developer API key and Vertex ADC (service account).
// Uses Node 18 global fetch. For TypeScript, declare fetch to avoid DOM lib dependency.
// Install: npm install google-auth-library
// Env:
//  - GEMINI_API_KEY (optional) -> Developer API key (uses ?key=)
//  - GOOGLE_APPLICATION_CREDENTIALS (optional) -> path to service account JSON for ADC
//  - GCP_PROJECT (optional) -> project id for ADC
//  - GEMINI_MODEL -> model name (default gemini-1.5-flash)
//  - GEMINI_LOCATION -> location (default us-central1)
Object.defineProperty(exports, "__esModule", { value: true });
exports.callGemini = callGemini;
const google_auth_library_1 = require("google-auth-library");
const GEMINI_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
const GEMINI_LOCATION = process.env.GEMINI_LOCATION || 'us-central1';
const GCP_PROJECT = process.env.GCP_PROJECT || '';
const API_BASE = 'https://generativelanguage.googleapis.com';
const API_VERSION = 'v1beta';
/** build url; if using API key we add ?key=...; if ADC we omit key and use Authorization header */
function buildUrl(model, useKey = false) {
    const name = `models/${model}:generateContent`;
    const base = `${API_BASE}/${API_VERSION}/${encodeURIComponent(name)}`;
    if (useKey && GEMINI_KEY) {
        return `${base}?key=${encodeURIComponent(GEMINI_KEY)}`;
    }
    return base;
}
/** get OAuth bearer token using ADC (service account JSON) */
async function getAccessToken() {
    const auth = new google_auth_library_1.GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });
    // auth.getClient() will pick up GOOGLE_APPLICATION_CREDENTIALS or ADC automatically
    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();
    const token = tokenResponse?.token || tokenResponse;
    if (!token)
        throw new Error('Unable to obtain access token from Google ADC');
    return token;
}
/**
 * callGemini(prompt, opts)
 * returns normalized shape: { choices: [{ text }], usage: { total_tokens }, raw }
 */
async function callGemini(prompt, opts = {}) {
    if (!prompt)
        throw new Error('gemini.adapter: missing prompt');
    const model = opts.model || GEMINI_MODEL;
    const maxOutputTokens = opts.maxOutputTokens ?? 512;
    const temperature = typeof opts.temperature === 'number' ? opts.temperature : 0.2;
    // Dev convenience: if no auth info provided, return a mock response
    const haveKey = Boolean(GEMINI_KEY);
    const haveADC = Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GCP_PROJECT);
    if (!haveKey && !haveADC) {
        return {
            choices: [{ text: `GEMINI-MOCK: ${prompt.slice(0, 300)}` }],
            usage: { total_tokens: Math.min(60, Math.ceil(prompt.length / 4)) },
            raw: { mocked: true },
        };
    }
    const url = buildUrl(model, haveKey);
    const body = {
        contents: [{ parts: [{ text: prompt }] }],
        temperature,
        maxOutputTokens,
    };
    const headers = {
        'Content-Type': 'application/json',
    };
    if (!haveKey) {
        // Use ADC to obtain access token and set Authorization header
        const accessToken = await getAccessToken();
        headers['Authorization'] = `Bearer ${accessToken}`;
    }
    const resp = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
    });
    if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`Gemini API error ${resp.status}: ${text}`);
    }
    const json = await resp.json();
    // Normalize into { choices: [{ text }], usage: { total_tokens }, raw }
    const normalized = { choices: [], usage: null, raw: json };
    try {
        if (json?.candidates && Array.isArray(json.candidates)) {
            for (const c of json.candidates) {
                const text = c?.content || c?.display || c?.text || (typeof c === 'string' ? c : '');
                normalized.choices.push({ text, raw: c });
            }
        }
        else if (json?.outputs && Array.isArray(json.outputs)) {
            for (const out of json.outputs) {
                const text = out?.content ||
                    out?.text ||
                    (out?.candidates && out.candidates[0]?.content) ||
                    (out?.items && out.items.map((it) => it?.text || '').join('')) ||
                    '';
                normalized.choices.push({ text, raw: out });
            }
        }
        else if (json?.text) {
            normalized.choices.push({ text: json.text, raw: json });
        }
        else if (json?.outputText) {
            normalized.choices.push({ text: json.outputText, raw: json });
        }
        else {
            normalized.choices.push({ text: JSON.stringify(json).slice(0, 400), raw: json });
        }
    }
    catch (e) {
        normalized.choices.push({ text: JSON.stringify(json).slice(0, 400), raw: json });
    }
    if (json?.usage)
        normalized.usage = json.usage;
    else if (json?.metadata?.tokenCount)
        normalized.usage = { total_tokens: json.metadata.tokenCount };
    return normalized;
}
exports.default = { callGemini };
