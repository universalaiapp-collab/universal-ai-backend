// src/logger.ts
// Minimal, safe logger with both ESM default export and CommonJS compatibility.

const ts = () => new Date().toISOString();

type LogFn = (...args: any[]) => void;

const logger = {
  info: ((...args: any[]) => {
    try { console.log(`[info] ${ts()}`, ...args); } catch { /* swallow */ }
  }) as LogFn,

  warn: ((...args: any[]) => {
    try { console.warn(`[warn] ${ts()}`, ...args); } catch { /* swallow */ }
  }) as LogFn,

  error: ((...args: any[]) => {
    try { console.error(`[error] ${ts()}`, ...args); } catch { /* swallow */ }
  }) as LogFn,

  debug: ((...args: any[]) => {
    try { console.debug(`[debug] ${ts()}`, ...args); } catch { /* swallow */ }
  }) as LogFn,
};

export default logger;

// CommonJS compatibility so `require('./logger')` returns same shape
// (TypeScript will allow this; the cast avoids type errors)
declare const module: any;
if (typeof module !== "undefined" && module.exports) {
  module.exports = logger;
}
