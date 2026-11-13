#!/usr/bin/env node
// Judge calibration (Phase 2 plan, Task 11). The owner's real product screenshots anchor score 3:
// half are shown to the judge as labeled score-3 examples (anchors), half are mixed unlabeled with
// hand-written defect pages (checks). Pass: every applicable item's mean over check references is
// ≥ 2.75 with no reference score below 2, and every defect page scores ≤ its maxScore on its item.
import { ITEMS } from './judge.mjs';

const REF = /^(android|web)-(expressive|classic|current)-(.+)-(light|dark)-(\d+)\.png$/;

export function parseRefName(name) {
  const m = name.match(REF);
  return m ? { platform: m[1], style: m[2], screen: m[3], theme: m[4], n: Number(m[5]) } : null;
}

export function splitReferences(names) {
  const refs = names.filter(n => parseRefName(n)).sort();
  if (refs.length < 12) throw new Error(`need at least 12 reference screenshots, found ${refs.length}`);
  const anchors = [];
  const checks = [];
  for (const platform of ['android', 'web']) {
    const list = refs.filter(n => n.startsWith(`${platform}-`)).sort((a, b) => {
      const x = parseRefName(a); const y = parseRefName(b);
      return x.screen.localeCompare(y.screen) || x.theme.localeCompare(y.theme) || x.style.localeCompare(y.style) || x.n - y.n;
    });
    list.forEach((n, i) => (i % 2 === 0 ? anchors : checks).push(n));
  }
  return { anchors: anchors.sort(), checks: checks.sort() };
}

const SCREEN = {
  landing: 'A landing page', settings: 'A settings screen', dashboard: 'A dashboard screen',
  'product-detail': 'A product detail page', onboarding: 'An onboarding form', empty: 'An empty state screen',
  error: 'An error state screen', main: 'A main app screen', list: 'A list screen',
};

export function referenceRequest(ref) {
  const what = SCREEN[ref.screen] ?? `A ${ref.screen.replace(/-/g, ' ')} screen`;
  const platform = ref.platform === 'android' ? 'Android' : 'web';
  const style = ref.style === 'classic' ? ' Use the classic Material 3 style, not M3 Expressive.' : '';
  return `${what}. Platform: ${platform}.${style}`;
}

// scores: validated judge entries; mapping: id → { kind: 'reference' | 'defect', name, theme? }
export function evaluateCalibration({ scores, mapping, expected }) {
  const failures = [];
  const byId = {};
  for (const s of scores) (byId[s.id] ??= {})[s.item] = s.score;
  const referenceMeans = {};
  for (const item of ITEMS) {
    const vals = Object.entries(mapping)
      .filter(([, m]) => m.kind === 'reference' && (item !== 'dark-mode' || m.theme === 'dark'))
      .map(([id]) => byId[id]?.[item]).filter(v => v !== undefined);
    if (!vals.length) continue;
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    referenceMeans[item] = mean;
    if (mean < 2.75) failures.push(`reference mean for ${item} is ${mean.toFixed(2)} (< 2.75)`);
    const low = vals.filter(v => v < 2).length;
    if (low) failures.push(`${low} reference score(s) below 2 on ${item}`);
  }
  const defects = {};
  for (const [id, m] of Object.entries(mapping)) {
    if (m.kind !== 'defect') continue;
    const e = expected[m.name];
    if (!e) { failures.push(`no expectation for defect ${m.name}`); continue; }
    const score = byId[id]?.[e.item];
    const ok = score !== undefined && score <= e.maxScore;
    defects[m.name] = { item: e.item, score, ok };
    if (!ok) failures.push(`defect ${m.name}: ${e.item} scored ${score} (> ${e.maxScore})`);
  }
  return { pass: failures.length === 0, failures, referenceMeans, defects };
}
