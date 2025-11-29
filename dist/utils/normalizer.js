"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizePrompt = normalizePrompt;
function normalizePrompt(text, type) {
    // Basic normalization: trim, collapse whitespace, remove weird control chars
    let t = (text || '').replace(/\s+/g, ' ').trim();
    // add a system prefix for chat type
    if (type === 'chat' && !/^user:/i.test(t)) {
        t = `user: ${t}`;
    }
    return t;
}
exports.default = { normalizePrompt };
