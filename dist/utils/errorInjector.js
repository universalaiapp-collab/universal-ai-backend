"use strict";
// Utility to simulate controlled errors for testing.
// Use header: x-orch-fault: throw|timeout|slow
Object.defineProperty(exports, "__esModule", { value: true });
const maybeThrow = (req) => {
    const header = (req.headers && (req.headers['x-orch-fault'] || req.headers['x-orch-fault'])) || '';
    const fault = String(header || '').toLowerCase();
    if (!fault)
        return;
    if (fault === 'throw') {
        const e = new Error('Injected error (for testing)');
        e.status = 500;
        throw e;
    }
    if (fault === 'timeout') {
        // simulate a long synchronous block (not recommended in prod, only for dev)
        const t = Date.now() + 5000;
        while (Date.now() < t) {
            // busy wait 5s
        }
    }
    if (fault === 'slow') {
        // attach a flag — orchestrator can check if necessary
        req._orch_injected_slow = true;
    }
};
exports.default = { maybeThrow };
