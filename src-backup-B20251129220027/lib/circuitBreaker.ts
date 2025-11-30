// src/lib/circuitBreaker.ts
// Simple in-memory circuit breaker for providers.
// Exports: isOpen(provider), recordFailure(provider), recordSuccess(provider), getState(provider)

type CBState = {
  failures: number;
  lastFailureTs?: number;
  openUntil?: number; // timestamp ms until which CB is open
};

const states = new Map<string, CBState>();

const DEFAULTS = {
  FAILURE_THRESHOLD: 3,    // failures to open
  COOLDOWN_MS: 30_000,     // time CB stays open
  HALF_OPEN_TRIES: 1,      // allow 1 probe when half-open
};

export function getState(provider: string): CBState {
  if (!states.has(provider)) states.set(provider, { failures: 0 });
  return states.get(provider)!;
}

export function isOpen(provider: string): boolean {
  const s = getState(provider);
  const now = Date.now();
  if (!s.openUntil) return false;
  if (now >= s.openUntil) {
    // cooldown passed -> half-open (we allow a probe)
    return false;
  }
  return true;
}

export function recordFailure(provider: string) {
  const s = getState(provider);
  s.failures = (s.failures || 0) + 1;
  s.lastFailureTs = Date.now();

  if (s.failures >= DEFAULTS.FAILURE_THRESHOLD) {
    // open circuit
    s.openUntil = Date.now() + DEFAULTS.COOLDOWN_MS;
    // reset failures so we count new failures after cooldown separately
    s.failures = 0;
    console.warn(`Circuit breaker opened for ${provider} until ${new Date(s.openUntil).toISOString()}`);
  } else {
    console.warn(`Recorded failure for ${provider} (failures=${s.failures})`);
  }
}

export function recordSuccess(provider: string) {
  const s = getState(provider);
  // reset failures on success
  s.failures = 0;
  s.openUntil = undefined;
  s.lastFailureTs = undefined;
}
