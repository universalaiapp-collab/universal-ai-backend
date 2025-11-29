"use strict";
// src/logger.ts
// Minimal, safe logger with both ESM default export and CommonJS compatibility.
Object.defineProperty(exports, "__esModule", { value: true });
const ts = () => new Date().toISOString();
const logger = {
    info: ((...args) => {
        try {
            console.log(`[info] ${ts()}`, ...args);
        }
        catch { /* swallow */ }
    }),
    warn: ((...args) => {
        try {
            console.warn(`[warn] ${ts()}`, ...args);
        }
        catch { /* swallow */ }
    }),
    error: ((...args) => {
        try {
            console.error(`[error] ${ts()}`, ...args);
        }
        catch { /* swallow */ }
    }),
    debug: ((...args) => {
        try {
            console.debug(`[debug] ${ts()}`, ...args);
        }
        catch { /* swallow */ }
    }),
};
exports.default = logger;
if (typeof module !== "undefined" && module.exports) {
    module.exports = logger;
}
