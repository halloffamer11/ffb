/**
 * Position Tier Analysis
 * - Compute tiers based on VBD delta thresholds
 * - Threshold = stdDev(vbd) * 0.5 for the position cohort
 * - Exclude IR players from tier calculation (but keep index for display)
 */

export function computeTiers(playersByPosition) {
  const result = new Map();
  for (const [position, players] of playersByPosition.entries()) {
    const sorted = players.slice().sort((a, b) => (b.vbd || 0) - (a.vbd || 0));
    const vbdValues = sorted.map(p => p.vbd || 0);
    const threshold = stdDev(vbdValues) * 0.5;
    const tiers = [];
    let currentTier = [];
    for (let i = 0; i < sorted.length; i += 1) {
      if (i > 0) {
        const delta = (sorted[i - 1].vbd || 0) - (sorted[i].vbd || 0);
        if (delta > threshold) {
          tiers.push(currentTier);
          currentTier = [];
        }
      }
      currentTier.push(sorted[i]);
    }
    if (currentTier.length) tiers.push(currentTier);
    result.set(position, { tiers, threshold });
  }
  return result;
}

export function stdDev(values) {
  if (!values.length) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}


