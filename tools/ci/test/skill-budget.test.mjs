import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { alwaysRead, budget, BUDGET_CHARS } from '../skill-budget.mjs';

const SKILL = fileURLToPath(new URL('../../../plugin/skills/material3', import.meta.url));

function copySkillText() {
  const d = mkdtempSync(join(tmpdir(), 'skill budget '));
  for (const f of ['SKILL.md', 'CHECKLIST.md', 'references']) cpSync(join(SKILL, f), join(d, f), { recursive: true });
  return d;
}

test('the always-read set is SKILL.md, CHECKLIST.md and the core references SKILL.md names', () => {
  const files = alwaysRead(SKILL);
  assert.equal(files[0], 'SKILL.md');
  assert.ok(files.includes('CHECKLIST.md'));
  for (const n of ['color', 'typography', 'shape', 'layout', 'composition', 'icons', 'content', 'components']) {
    assert.ok(files.includes(`references/core/${n}.md`), n);
  }
});

test('the real skill is within the always-read budget', () => {
  const b = budget(SKILL);
  assert.equal(b.limit, BUDGET_CHARS);
  assert.equal(b.over, false, `${b.total} > ${b.limit}`);
});

test('text added to any always-read file counts, and a file added to the list counts', () => {
  const d = copySkillText();
  try {
    const before = budget(d).total;
    const ck = join(d, 'CHECKLIST.md');
    writeFileSync(ck, `${readFileSync(ck, 'utf8')}\n- extra line\n`);
    assert.equal(budget(d).total, before + '\n- extra line\n'.length);
    const sk = join(d, 'SKILL.md');
    writeFileSync(sk, readFileSync(sk, 'utf8').replace('`components.md`', '`components.md`, `states.md`'));
    assert.ok(alwaysRead(d).includes('references/core/states.md'));
    assert.ok(budget(d).total > before + 1000);
    assert.equal(budget(d, before).over, true);
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test('CRLF line endings do not change the count', () => {
  const d = copySkillText();
  try {
    const before = budget(d).total;
    const ck = join(d, 'CHECKLIST.md');
    writeFileSync(ck, readFileSync(ck, 'utf8').replace(/\r?\n/g, '\r\n'));
    assert.equal(budget(d).total, before);
  } finally { rmSync(d, { recursive: true, force: true }); }
});
