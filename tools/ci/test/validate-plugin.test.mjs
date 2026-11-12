import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { mkdtemp, cp, readFile, writeFile } from 'node:fs/promises';
import { validatePlugin } from '../validate-plugin.mjs';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const SKILL = join('plugin', 'skills', 'material3', 'SKILL.md');
const PLUGIN = join('plugin', '.claude-plugin', 'plugin.json');

async function copyWith(relPath, mutate) {
  const dir = await mkdtemp(join(tmpdir(), 'validate plugin '));
  await cp(join(repoRoot, '.claude-plugin'), join(dir, '.claude-plugin'), { recursive: true });
  await cp(join(repoRoot, 'plugin'), join(dir, 'plugin'), { recursive: true });
  const file = join(dir, relPath);
  await writeFile(file, mutate(await readFile(file, 'utf8')));
  return dir;
}

test('real repo plugin is valid', async () => {
  assert.deepEqual(await validatePlugin(repoRoot), []);
});

const mutations = [
  ['disable-model-invocation false', SKILL, s => s.replace('disable-model-invocation: true', 'disable-model-invocation: false'), /disable-model-invocation/],
  ['skill name changed', SKILL, s => s.replace('name: material3', 'name: material-3'), /name/],
  ['missing $ARGUMENTS', SKILL, s => s.replace('$ARGUMENTS', 'ARGS'), /\$ARGUMENTS/],
  ['empty argument-hint', SKILL, s => s.replace(/argument-hint: .*/, 'argument-hint: ""'), /argument-hint/],
  ['description without phrase', PLUGIN, s => s.replace(/an unofficial skill for Material Design 3/gi, 'a skill'), /unofficial/],
  ['plugin name with google', PLUGIN, s => s.replace('"name": "m3-forge"', '"name": "google-m3"'), /google|name/i],
];

for (const [label, rel, mutate, expected] of mutations) {
  test(`detects: ${label}`, async () => {
    const dir = await copyWith(rel, mutate);
    const errors = await validatePlugin(dir);
    assert.ok(errors.some(e => expected.test(e)), `${label}: ${JSON.stringify(errors)}`);
  });
}

test('detects SKILL.md over 500 lines', async () => {
  const dir = await copyWith(SKILL, s => s + '\nx'.repeat(501));
  const errors = await validatePlugin(dir);
  assert.ok(errors.some(e => /500/.test(e)), JSON.stringify(errors));
});
