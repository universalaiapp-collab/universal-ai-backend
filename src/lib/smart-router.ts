// src/lib/smart-router.ts
// Robust provider loader + smart router (fixed to search inside `providers/` directory)
// Works for both dev (src/) and built (dist/) runs.

import path from 'path';
import fs from 'fs';
import { tryProvider } from './tryProvider';
import { isOpen, recordFailure, recordSuccess } from '../lib/circuitBreaker';
import { ProviderResponse } from '../types';

function tryRequire(p: string) {
  try {
    return require(p);
  } catch (e) {
    throw e;
  }
}

/**
 * Try a set of plausible absolute paths to the module.
 * We check:
 *  - dist/providers/<name>.js  (runtime compiled)
 *  - dist/<name>.js            (older layout)
 *  - src/providers/<name>.ts   (dev / ts-node)
 *  - src/providers/<name>.js   (if transpiled locally)
 *  - process.cwd()/<name>
 *  - fallback to require('../providers/<name>')
 */
function loadProviderCandidates(name: string) {
  const candPaths = [
    path.join(__dirname, '..', 'providers', name),            // dist/lib -> dist/providers/<name>
    path.join(__dirname, '..', name),                         // dist/lib -> dist/<name>
    path.join(process.cwd(), 'dist', 'providers', name),      // absolute: project/dist/providers/<name>
    path.join(process.cwd(), 'dist', name),                   // absolute: project/dist/<name>
    path.join(process.cwd(), 'src', 'providers', name),       // src/providers/<name>
    path.join(process.cwd(), 'src', name),                    // src/<name>
    path.join(process.cwd(), name),                           // project root fallback
  ];

  for (const c of candPaths) {
    try {
      // accept .js or .ts or direct path
      if (fs.existsSync(c + '.js') || fs.existsSync(c + '.ts') || fs.existsSync(c)) {
        const mod = tryRequire(c);
        return mod?.default ?? mod;
      }
    } catch (err) {
      // ignore and try next
    }
  }

  // last-resort relative require
  try {
    const mod = tryRequire(`../providers/${name}`);
    return mod?.default ?? mod;
  } catch (err) {
    // couldn't load
    return null;
  }
}

/* Load providers */
const providerA: any = loadProviderCandidates('providerA');
const providerB: any = loadProviderCandidates('providerB');
const openaiProvider: any = loadProviderCandidates(path.join('providers', 'openai.provider'));
const geminiProvider: any = loadProviderCandidates(path.join('providers', 'gemini.provider'));
const anthropicProvider: any = loadProviderCandidates(path.join('providers', 'anthropic.provider'));
const ollamaProvider: any = loadProviderCandidates(path.join('providers', 'ollama.provider'));

// Startup debug: will show which providers were found (true = loaded)
console.info('[smart-router] providerA loaded?', !!providerA, 'providerB loaded?', !!providerB, 'openai?', !!openaiProvider, 'gemini?', !!geminiProvider);

const DEFAULT_PRIORITY = (process.env.PROVIDER_PRIORITY || 'providerA,openai,gemini,providerB,anthropic,ollama')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const REGISTRY: Record<string, { id: string; call: (input: any) => Promise<ProviderResponse>; supports?: string[] } | null> = {
  providerA,
  providerB,
  openai: openaiProvider,
  gemini: geminiProvider,
  anthropic: anthropicProvider,
  ollama: ollamaProvider,
};

export async function chooseAndRun(
  kind: 'chat' | 'image' | 'embedding' | 'generic',
  payload: any,
  opts: { timeoutMs?: number; retries?: number; priority?: string[] } = {}
) {
  const priority = opts.priority ?? DEFAULT_PRIORITY;
  const errors: any[] = [];

  for (const pid of priority) {
    const p = REGISTRY[pid];
    if (!p) {
      errors.push({ provider: pid, error: 'unknown_provider' });
      continue;
    }

    if ((p as any).supports && kind !== 'generic' && !(p as any).supports.includes(kind)) {
      errors.push({ provider: pid, error: 'unsupported_kind' });
      continue;
    }

    try {
      if (isOpen(pid)) {
        errors.push({ provider: pid, error: 'circuit_open' });
        continue;
      }
    } catch (e) {
      console.warn('[smart-router] circuitChecker error', e);
    }

    try {
      const r: any = await tryProvider(pid, (p as any).call.bind(p), payload, { timeoutMs: opts.timeoutMs, retries: opts.retries });
      if (r && r.ok) {
        try { recordSuccess(pid); } catch (e) {}
        const rAny: any = r;
        return {
          success: true,
          provider: pid,
          data: rAny.response?.data ?? rAny.response ?? null,
          latencyMs: rAny.duration ?? rAny.response?.latencyMs ?? 0,
          costTokens: rAny.costTokens ?? rAny.response?.costTokens ?? 0,
        };
      } else {
        try { recordFailure(pid); } catch (e) {}
        errors.push({ provider: pid, error: r?.error ?? r });
        continue;
      }
    } catch (outerErr) {
      try { recordFailure(pid); } catch (e) {}
      errors.push({ provider: pid, error: outerErr });
      continue;
    }
  }

  return { success: false, errors };
}
