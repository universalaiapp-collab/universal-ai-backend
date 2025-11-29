"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMetrics = exports.logCall = void 0;
const metricsStore = [];
const logCall = (m) => {
    metricsStore.push(m);
    // For day-1, keep it small: print a summary line
    console.log(`[METRICS] user=${m.userId || "anon"} model=${m.model} tokens=${m.totalTokens} cost=${m.estCost.toFixed(6)}`);
};
exports.logCall = logCall;
const getMetrics = () => metricsStore.slice(-200);
exports.getMetrics = getMetrics;
