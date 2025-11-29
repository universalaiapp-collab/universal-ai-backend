"use strict";
/**
 * withTimeout(promise, ms)
 * - wraps a promise and rejects if timeout
 * Uses AbortController pattern for axios-ready APIs though our simulated calls don't use it.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.withTimeout = withTimeout;
function withTimeout(p, ms) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error(`Operation timed out after ${ms}ms`));
        }, ms);
        p.then((v) => {
            clearTimeout(timer);
            resolve(v);
        }).catch((err) => {
            clearTimeout(timer);
            reject(err);
        });
    });
}
