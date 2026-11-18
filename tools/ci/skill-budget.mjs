// Always-read budget of the material3 skill (owner, 2026-11-18): SKILL.md, CHECKLIST.md and every core
// reference that SKILL.md step 3 says to always read count in ONE budget. The limit is the total at
// 9628455 (the end of web round 4). Adding text means removing as much elsewhere. CI fails above it.
//
// The unit is characters (line endings normalized to \n), because CI cannot count model tokens. The
// probe `evals/tools/probe-skill-dir.mjs tokens always` measures the same files in tokens; at 9628455
// the refs measured about 2.8 characters per token (claude-opus-5-5).
//
//   alwaysRead(skillDir) -> string[]            relative paths, SKILL.md first
//   budget(skillDir) -> { files: [{ file, chars }], total, limit, over }
//   node tools/ci/skill-budget.mjs [skillDir]   prints the table; exit 1 when over the limit
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const BUDGET_CHARS = 54514;

const read = (p) => readFileSync(p, 'utf8').replace(/^﻿/, '').replace(/\r\n?/g, '\n');

// The step 3 bullet that starts with "Always read" names the files in backticks: `CHECKLIST.md`,
// `references/core/<name>.md`, or a bare `<name>.md` that means references/core/<name>.md.
export function alwaysRead(skillDir) {
  const skill = read(join(skillDir, 'SKILL.md'));
  const m = /^- Always read ([\s\S]*?)(?=^- |^#|(?![\s\S]))/m.exec(skill);
  if (!m) throw new Error('SKILL.md has no "- Always read" bullet');
  const files = ['SKILL.md'];
  for (const [, name] of m[1].matchAll(/`([^`]+\.md)`/g)) {
    const rel = name.includes('/') || name === 'CHECKLIST.md' ? name : `references/core/${name}`;
    if (!existsSync(join(skillDir, rel))) throw new Error(`always-read file not found: ${rel}`);
    if (!files.includes(rel)) files.push(rel);
  }
  return files;
}

export function budget(skillDir, limit = BUDGET_CHARS) {
  const files = alwaysRead(skillDir).map((file) => ({ file, chars: read(join(skillDir, file)).length }));
  const total = files.reduce((n, f) => n + f.chars, 0);
  return { files, total, limit, over: total > limit };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const dir = process.argv[2] || fileURLToPath(new URL('../../plugin/skills/material3', import.meta.url));
  const b = budget(dir);
  for (const f of b.files) console.log(`${String(f.chars).padStart(6)}  ${f.file}`);
  console.log(`${String(b.total).padStart(6)}  total (limit ${b.limit}, ${b.limit - b.total} left)`);
  if (b.over) {
    console.error(`always-read text is ${b.total - b.limit} characters over the budget: remove as much as you add`);
    process.exit(1);
  }
}
