/** Micro-benchmark helpers (T-026 scaffolding) */

export function timeFunction(fn, iterations = 1) {
  const t0 = nowMs();
  let last;
  for (let i = 0; i < iterations; i += 1) last = fn();
  const t1 = nowMs();
  return { durationMs: t1 - t0, last };
}

export function nowMs() {
  try { return Number(process.hrtime.bigint()) / 1e6; } catch { return Date.now(); }
}


