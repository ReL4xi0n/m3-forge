// Automated rubric items, by version (evals/automated-v2.md).
// v1: rubric v1's table (frozen at adf8854). v2 (owner, 2026-11-17): icon source is its own item, so
// one rule (Flutter Icons.*) no longer zeroes anti-patterns by itself.
export const BANDS = {
  v1: {
    'token-fidelity': { checks: ['hardcoded-color', 'off-token-type', 'off-token-radius'], perLines: true, cut: [0, 1, 5] },
    'contrast-targets': { checks: ['contrast', 'touch-target'], cut: [0, 2, 6] },
    'anti-patterns': { checks: ['shadow-gradient', 'icon-source', 'foreign-styling'], cut: [0, 1, 4] },
  },
  v2: {
    'token-fidelity': { checks: ['hardcoded-color', 'off-token-type', 'off-token-radius'], perLines: true, cut: [0, 1, 5] },
    'contrast-targets': { checks: ['contrast', 'touch-target'], cut: [0, 2, 6] },
    'anti-patterns': { checks: ['shadow-gradient', 'foreign-styling'], cut: [0, 1, 4] },
    'icon-source': { checks: ['icon-source'], cut: [0, 1, 4] },
  },
};

// 3 at the first cut, 2 up to the second, 1 up to the third, else 0; no buildable output scores 0.
export function automatedScores(verifyResult, buildOk, version = 'v1') {
  const bands = BANDS[version];
  if (!bands) throw new Error(`unknown automated version ${version}`);
  const out = {};
  for (const [item, b] of Object.entries(bands)) {
    if (!buildOk || !verifyResult) { out[item] = 0; continue; }
    const n = b.checks.reduce((a, c) => a + (verifyResult.counts?.[c] ?? 0), 0);
    const x = b.perLines ? (n * 100) / Math.max(1, verifyResult.uiLines ?? 0) : n;
    out[item] = x <= b.cut[0] ? 3 : x <= b.cut[1] ? 2 : x <= b.cut[2] ? 1 : 0;
  }
  return out;
}
