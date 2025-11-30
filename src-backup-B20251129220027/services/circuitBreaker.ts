/**
 * Simple in-memory circuit breaker per-provider.
 * - tracks recent failures and success counts
 * - trips (open) when consecutive failures exceed threshold
 * - auto-resets after coolDownMs
 *
 * Not distributed â€” for single-instance MVP only. Replace with Redis for multi-instance.
 */

type ProviderState = {
  failures: number;
  successes: number;
  lastFailureAt?: number;
  openUntil?: number; // timestamp until which circuit is open
};

const STATES: Record<string, ProviderState> = {};
const FAILURE_THRESHOLD = 3; // consecutive failures to open
const COOL_DOWN_MS = 30_000; // 30s open time for early version
const WINDOW_MS = 60_000; // sliding window for failure rate

function ensureState(provider: string) {
  if (!STATES[provider]) {
    STATES[provider] = { failures: 0, successes: 0 };
  }
  return STATES[provider];
}

function onSuccess(provider: string) {
  const s = ensureState(provider);
  s.successes = (s.successes || 0) + 1;
  s.failures = 0;
  s.openUntil = undefined;
}

function onFailure(provider: string) {
  const s = ensureState(provider);
  s.failures = (s.failures || 0) + 1;
  s.lastFailureAt = Date.now();

  if (s.failures >= FAILURE_THRESHOLD) {
    s.openUntil = Date.now() + COOL_DOWN_MS;
    console.warn(`Circuit breaker for ${provider} opened until ${new Date(s.openUntil).toISOString()}`);
  }
}

function isOpen(provider: string) {
  const s = STATES[provider];
  if (!s) return false;
  if (s.openUntil && Date.now() < s.openUntil) return true;
  // otherwise, if openUntil expired, reset counters
  if (s.openUntil && Date.now() >= s.openUntil) {
    s.openUntil = undefined;
    s.failures = 0;
    s.successes = 0;
    return false;
  }
  return false;
}

function getFailureRate(provider: string) {
  const s = STATES[provider];
  if (!s) return 0;
  const failures = s.failures ?? 0;
  const successes = s.successes ?? 0;
  const total = failures + successes;
  if (total === 0) return 0;
  return failures / total;
}

export default {
  onSuccess,
  onFailure,
  isOpen,
  getFailureRate,
};
