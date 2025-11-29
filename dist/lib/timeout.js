"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withTimeout = withTimeout;
// src/lib/timeout.ts
function withTimeout(promise, ms, onTimeoutError = new Error('provider_timeout')) {
    let timer;
    const timeout = new Promise((_, rej) => {
        timer = setTimeout(() => rej(onTimeoutError), ms);
    });
    return Promise.race([
        promise.then((res) => { clearTimeout(timer); return res; }),
        timeout
    ]);
}
