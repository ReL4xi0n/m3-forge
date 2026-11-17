import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { mkdtemp, mkdir, cp, writeFile, readFile, readdir } from 'node:fs/promises';
import { buildPrompt } from '../../../evals/tools/run-cell.mjs';
import { distinctTerms, overfitHits, devCells } from '../overfit.mjs';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const SKILL = join(repoRoot, 'plugin', 'skills', 'material3');
const PROMPTS = join(repoRoot, 'evals', 'prompts');
const DEV = join(repoRoot, 'evals', 'dev');

test('distinctTerms finds product names and quoted strings in a request', async () => {
  const terms = distinctTerms(await readFile(join(PROMPTS, 'settings.md'), 'utf8'));
  assert.ok(terms.includes('Pocketbook'));
  assert.ok(terms.includes('3 linked'));
});

test('the current skill has no overfitting hits', () => {
  assert.deepEqual(overfitHits(SKILL, PROMPTS), []);
});

test('a skill copy that mentions an eval product name gives one hit', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'overfit skill '));
  const skill = join(dir, 'material3');
  await cp(SKILL, skill, { recursive: true });
  await mkdir(join(skill, 'references'), { recursive: true });
  await writeFile(join(skill, 'references', 'example.md'), 'A budgeting screen like Pocketbook uses lists.\n');
  const hits = overfitHits(skill, PROMPTS);
  assert.equal(hits.length, 1);
  assert.equal(hits[0].term, 'Pocketbook');
  assert.match(hits[0].file, /example\.md$/);
});

test('no dev request shares a distinct term with an eval request', async () => {
  const evalTerms = new Set();
  for (const f of (await readdir(PROMPTS)).filter(f => f.endsWith('.md') && f !== 'variants.md')) {
    for (const t of distinctTerms(await readFile(join(PROMPTS, f), 'utf8'))) evalTerms.add(t.toLowerCase());
  }
  for (const f of (await readdir(DEV)).filter(f => f.endsWith('.md') && f !== 'README.md')) {
    for (const t of distinctTerms(await readFile(join(DEV, f), 'utf8'))) {
      assert.ok(!evalTerms.has(t.toLowerCase()), `${f} shares "${t}" with an eval request`);
    }
  }
});

test('dev cells: 12 cells, 4 per platform, classic and seed on each platform', () => {
  const cells = devCells();
  assert.equal(cells.length, 12);
  for (const p of ['web', 'flutter', 'compose']) {
    const c = cells.filter(x => x.platform === p);
    assert.equal(c.length, 4);
    assert.ok(c.some(x => x.variant === 'classic'));
    assert.ok(c.some(x => x.variant === 'seed:#2F6F5E'));
  }
  assert.ok(cells.every(x => x.set === 'dev'));
  assert.equal(new Set(cells.map(x => x.cell)).size, 12);
});

test('the dev seed color differs from the eval seed color', async () => {
  const variants = await readFile(join(PROMPTS, 'variants.md'), 'utf8');
  assert.ok(variants.includes('#B5651D'));
  assert.notEqual('#2F6F5E', '#B5651D');
  assert.ok(!variants.includes('#2F6F5E'));
});

test('buildPrompt reads dev requests from evals/dev', () => {
  const cell = devCells().find(c => c.cell.startsWith('expense-report.web'));
  const prompt = buildPrompt(cell, repoRoot);
  assert.match(prompt, /Ledgerleaf/);
  assert.match(prompt, /#2F6F5E/);
});

test('generic words and partial matches are not hits', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'overfit words '));
  await writeFile(join(dir, 'a.md'), 'Settings screen, settings.gradle, 13 linked items, Pocketbooks.');
  assert.deepEqual(overfitHits(dir, PROMPTS), []);
  await writeFile(join(dir, 'b.md'), 'like POCKETBOOK, here.');
  assert.deepEqual(overfitHits(dir, PROMPTS).map(h => h.term), ['Pocketbook']);
});
