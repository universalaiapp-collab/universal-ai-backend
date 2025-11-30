// src/services/scoring.service.ts
// Simple numeric scoring for providers/models.
// Exports: getScores(), getOrderedCandidates()

import { isOpen } from "../lib/circuitBreaker";

export type Candidate = { provider: string; model: string; baseScore: number };

const CONFIG: Candidate[] = [
  { provider: "openai", model: process.env.OPENAI_MODEL ?? "gpt-4o-mini", baseScore: 95 },
  { provider: "gemini", model: process.env.GEMINI_MODEL ?? "gemini-pro", baseScore: 90 },
  // add more providers/models here with base scores
];

/**
 * Compute scores for candidates, reducing score if circuit-breaker is open.
 */
export function getScores(): Candidate[] {
  // copy
  return CONFIG.map((c) => {
    const open = isOpen(c.provider);
    const penalty = open ? 1000 : 0; // large penalty to push it to end
    return { ...c, baseScore: c.baseScore - penalty };
  });
}

/**
 * Return ordered candidates (highest score first), excluding fully penalized providers.
 */
export function getOrderedCandidates(): Candidate[] {
  const scored = getScores();
  const ordered = scored
    .filter((s) => s.baseScore > -100) // keep all unless massively penalized
    .sort((a, b) => b.baseScore - a.baseScore);
  return ordered;
}
