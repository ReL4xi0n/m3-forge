import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { composeBackend, composeIcons, fetchStyleIcons, gzipTsv, loadTsv, readTsv, renderVector, TSV_FILE, xmlUrl } from '../compose.mjs';
import { icons } from '../index.mjs';
import { loadCodepoints } from '../names.mjs';
import { isOfficial, normalizePath } from '../../verify/symbols.mjs';
import { verify } from '../../verify/index.mjs';

const SKILL = fileURLToPath(new URL('../../../', import.meta.url));
const tmp = (name = 'm3 compose icons ') => mkdtempSync(join(tmpdir(), name));
const read = (p) => readFileSync(p, 'utf8');
const drawable = (dir, f) => join(dir, 'app/src/main/res/drawable', f);
const project = () => { const d = tmp(); mkdirSync(join(d, 'app'), { recursive: true }); return d; };

test('the TSV: 4,157 sorted lines, a name per codepoints icon, deterministic gzip', () => {
  const text = readTsv();
  const lines = text.split('\n');
  assert.equal(lines.pop(), '');
  assert.equal(lines.length, 4157);
  const names = lines.map((l) => l.split('\t')[0]);
  assert.deepEqual(names, [...names].sort());
  assert.ok(!text.includes('\r'));
  for (const l of lines) assert.ok([3, 4].includes(l.split('\t').length), l.slice(0, 40));
  assert.ok(readFileSync(TSV_FILE).equals(gzipTsv(text)), 'gzip bytes are reproducible');
  assert.deepEqual([...readFileSync(TSV_FILE).subarray(0, 4)], [0x1f, 0x8b, 8, 0]);
});

test('every path in the TSV hashes into symbols-paths.json', () => {
  let paths = 0;
  for (const l of readTsv().split('\n').filter(Boolean)) {
    const [name, f0, f1] = l.split('\t');
    for (const d of [...f0.split('|'), ...(f1 === '=' ? [] : f1.split('|'))]) {
      paths++;
      const abs = normalizePath(d);
      assert.ok(abs && isOfficial(abs), `${name}: ${d.slice(0, 30)}`);
    }
  }
  assert.ok(paths >= 4157);
});

test('composeIcons writes both drawables from the official template (folder name with spaces)', () => {
  const dir = project();
  try {
    const r = composeIcons({ projectDir: dir, names: ['settings', 'home'] });
    assert.deepEqual(r.files, [
      'app/src/main/res/drawable/m3s_home.xml', 'app/src/main/res/drawable/m3s_home_fill1.xml',
      'app/src/main/res/drawable/m3s_settings.xml', 'app/src/main/res/drawable/m3s_settings_fill1.xml']);
    assert.equal(r.style, 'outlined');
    const x = read(drawable(dir, 'm3s_settings.xml'));
    assert.match(x, /^<vector xmlns:android="http:\/\/schemas\.android\.com\/apk\/res\/android"\n    android:width="24dp"\n    android:height="24dp"\n    android:viewportWidth="960"\n    android:viewportHeight="960"\n    android:tint="\?attr\/colorControlNormal">\n/);
    assert.notEqual(x, read(drawable(dir, 'm3s_settings_fill1.xml')));
    // autoMirrored and viewport-24 icons keep their official attributes
    composeIcons({ projectDir: dir, names: ['360', 'assistant'] });
    assert.match(read(drawable(dir, 'm3s_360.xml')), /android:autoMirrored="true">/);
    assert.match(read(drawable(dir, 'm3s_assistant.xml')), /android:viewportWidth="24"/);
    // a second run adds, an identical rewrite is fine; no module folder: project root res/
    const d2 = tmp();
    try {
      assert.ok(composeIcons({ projectDir: d2, names: ['home'] }).files[0].startsWith('src/main/res/drawable/'));
    } finally { rmSync(d2, { recursive: true, force: true }); }
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('verify: a generated drawable passes icon-source; one edited coordinate fails', async () => {
  const dir = project();
  try {
    composeIcons({ projectDir: dir, names: ['settings', 'arrow_back'] });
    let r = await verify({ projectDir: dir, platform: 'compose' });
    assert.equal(r.counts['icon-source'], 0);
    assert.deepEqual(r.violations.filter((v) => v.check === 'icon-source'), []);
    const f = drawable(dir, 'm3s_settings.xml');
    writeFileSync(f, read(f).replace(/pathData="M(\d+)/, (_, n) => `pathData="M${Number(n) + 1}`));
    r = await verify({ projectDir: dir, platform: 'compose' });
    assert.equal(r.counts['icon-source'], 1);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('a file that is not an official vector is never overwritten (exit 3, nothing written)', () => {
  const dir = project();
  try {
    mkdirSync(join(dir, 'app/src/main/res/drawable'), { recursive: true });
    writeFileSync(drawable(dir, 'm3s_home_fill1.xml'), '<vector/>');
    const r = composeIcons({ projectDir: dir, names: ['home'] });
    assert.equal(r.exitCode, 3);
    assert.ok(!existsSync(drawable(dir, 'm3s_home.xml')));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('icons(): unknown names exit 4; names without a vector are reported', async () => {
  const dir = project();
  try {
    assert.equal((await icons({ projectDir: dir, platform: 'compose', names: ['setings'] })).exitCode, 4);
    const ok = await icons({ projectDir: dir, platform: 'compose', names: ['settings'] });
    assert.equal(ok.exitCode, 0);
    assert.equal(ok.files.length, 2);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

// ---- Rounded and Sharp: stubbed fetch, never the network ----
const bodies = (style, edit = (t) => t) => (url) => {
  const m = /\/symbols\/android\/([^/]+)\/materialsymbols(\w+)\/\1(_fill1)?_24px\.xml$/.exec(url);
  assert.ok(m && m[2] === style, url);
  const paths = loadTsv([m[1]]).get(m[1]);
  return edit(renderVector(m[3] ? paths.fill1 : paths.fill0, { mirror: paths.mirror, small: paths.small }), url);
};
const stub = (make, log = []) => async (url) => {
  log.push(url);
  const out = make(url);
  if (out instanceof Error) throw out;
  if (typeof out === 'number') return { ok: false, status: out, arrayBuffer: async () => new ArrayBuffer(0) };
  return { ok: true, status: 200, arrayBuffer: async () => Buffer.from(out) };
};
const NOTICE = (style, why) => `${style} icons requested but ${why}; used bundled Outlined. Re-run with network access to switch.`;

for (const [style, Label] of [['rounded', 'Rounded'], ['sharp', 'Sharp']]) {
  test(`${style}: official XML at the pinned commit, every path verified, written unchanged`, async () => {
    const dir = project();
    const log = [];
    try {
      const r = await composeBackend({ projectDir: dir, names: ['home'], style, fetchImpl: stub(bodies(style), log) });
      assert.equal(r.style, style);
      assert.equal(r.notice, undefined);
      assert.equal(log.length, 2);
      const commit = JSON.parse(read(join(SKILL, 'versions.json'))).symbols.commit;
      assert.equal(log[0], `https://raw.githubusercontent.com/google/material-design-icons/${commit}/symbols/android/home/materialsymbols${style}/home_24px.xml`);
      assert.equal(log[1], xmlUrl(commit, style, 'home', true));
      assert.ok(existsSync(drawable(dir, 'm3s_home_fill1.xml')));
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });

  test(`${style}: a path that does not hash is rejected, Outlined is used with the verification notice`, async () => {
    const dir = project();
    try {
      const bad = bodies(style, (t, url) => (url.includes('_fill1') ? t.replace(/pathData="M(\d+)/, (_, n) => `pathData="M${Number(n) + 3}`) : t));
      const r = await composeBackend({ projectDir: dir, names: ['home'], style, fetchImpl: stub(bad) });
      assert.equal(r.style, 'outlined');
      assert.equal(r.notice, NOTICE(Label, 'failed verification'));
      assert.equal(read(drawable(dir, 'm3s_home.xml')), renderVector(loadTsv(['home']).get('home').fill0));
      await assert.rejects(fetchStyleIcons({ style, names: ['home'], fetchImpl: stub(bad) }), { code: 'mismatch' });
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });

  test(`${style}: an XML that is not the official form, offline and HTTP errors fall back to Outlined`, async () => {
    for (const [make, why] of [
      [() => new Error('getaddrinfo ENOTFOUND'), 'could not be downloaded (offline?)'],
      [() => 404, 'could not be downloaded (offline?)'],
      [() => '<vector><path android:pathData="M1,1L2,2Z"/></vector>', 'failed verification'],
    ]) {
      const dir = project();
      try {
        const r = await composeBackend({ projectDir: dir, names: ['home'], style, fetchImpl: stub(make) });
        assert.equal(r.style, 'outlined');
        assert.equal(r.notice, NOTICE(Label, why));
        assert.equal(readdirSync(join(dir, 'app/src/main/res/drawable')).length, 2);
      } finally { rmSync(dir, { recursive: true, force: true }); }
    }
  });
}

test('outlined never fetches', async () => {
  const dir = project();
  try {
    await composeBackend({ projectDir: dir, names: ['home'], style: 'outlined', fetchImpl: async () => { throw new Error('network used'); } });
    assert.ok(existsSync(drawable(dir, 'm3s_home.xml')));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

// ---- the no-Node one-liners of references/compose/icons.md produce the Node output byte for byte ----
const md = read(join(SKILL, 'references/compose/icons.md'));
const block = (lang) => new RegExp(`\`\`\`${lang}\\n([^\\n]+)\\n\`\`\``).exec(md)[1];
const CASES = [['settings', 0], ['settings', 1], ['arrow_back', 0], ['360', 1], ['assistant', 0], ['10k', 0], ['home', 1]];
const run = (cmd, args) => spawnSync(cmd, args, { encoding: 'utf8' });
const hasSh = !run('sh', ['-c', 'gzip -V >/dev/null 2>&1 && awk "BEGIN{}"']).status && run('sh', ['-c', 'true']).status === 0;

test('no-Node sh one-liner (gzip -dc | awk) equals the Node output', { skip: !hasSh && 'no sh with gzip and awk' }, () => {
  const out = tmp('m3 awk ');
  try {
    for (const [name, fill] of CASES) {
      const target = join(out, `${name}-${fill}.xml`).split('\\').join('/');
      const cmd = block('sh').replace('S/assets', `${SKILL.split('\\').join('/').replace(/\/$/, '')}/assets`)
        .replace('n=NAME', `n=${name}`).replace('f=FILL', `f=${fill}`).replace('"OUT"', `"${target}"`);
      const r = run('sh', ['-c', cmd]);
      assert.equal(r.status, 0, r.stderr);
      const p = loadTsv([name]).get(name);
      assert.equal(read(target), renderVector(fill ? p.fill1 : p.fill0, { mirror: p.mirror, small: p.small }), `${name} FILL ${fill}`);
    }
  } finally { rmSync(out, { recursive: true, force: true }); }
});

const hasPs = process.platform === 'win32' && run('powershell', ['-NoProfile', '-Command', '1']).status === 0;

test('no-Node PowerShell one-liner (GZipStream) equals the Node output', { skip: !hasPs && 'needs Windows PowerShell', timeout: 120000 }, () => {
  const out = tmp('m3 ps ');
  try {
    for (const [name, fill] of CASES) {
      const target = join(out, `${name}-${fill}.xml`);
      const cmd = block('powershell').replace('S\\assets', `${SKILL.replace(/[\\/]$/, '')}\\assets`)
        .replace("$n='NAME'", `$n='${name}'`).replace('$f=FILL', `$f=${fill}`).replace("$out='OUT'", `$out='${target}'`);
      const r = run('powershell', ['-NoProfile', '-NonInteractive', '-Command', cmd]);
      assert.equal(r.status, 0, r.stderr);
      const p = loadTsv([name]).get(name);
      assert.equal(readFileSync(target).toString('utf8'), renderVector(fill ? p.fill1 : p.fill0, { mirror: p.mirror, small: p.small }), `${name} FILL ${fill}`);
    }
  } finally { rmSync(out, { recursive: true, force: true }); }
});
