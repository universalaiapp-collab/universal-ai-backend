"use strict";
// Safety middleware: simple jailbreak & provider guardrail checks
// Extend with advanced logic as needed.
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestSafetyGuard = exports.toxicityFilter = exports.checkJailbreak = void 0;
const JAILBREAK_PATTERNS = [
    /ignore (previous )?instructions/i,
    /bypass (filters|moderation)/i,
    /give me (the )?raw/i,
];
const checkJailbreak = (text) => {
    const low = text.toLowerCase();
    return JAILBREAK_PATTERNS.some((r) => r.test(low));
};
exports.checkJailbreak = checkJailbreak;
const toxicityFilter = (text) => {
    // re-use moderation checks or advanced checks
    return false;
};
exports.toxicityFilter = toxicityFilter;
const requestSafetyGuard = (req, res, next) => {
    const prompt = (req.body && req.body.prompt) || '';
    if ((0, exports.checkJailbreak)(prompt)) {
        return res.status(422).json({ ok: false, error: 'Safety block: possible jailbreak attempt' });
    }
    // provider guardrails example: disallow system-level instructions
    if (/act as an admin|expose secret|private key/i.test(prompt)) {
        return res.status(422).json({ ok: false, error: 'Safety block: forbidden instruction' });
    }
    return next();
};
exports.requestSafetyGuard = requestSafetyGuard;
exports.default = { requestSafetyGuard: exports.requestSafetyGuard, checkJailbreak: exports.checkJailbreak, toxicityFilter: exports.toxicityFilter };
