#!/usr/bin/env node
// Failure-map trace for the material3 skill (Phase 3 plan, "Failure map"). Every rule bullet in
// SKILL.md and CHECKLIST.md cites the failure it closes (F1-F12) or W for a workflow step, and every
// failure has at least one rule and at least one asset or check that closes it. References keep the
// knowledge/ marker rule: a hex color or a number with a unit carries [token:], [impl:] or [site:].
//
//   skillTrace(skillDir, { repoRoot }) -> { untagged: string[], uncovered: string[], unmarked: string[],
//                                           tooLong: string | null }
// CLI: node tools/ci/skill-trace.mjs [skillDir]   (exit 1 when any list is non-empty)
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const SKILL_MAX_LINES = 200;
const TAG = /\((?:F(?:[1-9]|1[0-2])|W)(?:,\s*(?:F(?:[1-9]|1[0-2])|W))*\)\s*$/;

// What closes each failure besides prose: verify checks (by id), skill files (by path) or judged
// rubric items (by key in evals/rubric-v2.md). At least one must exist.
export const CLOSERS = {
  F1: { checks: ['off-grid-spacing'], files: ['assets/web/tokens.css', 'assets/flutter/lib/m3/space.dart', 'assets/compose/theme/Space.kt'] },
  F2: { checks: ['hardcoded-color'], files: ['scripts/color/index.mjs'] },
  F3: { checks: ['off-token-type'], files: ['assets/flutter/lib/m3/type.dart', 'assets/compose/theme/Type.kt'] },
  F4: { checks: ['off-token-radius'], files: ['assets/flutter/lib/m3/shape.dart', 'assets/compose/theme/Shape.kt'] },
  F5: { checks: ['shadow-gradient'], files: [] },
  F6: { checks: ['touch-target'], files: [] },
  F7: { checks: ['icon-source', 'unknown-icon'], files: ['scripts/icons/index.mjs'] },
  F8: { checks: ['contrast'], files: ['scripts/color/index.mjs'] },
  F9: { rubric: ['spacing-layout', 'overall-polish'], files: [] },
  F10: { rubric: ['hierarchy-typography'], checks: ['off-token-type'], files: [] },
  F11: { checks: ['placeholder-content'], files: [] },
  F12: { checks: ['brand'], files: [] },
};

// Top-level list items (column 0) with their continuation lines; nested items inherit the tag.
export function ruleItems(markdown) {
  const items = [];
  let cur = null;
  let inFence = false;
  for (const line of markdown.split(/\r?\n/)) {
    if (/^```/.test(line)) { inFence = !inFence; cur = null; continue; }
    if (inFence) continue;
    if (/^(?:- |\d+\. )/.test(line)) { cur = { text: line }; items.push(cur); continue; }
    if (/^\s+(?:- |\d+\. )/.test(line)) { cur = { text: '' }; continue; } // nested item: inherits, not collected
    if (cur && /^\s+\S/.test(line)) { cur.text += ` ${line.trim()}`; continue; }
    cur = null;
  }
  return items.map((i) => i.text);
}

const tagsOf = (text) => (text.match(TAG)?.[0].match(/F\d+|W/g) ?? []);

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

const MARKER = /\[(?:token|impl|site):[^\]]+\]|\[NOT FOUND\]/;
const VALUE = /#[0-9A-Fa-f]{6}\b|\b\d+(?:\.\d+)?(?:dp|sp|px|ms)\b/;

export function skillTrace(skillDir, { repoRoot = ROOT } = {}) {
  const untagged = [];
  const cited = new Set();
  for (const file of ['SKILL.md', 'CHECKLIST.md']) {
    const text = readFileSync(join(skillDir, file), 'utf8');
    for (const item of ruleItems(text)) {
      const tags = tagsOf(item);
      if (!tags.length) untagged.push(`${file}: ${item.slice(0, 80)}`);
      tags.forEach((t) => cited.add(t));
    }
  }

  const checksSrc = existsSync(join(skillDir, 'scripts', 'verify', 'common.mjs'))
    ? readFileSync(join(skillDir, 'scripts', 'verify', 'common.mjs'), 'utf8') : '';
  const rubricPath = join(repoRoot, 'evals', 'rubric-v2.md');
  const rubric = existsSync(rubricPath) ? readFileSync(rubricPath, 'utf8') : '';
  const uncovered = [];
  for (const [id, c] of Object.entries(CLOSERS)) {
    if (!cited.has(id)) { uncovered.push(`${id}: no rule cites it`); continue; }
    const hasCheck = (c.checks ?? []).some((k) => checksSrc.includes(`'${k}'`));
    const hasFile = (c.files ?? []).some((f) => existsSync(join(skillDir, f)));
    const hasRubric = (c.rubric ?? []).some((k) => rubric.includes(`\`${k}\``));
    if (!hasCheck && !hasFile && !hasRubric) uncovered.push(`${id}: no asset, check or judged item closes it`);
  }

  const unmarked = [];
  for (const f of walk(join(skillDir, 'references')).filter((p) => p.endsWith('.md'))) {
    let inFence = false;
    readFileSync(f, 'utf8').split(/\r?\n/).forEach((line, i) => {
      if (/^```/.test(line)) inFence = !inFence;
      if (VALUE.test(line) && !MARKER.test(line)) unmarked.push(`${relative(skillDir, f).replace(/\\/g, '/')}:${i + 1}`);
    });
  }

  const lines = readFileSync(join(skillDir, 'SKILL.md'), 'utf8').split(/\r?\n/).length;
  const tooLong = lines > SKILL_MAX_LINES ? `SKILL.md has ${lines} lines (max ${SKILL_MAX_LINES})` : null;
  return { untagged, uncovered, unmarked, tooLong };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const dir = resolve(process.argv[2] ?? join(ROOT, 'plugin', 'skills', 'material3'));
  const r = skillTrace(dir);
  const problems = [...r.untagged.map((x) => `untagged: ${x}`), ...r.uncovered.map((x) => `uncovered: ${x}`),
    ...r.unmarked.map((x) => `unmarked value: ${x}`), ...(r.tooLong ? [r.tooLong] : [])];
  for (const p of problems) console.error(p);
  console.log(problems.length ? `skill-trace: ${problems.length} problem(s)` : 'skill-trace: ok');
  process.exit(problems.length ? 1 : 0);
}
