import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { mkdtemp, cp, appendFile, writeFile, readFile } from 'node:fs/promises';
import {
  isPrivatePath, checkFiles, buildCorpus, shingles, loadCorpus, loadAllowlist,
} from '../lib.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const fixturesRawDir = join(here, 'fixtures', 'raw');
const JSON_STRING = 'copper kettles whistle loudly whenever patient gardeners return from long rainy autumn walks together';
const TWELVE = 'Amber, FALCON drifts over quiet harbor; while seven lanterns flicker beside the';
const ELEVEN_PLUS_FOREIGN = 'amber falcon drifts over quiet harbor while seven lanterns flicker beside zebra quantum';

test('isPrivatePath variants', () => {
  for (const p of ['private/raw/a.txt', 'Private/x.txt', 'private\\x.txt', './private/y'])
    assert.equal(isPrivatePath(p), true, p);
  for (const p of ['docs/private-notes.md', 'knowledge/private/x.md', 'privately.md'])
    assert.equal(isPrivatePath(p), false, p);
});

test('gitlink entries are violations and path rules apply without content', () => {
  const v = checkFiles({ files: [
    { path: 'private', content: null, gitlink: true },
    { path: 'vendor/thing', content: null, gitlink: true },
  ], forbiddenTerms: ['x'], corpus: null });
  assert.deepEqual(v.map(x => [x.rule, x.path]), [
    ['private-path', 'private'], ['gitlink', 'private'], ['gitlink', 'vendor/thing'],
  ]);
});

test('foreign images flagged, allowlisted images pass', () => {
  const v = checkFiles({ files: [
    { path: 'docs/shot.png', content: Buffer.from([0x89, 0x50, 0]) },
    { path: 'harness/web/references/a.png', content: Buffer.from([0x89, 0]) },
    { path: 'examples/web/x.webp', content: Buffer.from([0]) },
  ], forbiddenTerms: [], corpus: null });
  assert.deepEqual(v.map(x => [x.rule, x.path]), [['foreign-image', 'docs/shot.png']]);
});

test('forbidden term is case-insensitive and skipped for binaries', () => {
  const v = checkFiles({ files: [
    { path: 'a.md', content: Buffer.from('see Secret-Repo-XYZ here') },
    { path: 'b.bin', content: Buffer.concat([Buffer.from([0]), Buffer.from('secret-repo-xyz')]) },
  ], forbiddenTerms: ['secret-repo-xyz'], corpus: null });
  assert.deepEqual(v.map(x => [x.rule, x.path]), [['forbidden-term', 'a.md']]);
  assert.ok(!v[0].detail.toLowerCase().includes('secret-repo-xyz'), 'detail must not echo the term');
});

test('raw-overlap: 12-word run caught across case/punctuation, 11 words not', async () => {
  const corpus = await buildCorpus(fixturesRawDir);
  const hit = checkFiles({ files: [{ path: 'k.md', content: Buffer.from(`x ${TWELVE} y`) }], forbiddenTerms: [], corpus });
  assert.equal(hit.length, 1);
  assert.equal(hit[0].rule, 'raw-overlap');
  assert.match(hit[0].key, /^[0-9a-f]{16}$/);
  const miss = checkFiles({ files: [{ path: 'k.md', content: Buffer.from(ELEVEN_PLUS_FOREIGN) }], forbiddenTerms: [], corpus });
  assert.equal(miss.length, 0);
});

test('buildCorpus: missing dir -> null; json string values included', async () => {
  assert.equal(await buildCorpus(join(tmpdir(), 'does-not-exist-guard')), null);
  const c = await buildCorpus(fixturesRawDir);
  const s = shingles(JSON_STRING);
  assert.ok(s.size > 0);
  assert.ok([...s].every(h => c.has(h)));
});

test('allowlist drops only the exact rule+path+key', async () => {
  const corpus = await buildCorpus(fixturesRawDir);
  const [v] = checkFiles({ files: [{ path: 'k.md', content: Buffer.from(TWELVE) }], forbiddenTerms: [], corpus });
  const dir = await mkdtemp(join(tmpdir(), 'guard allow '));
  const file = join(dir, 'allowlist.txt');
  await writeFile(file, `# comment\n\nraw-overlap\tk.md\t${v.key}\treviewed: generic phrase\n`);
  const allowlist = await loadAllowlist(file);
  const files = [
    { path: 'k.md', content: Buffer.from(TWELVE) },
    { path: 'other.md', content: Buffer.from(TWELVE) },
  ];
  const out = checkFiles({ files, forbiddenTerms: [], corpus, allowlist });
  assert.deepEqual(out.map(x => [x.rule, x.path]), [['raw-overlap', 'other.md']]);
});

test('allowlist rejects private-path/foreign-image entries and short reasons', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'guard allow '));
  const cases = [
    'private-path\tprivate/x.txt\t*\tsome long enough reason',
    'foreign-image\tdocs/a.png\t*\tsome long enough reason',
    'raw-overlap\tk.md\t0123456789abcdef\tshort',
  ];
  for (const line of cases) {
    const file = join(dir, 'a.txt');
    await writeFile(file, line + '\n');
    await assert.rejects(loadAllowlist(file), /line 1/, line);
  }
  assert.deepEqual(await loadAllowlist(join(dir, 'missing.txt')), []);
});

test('loadCorpus caches and invalidates on raw change', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'guard cache '));
  const raw = join(dir, 'raw');
  await cp(fixturesRawDir, raw, { recursive: true });
  const cache = join(dir, '.guard-cache', 'corpus.json');
  const a = await loadCorpus(raw, cache);
  assert.equal(a.fromCache, false);
  const b = await loadCorpus(raw, cache);
  assert.equal(b.fromCache, true);
  assert.equal(b.corpus.size, a.corpus.size);
  await appendFile(join(raw, 'page.txt'), ' extra');
  const c = await loadCorpus(raw, cache);
  assert.equal(c.fromCache, false);
  await writeFile(cache, '{not json');
  const d = await loadCorpus(raw, cache);
  assert.equal(d.fromCache, false);
  assert.ok(JSON.parse(await readFile(cache, 'utf8')).fingerprint);
  assert.deepEqual(await loadCorpus(join(dir, 'nope'), cache), { corpus: null, fromCache: false });
});
