#!/usr/bin/env node
// Phase 4 helpers (plan docs/superpowers/plans/2026-11-23-m3-forge-phase-4.md): seeded draws recorded
// before any result, the weak-cell rule and the keep rule of owner decision 5 (2026-11-23).
//   node evals/tools/phase4.mjs draw spotcheck
//   node evals/tools/phase4.mjs draw regression <round> <cell,cell,...re-run in that round>
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { evalCells } from './cells.mjs';

export const PLATFORMS = ['web', 'flutter', 'compose'];
export const SEEDS = { spotcheck: 'm3-forge-phase4-spotcheck', regression: 'm3-forge-phase4-regression' };

// Deterministic pick: the candidates sorted by id, index = first 6 bytes of sha256(seed) mod n.
export function seededPick(ids, seed) {
  const sorted = [...ids].sort();
  if (!sorted.length) return null;
  const h = createHash('sha256').update(seed).digest();
  return sorted[h.readUIntBE(0, 6) % sorted.length];
}

// Spot-check sample per platform (plan, owner sign-off): one drawn default cell, the classic cell and
// the seed cell. The hold-out cell is drawn the same way once the hold-out cells exist (step 3).
export function spotcheckSample(cells = evalCells()) {
  return Object.fromEntries(PLATFORMS.map((p) => {
    const mine = cells.filter((c) => c.platform === p);
    const defaults = mine.filter((c) => c.variant === 'default').map((c) => c.cell);
    return [p, {
      default: seededPick(defaults, `${SEEDS.spotcheck}|${p}`),
      classic: mine.find((c) => c.variant === 'classic')?.cell ?? null,
      seed: mine.find((c) => c.variant.startsWith('seed:') || c.variant.startsWith('seed-'))?.cell ?? null,
    }];
  }));
}

// Regression sample for a round: one cell per platform among the eval cells NOT re-run in that round.
export function regressionSample(round, rerun, cells = evalCells()) {
  return Object.fromEntries(PLATFORMS.map((p) => [p, seededPick(cells.filter((c) => c.platform === p && !rerun.includes(c.cell)).map((c) => c.cell), `${SEEDS.regression}|r${round}|${p}`)]));
}

// Owner decision 5: the weak-cell rule. medians: {item: median}; auto: number of automated findings
// (verify scored + unscored + runtime); missing: requested elements not visible.
export const F9F10 = ['hierarchy-typography', 'spacing-layout', 'component-choice', 'overall-polish'];
export function weakReasons({ medians, auto = 0, missing = [] }) {
  const out = [];
  for (const [it, m] of Object.entries(medians)) if (typeof m === 'number' && m < 2) out.push(`${it} ${m} < 2`);
  for (const it of F9F10) { const m = medians[it]; if (typeof m === 'number' && m < 2.5 && m >= 2) out.push(`${it} ${m} < 2.5`); }
  if (auto > 0) out.push(`${auto} automated finding(s)`);
  for (const e of missing) out.push(`not visible: ${e}`);
  return out;
}

// Owner decision 5: the keep rule. targeted: [{ cell, items: [...], before: {item: m}, after: {item: m} }];
// regression: [{ cell, before: {item: m}, after: {item: m}, autoAfter }]. Kept when the targeted items
// improve in the medians (mean over the targeted cell-item pairs rises) and no regression cell drops an
// item by 1 or more nor gains an automated finding.
export function keepDecision({ targeted, regression }) {
  const pairs = targeted.flatMap((t) => t.items.map((it) => ({ cell: t.cell, item: it, before: t.before[it], after: t.after[it] })))
    .filter((p) => typeof p.before === 'number' && typeof p.after === 'number');
  const avg = (k) => (pairs.length ? pairs.reduce((a, p) => a + p[k], 0) / pairs.length : null);
  const improved = pairs.length > 0 && avg('after') > avg('before');
  const drops = regression.flatMap((r) => Object.keys(r.before).filter((it) => typeof r.after[it] === 'number' && r.before[it] - r.after[it] >= 1)
    .map((it) => ({ cell: r.cell, item: it, before: r.before[it], after: r.after[it] })));
  const autoHits = regression.filter((r) => (r.autoAfter ?? 0) > 0).map((r) => r.cell);
  return { keep: improved && !drops.length && !autoHits.length, improved, before: avg('before'), after: avg('after'), pairs: pairs.length, drops, autoHits };
}

// Automated findings of one recorded cell: every verify count, scored and unscored (runtime contrast and
// targets are merged into verify's counts); a cell without a verify result counts as one finding.
export function autoFindings(verifyJson) {
  if (!verifyJson || verifyJson.error) return { total: 1, detail: { 'no-verify': 1 } };
  const detail = Object.fromEntries(Object.entries({ ...(verifyJson.counts ?? {}), ...(verifyJson.unscored ?? {}) }).filter(([, n]) => n > 0));
  return { total: Object.values(detail).reduce((a, n) => a + n, 0), detail };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const [cmd, what, round, rerun] = process.argv.slice(2);
  if (cmd === 'weak') {
    // node evals/tools/phase4.mjs weak <pool-id> <runId> [missing.json: {cell: [element, ...]}]
    const { readFileSync, existsSync } = await import('node:fs');
    const { join, dirname } = await import('node:path');
    const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
    const [, pool, runId, missingFile] = process.argv.slice(2);
    const sum = JSON.parse(readFileSync(join(root, 'private', 'evals', 'runs', `pooled3-${pool}`, 'summary.json'), 'utf8'));
    const missing = missingFile ? JSON.parse(readFileSync(missingFile, 'utf8')) : {};
    const out = [];
    for (const row of sum.rows.filter((r) => r.runId === runId)) {
      const vf = join(root, 'private', 'evals', 'runs', runId, row.cell, 'verify.json');
      const auto = autoFindings(existsSync(vf) ? JSON.parse(readFileSync(vf, 'utf8')) : null);
      const reasons = weakReasons({ medians: row.median, auto: auto.total, missing: missing[row.cell] ?? [] });
      out.push({ cell: row.cell, weak: reasons.length > 0, reasons, auto: auto.detail, median: row.median });
    }
    out.sort((a, b) => b.reasons.length - a.reasons.length);
    console.log(JSON.stringify(out, null, 1));
  } else if (cmd === 'draw' && what === 'spotcheck') console.log(JSON.stringify(spotcheckSample(), null, 2));
  else if (cmd === 'draw' && what === 'regression' && round) console.log(JSON.stringify(regressionSample(Number(round), (rerun ?? '').split(',').filter(Boolean)), null, 2));
  else { console.error('usage: phase4.mjs draw spotcheck | draw regression <round> <rerun cells>'); process.exit(2); }
}
