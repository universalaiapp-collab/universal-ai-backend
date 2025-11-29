"use strict";
// src/middleware/moderation.middleware.ts
// Lightweight moderation utilities. Throw on violation.
// For production use integrate real moderation APIs.
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestModeration = void 0;
exports.moderateInput = moderateInput;
const TOXIC_WORDS = ['kill', 'bomb', 'terror', 'suicide']; // example shortlist
const NSFW_WORDS = ['nude', 'porn', 'xxx'];
async function moderateInput(text) {
    if (!text || typeof text !== 'string') {
        const e = new Error('Moderation: invalid input');
        e.status = 400;
        throw e;
    }
    const low = text.toLowerCase();
    for (const w of TOXIC_WORDS) {
        if (low.includes(w)) {
            const err = new Error('Moderation blocked: violence/terror content detected');
            err.status = 422;
            throw err;
        }
    }
    for (const w of NSFW_WORDS) {
        if (low.includes(w)) {
            const err = new Error('Moderation blocked: NSFW content detected');
            err.status = 422;
            throw err;
        }
    }
    // Could call external safety provider here
    return true;
}
// Express middleware wrapper
const requestModeration = async (req, res, next) => {
    try {
        const prompt = (req.body && req.body.prompt) || '';
        await moderateInput(prompt);
        return next();
    }
    catch (err) {
        // err is unknown by TS in catch - cast to any
        const e = err;
        return res.status(e?.status || 422).json({ ok: false, error: e?.message || String(err) });
    }
};
exports.requestModeration = requestModeration;
exports.default = {
    moderateInput,
    requestModeration: exports.requestModeration,
};
