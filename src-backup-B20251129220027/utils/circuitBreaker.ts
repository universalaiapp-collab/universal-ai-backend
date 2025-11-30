// src/utils/circuitBreaker.ts
type ProviderState = {
  name: string;
  failures: number[]; // epoch ms timestamps
  downUntil?: number; // epoch ms when to auto-recover
  consecutiveFails: number;
  lastLatencyMs?: number;
};

const PROVIDER_FAIL_WINDOW_MS = 60_000; // 60 sec
const FAILURE_THRESHOLD = 3; // 3 fails in window => DOWN
const COOLDOWN_MS = 30_000; // auto-recover after 30s (adjustable)

const providers: Record<string, ProviderState> = {};

/** ensure provider present */
export function initProvider(name: string) {
  if (!providers[name]) {
    providers[name] = { name, failures: [], consecutiveFails: 0 };
  }
}

/** record a failure timestamp */
export function recordFailure(name: string) {
  initProvider(name);
  const now = Date.now();
  providers[name].failures.push(now);
  providers[name].consecutiveFails = (providers[name].consecutiveFails || 0) + 1;

  // prune old failures
  providers[name].failures = providers[name].failures.filter(
    (t) => now - t <= PROVIDER_FAIL_WINDOW_MS
  );

  if (providers[name].failures.length >= FAILURE_THRESHOLD) {
    providers[name].downUntil = now + COOLDOWN_MS;
    providers[name].consecutiveFails = 0; // reset consecutive after marking down
  }
}

/** record a success (resets consecutive fail counter) */
export function recordSuccess(name: string, latencyMs?: number) {
  initProvider(name);
  providers[name].consecutiveFails = 0;
  providers[name].failures = [];
  if (typeof latencyMs === 'number') providers[name].lastLatencyMs = latencyMs;
}

/** check if provider is considered DOWN */
export function isProviderDown(name: string) {
  initProvider(name);
  const p = providers[name];
  if (!p.downUntil) return false;
  if (Date.now() >= p.downUntil) {
    // recovered
    p.downUntil = undefined;
    p.failures = [];
    return false;
  }
  return true;
}

/** get provider state (for /orch/status) */
export function getProviderStates() {
  // shallow copy
  return Object.values(providers).map((p) => ({
    name: p.name,
    failures: p.failures.slice(-10),
    downUntil: p.downUntil,
    consecutiveFails: p.consecutiveFails,
    lastLatencyMs: p.lastLatencyMs,
  }));
}
