import modelScorer from "./modelScorer";

/**
 * metaRouter.choose(prompt, opts)
 * - returns ordered list of candidates: [{ provider: 'openai', model: 'gpt-4o-mini' }, ...]
 *
 * This uses the modelScorer to compute scores and then orders / filters.
 */

type Candidate = { provider: string; model: string; score: number };

const DEFAULT_CATALOG: Array<{ provider: string; model: string; tags?: string[] }> = [
  { provider: "openai", model: "gpt-4o-mini", tags: ["fast", "chat"] },
  { provider: "gemini", model: "gemini-pro", tags: ["creative"] },
  { provider: "anthropic", model: "claude-2", tags: ["safety"] }
];

// user can hint preferredModel
async function choose(prompt: string, opts?: { hint?: string; userId?: string }): Promise<Array<{provider:string, model:string}>> {
  // 1) Build candidate list (could be dynamic from DB in prod)
  const raw = DEFAULT_CATALOG.map((c) => ({ ...c }));

  // 2) Score each candidate
  const scored: Candidate[] = [];
  for (const c of raw) {
    const score = await modelScorer.score(c.provider, c.model, prompt, opts);
    scored.push({ provider: c.provider, model: c.model, score });
  }

  // 3) Sort by descending score
  scored.sort((a, b) => b.score - a.score);

  // 4) If user provided hint, bump hint to top (but keep scoring order for tie-breaks)
  if (opts?.hint) {
    const hint = opts.hint.toLowerCase();
    scored.sort((a, b) => {
      const aHint = a.model.toLowerCase().includes(hint) || a.provider.toLowerCase().includes(hint) ? 1 : 0;
      const bHint = b.model.toLowerCase().includes(hint) || b.provider.toLowerCase().includes(hint) ? 1 : 0;
      if (aHint !== bHint) return bHint - aHint; // bring hinted ones earlier
      return b.score - a.score;
    });
  }

  // Return as minimal candidate objects for orchestrator
  return scored.map((s) => ({ provider: s.provider, model: s.model }));
}

export default { choose };
