"use strict";
// src/services/scoring.service.ts
// Simple numeric scoring for providers/models.
// Exports: getScores(), getOrderedCandidates()
Object.defineProperty(exports, "__esModule", { value: true });
exports.getScores = getScores;
exports.getOrderedCandidates = getOrderedCandidates;
const circuitBreaker_1 = require("../lib/circuitBreaker");
const CONFIG = [
    { provider: "openai", model: process.env.OPENAI_MODEL ?? "gpt-4o-mini", baseScore: 95 },
    { provider: "gemini", model: process.env.GEMINI_MODEL ?? "gemini-pro", baseScore: 90 },
    // add more providers/models here with base scores
];
/**
 * Compute scores for candidates, reducing score if circuit-breaker is open.
 */
function getScores() {
    // copy
    return CONFIG.map((c) => {
        const open = (0, circuitBreaker_1.isOpen)(c.provider);
        const penalty = open ? 1000 : 0; // large penalty to push it to end
        return { ...c, baseScore: c.baseScore - penalty };
    });
}
/**
 * Return ordered candidates (highest score first), excluding fully penalized providers.
 */
function getOrderedCandidates() {
    const scored = getScores();
    const ordered = scored
        .filter((s) => s.baseScore > -100) // keep all unless massively penalized
        .sort((a, b) => b.baseScore - a.baseScore);
    return ordered;
}
