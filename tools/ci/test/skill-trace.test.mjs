import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { mkdtemp, mkdir, cp, readFile, writeFile } from 'node:fs/promises';
import { skillTrace, ruleItems } from '../skill-trace.mjs';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const skill = join(repoRoot, 'plugin', 'skills', 'material3');

async function copySkill() {
  const dir = join(await mkdtemp(join(tmpdir(), 'skill trace ')), 'material3');
  await cp(skill, dir, { recursive: true });
  return dir;
}

test('the real skill: every rule tagged, every failure covered, references marked, SKILL.md short', () => {
  const r = skillTrace(skill, { repoRoot });
  assert.deepEqual(r.untagged, []);
  assert.deepEqual(r.uncovered, []);
  assert.deepEqual(r.unmarked, []);
  assert.equal(r.tooLong, null);
});

test('ruleItems joins continuation lines and skips nested items', () => {
  const items = ruleItems('- one\n  two (F1)\n  1. nested\n- three (W)\n');
  assert.deepEqual(items, ['- one two (F1)', '- three (W)']);
});

test('an untagged bullet fails', async () => {
  const dir = await copySkill();
  const p = join(dir, 'CHECKLIST.md');
  await writeFile(p, `${await readFile(p, 'utf8')}\n- A new rule with no failure behind it.\n`);
  assert.deepEqual(skillTrace(dir, { repoRoot }).untagged, ['CHECKLIST.md: - A new rule with no failure behind it.']);
});

test('a failure with a rule but no check or asset fails (F11 without placeholder-content)', async () => {
  const dir = await copySkill();
  const p = join(dir, 'scripts', 'verify', 'common.mjs');
  await writeFile(p, (await readFile(p, 'utf8')).replaceAll("'placeholder-content'", "'x-content'"));
  assert.ok(skillTrace(dir, { repoRoot }).uncovered.some((u) => u.startsWith('F11:')));
});

test('a reference value without a marker fails; a marked one passes', async () => {
  const dir = await copySkill();
  await mkdir(join(dir, 'references', 'core'), { recursive: true });
  await writeFile(join(dir, 'references', 'core', 'zz.md'), 'Corner 12dp.\nCorner 12dp [token:md.sys.shape.corner.medium].\n');
  assert.ok(skillTrace(dir, { repoRoot }).unmarked.includes('references/core/zz.md:1'));
  assert.ok(!skillTrace(dir, { repoRoot }).unmarked.includes('references/core/zz.md:2'));
});

test('SKILL.md over 200 lines fails', async () => {
  const dir = await copySkill();
  const p = join(dir, 'SKILL.md');
  await writeFile(p, `${await readFile(p, 'utf8')}${'\n'.repeat(200)}`);
  assert.match(skillTrace(dir, { repoRoot }).tooLong, /max 200/);
});
