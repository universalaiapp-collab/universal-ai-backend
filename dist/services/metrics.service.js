"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordMetrics = recordMetrics;
exports.queryMetrics = queryMetrics;
// src/services/metrics.service.ts
const metrics_model_1 = __importDefault(require("../models/metrics.model"));
async function recordMetrics(doc) {
    return metrics_model_1.default.create(doc);
}
async function queryMetrics(query = {}, limit = 100) {
    return metrics_model_1.default.find(query).sort({ createdAt: -1 }).limit(limit).lean();
}
