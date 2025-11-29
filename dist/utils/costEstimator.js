"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.estimateCost = void 0;
// src/utils/costEstimator.ts
const globalConfig_1 = __importDefault(require("../config/globalConfig"));
/**
 * estimateCost(modelKey, totalTokens)
 * - modelKey: key from GLOBAL.cost.costPer1KTokens (e.g. "openai-primary")
 * - totalTokens: integer
 *
 * Returns number (cost in same currency units used in GLOBAL config, placeholder)
 */
const estimateCost = (modelKey, totalTokens) => {
    const per1k = globalConfig_1.default.cost?.costPer1KTokens?.[modelKey] ?? 0.01;
    const cost = per1k * (totalTokens / 1000);
    return cost;
};
exports.estimateCost = estimateCost;
exports.default = exports.estimateCost;
