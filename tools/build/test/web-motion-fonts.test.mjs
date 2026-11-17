import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { springPosition, springToLinear } from '../spring-linear.mjs';
import { emitAll } from '../emit.mjs';
import { buildSkillTokens } from '../tokens.mjs';
import { MANIFEST } from '../../../plugin/skills/material3/scripts/install-assets/manifest.mjs';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const skill = join(root, 'plugin/skills/material3');
const versions = JSON.parse(readFileSync(join(skill, 'versions.json'), 'utf8'));
const { sys } = buildSkillTokens();
const css = emitAll().files.get('assets/web/tokens.css');

// [{ pct|null, v }] of a linear() string.
function parseLinear(s) {
  const body = s.match(/^linear\((.*)\)$/)[1];
  return body.split(',').map(x => {
    const [v, pct] = x.trim().split(/\s+/);
    return { v: Number(v), pct: pct === undefined ? null : Number(pct.replace('%', '')) };
  });
}
const analyticPeak = d => (d < 1 ? 1 + Math.exp((-Math.PI * d) / Math.sqrt(1 - d * d)) : 1);

const SPRINGS = [];
for (const speed of ['fast', 'default', 'slow']) for (const kind of ['spatial', 'effects']) {
  for (const mode of ['standard', 'expressive']) {
    const id = `md.sys.motion.spring.${speed}.${kind}`;
    SPRINGS.push({ id, mode, stiffness: sys[`${id}.stiffness@${mode}`].web[0].number, damping: sys[`${id}.damping@${mode}`].web[0].number });
  }
}

test('every spring token becomes a linear() that starts at 0 and ends at 1, with a derived duration', () => {
  assert.equal(SPRINGS.length, 12);
  for (const s of SPRINGS) {
    const { easing, durationMs } = springToLinear(s);
    const pts = parseLinear(easing);
    assert.equal(pts[0].v, 0, s.id);
    assert.equal(pts.at(-1).v, 1, s.id);
    assert.ok(Number.isInteger(durationMs) && durationMs > 0, s.id);
    // Within epsilon of the target for the whole rest of the motion.
    for (let t = durationMs / 1000; t < durationMs / 1000 + 2; t += 0.01) assert.ok(Math.abs(1 - springPosition(s, t)) <= 0.001, `${s.id} t=${t}`);
  }
});

test('the overshoot of the easing matches the analytic maximum within 0.001', () => {
  for (const s of SPRINGS) {
    const pts = parseLinear(springToLinear(s).easing);
    const max = Math.max(...pts.map(p => p.v));
    assert.ok(Math.abs(max - analyticPeak(s.damping)) <= 0.001, `${s.id}@${s.mode}: ${max} vs ${analyticPeak(s.damping)}`);
  }
  const monotone = parseLinear(springToLinear({ damping: 1, stiffness: 1600 }).easing);
  assert.ok(Math.max(...monotone.map(p => p.v)) <= 1);
});

test('percent stops ascend and the samples follow the spring', () => {
  const s = { damping: 0.6, stiffness: 800 };
  const { easing, durationMs } = springToLinear(s, { samples: 32 });
  const pts = parseLinear(easing);
  let last = 0;
  for (const p of pts.slice(1, -1)) {
    assert.ok(p.pct >= last && p.pct <= 100);
    last = p.pct;
    assert.ok(Math.abs(p.v - springPosition(s, (p.pct / 100) * (durationMs / 1000))) < 0.001);
  }
  assert.throws(() => springToLinear({ damping: 0, stiffness: 100 }));
});

test('durations are derived: a stiffer spring is faster, epsilon moves them, nothing is typed in', () => {
  assert.ok(springToLinear({ damping: 0.9, stiffness: 1400 }).durationMs < springToLinear({ damping: 0.9, stiffness: 300 }).durationMs);
  assert.ok(springToLinear({ damping: 0.9, stiffness: 700 }, { epsilon: 0.01 }).durationMs < springToLinear({ damping: 0.9, stiffness: 700 }, { epsilon: 0.0001 }).durationMs);
  assert.doesNotMatch(readFileSync(join(root, 'tools/build/emit/web.mjs'), 'utf8'), /\d+ms/);
});

test('tokens.css carries the easing and duration of every spring, per scheme, equal to springToLinear', () => {
  const [standard, expressive] = css.split(':root:not([data-m3-style="classic"])');
  for (const s of SPRINGS) {
    const name = `--${s.id.replace(/\./g, '-')}`;
    const { easing, durationMs } = springToLinear(s);
    const block = s.mode === 'standard' ? standard : expressive;
    assert.ok(block.includes(`  ${name}-easing: ${easing};`), `${s.id}@${s.mode} easing`);
    assert.ok(block.includes(`  ${name}-duration: ${durationMs}ms;`), `${s.id}@${s.mode} duration`);
  }
  // Classic keeps the standard scheme: its values are in :root, the expressive ones only in the override.
  assert.equal([...standard.matchAll(/spring-[a-z-]+-easing:/g)].length, 6);
  assert.equal([...expressive.matchAll(/spring-[a-z-]+-easing:/g)].length, 6);
});

// ---- fonts ----

const WOFF2_KNOWN = ['cmap', 'head', 'hhea', 'hmtx', 'maxp', 'name', 'OS/2', 'post', 'cvt ', 'fpgm', 'glyf', 'loca', 'prep', 'CFF ', 'VORG', 'EBDT', 'EBLC', 'gasp', 'hdmx', 'kern', 'LTSH', 'PCLT', 'VDMX', 'vhea', 'vmtx', 'BASE', 'GDEF', 'GPOS', 'GSUB', 'EBSC', 'JSTF', 'MATH', 'CBDT', 'CBLC', 'COLR', 'CPAL', 'SVG ', 'sbix', 'acnt', 'avar', 'bdat', 'bloc', 'bsln', 'cvar', 'fdsc', 'feat', 'fmtx', 'fvar', 'gvar', 'hsty', 'just', 'lcar', 'mort', 'morx', 'opbd', 'prop', 'trak', 'Zapf', 'Silf', 'Glat', 'Gloc', 'Feat', 'Sill'];

// Table tags from the table directory of a TTF or a woff2.
function tableDir(buf) {
  const tags = [];
  if (buf.toString('latin1', 0, 4) !== 'wOF2') {
    for (let i = 0; i < buf.readUInt16BE(4); i++) tags.push(buf.toString('latin1', 12 + i * 16, 16 + i * 16));
    return tags;
  }
  let o = 48;
  const base128 = () => { let v = 0; for (;;) { const b = buf[o++]; v = v * 128 + (b & 127); if (!(b & 128)) return v; } };
  for (let i = 0; i < buf.readUInt16BE(12); i++) {
    const flags = buf[o++];
    const idx = flags & 63;
    let tag;
    if (idx === 63) { tag = buf.toString('latin1', o, o + 4); o += 4; } else tag = WOFF2_KNOWN[idx];
    tags.push(tag);
    base128();
    const transform = (flags >> 6) & 3;
    if (tag === 'glyf' || tag === 'loca' ? transform === 0 : transform !== 0) base128();
  }
  return tags;
}

// [[tag, min, max]] of the fvar table of a TTF.
function fvarAxes(ttf) {
  for (let i = 0; i < ttf.readUInt16BE(4); i++) {
    const o = 12 + i * 16;
    if (ttf.toString('latin1', o, o + 4) !== 'fvar') continue;
    const off = ttf.readUInt32BE(o + 8);
    const ao = off + ttf.readUInt16BE(off + 4);
    const size = ttf.readUInt16BE(off + 10);
    const f = x => ttf.readInt32BE(x) / 65536;
    return Array.from({ length: ttf.readUInt16BE(off + 8) }, (_, j) => [ttf.toString('latin1', ao + j * size, ao + j * size + 4), f(ao + j * size + 4), f(ao + j * size + 12)]);
  }
  return null;
}

const ttf = readFileSync(join(skill, 'assets/fonts/RobotoFlex.ttf'));
const woff2 = readFileSync(join(skill, 'assets/fonts/RobotoFlex.woff2'));

test('Roboto Flex woff2 keeps the variable-font tables of the TTF (table directory)', () => {
  const a = new Set(tableDir(ttf));
  const b = new Set(tableDir(woff2));
  for (const t of ['fvar', 'gvar', 'avar', 'glyf']) assert.ok(b.has(t), `woff2 lacks ${t}`);
  assert.deepEqual([...a].filter(t => t !== 'DSIG' && !b.has(t)), []);
});

test('Roboto Flex woff2 decodes to a font with the same fvar axes as the TTF', { skip: process.env.M3_TOOLCHAIN_TESTS !== '1' }, async () => {
  const { loadEncoder } = await import('../make-woff2.mjs');
  const { decompress } = await loadEncoder();
  const back = Buffer.from(await decompress(woff2));
  assert.deepEqual(fvarAxes(back), fvarAxes(ttf));
  assert.equal(fvarAxes(ttf).length, 13);
});

test('the woff2 encoder is pinned in versions.json with a sha256, and the font entry matches the file', () => {
  const t = versions.tools.find(x => x.name === 'wawoff2');
  assert.ok(t, 'tools entry for wawoff2');
  assert.match(t.version, /^\d+\.\d+\.\d+$/);
  assert.match(t.archive.sha256, /^[0-9a-f]{64}$/);
  assert.ok(t.archive.url.includes(`wawoff2-${t.version}.tgz`));
  const f = versions.fonts.find(x => x.file === 'RobotoFlex.woff2');
  assert.equal(f.sha256, createHash('sha256').update(woff2).digest('hex'));
  assert.equal(f.bytes, woff2.length);
});

test('fonts.css declares Roboto Flex and Material Symbols with relative URLs and the axis ranges of the fonts', () => {
  const text = readFileSync(join(skill, 'assets/web/fonts.css'), 'utf8');
  assert.ok(text.startsWith('/* material3 skill asset: assets/web/fonts.css'));
  const faces = [...text.matchAll(/@font-face\s*\{([^}]*)\}/g)].map(m => m[1]);
  assert.equal(faces.length, 3);
  for (const f of faces) {
    const url = f.match(/url\('([^']+)'\)/)[1];
    assert.ok(!/^([a-z]+:)?\/\//i.test(url) && !url.startsWith('/'), `relative: ${url}`);
    assert.match(f, /format\('woff2'\)/);
  }
  const flex = faces.find(f => f.includes("'Roboto Flex'"));
  const symbols = faces.find(f => f.includes("'Material Symbols Outlined'"));
  const ax = Object.fromEntries(fvarAxes(ttf).map(([t, lo, hi]) => [t, [lo, hi]]));
  assert.ok(flex.includes("'Roboto Flex'") && flex.includes('fonts/RobotoFlex.woff2'));
  assert.ok(flex.includes(`font-weight: ${ax.wght[0]} ${ax.wght[1]};`));
  assert.ok(flex.includes(`font-stretch: ${ax.wdth[0]}% ${ax.wdth[1]}%;`));
  assert.ok(flex.includes(`oblique ${ax.slnt[0]}deg ${ax.slnt[1]}deg`));
  const sym = fvarAxes(readFileSync(join(skill, 'assets/fonts/MaterialSymbolsOutlined.ttf'))).find(a => a[0] === 'wght');
  assert.ok(symbols.includes("'Material Symbols Outlined'") && symbols.includes('fonts/MaterialSymbolsOutlined.woff2'));
  assert.ok(symbols.includes(`font-weight: ${sym[1]} ${sym[2]};`));
});

test('the web install manifest ships fonts.css and the woff2, and no longer the Roboto Flex TTF', () => {
  const web = Object.values(MANIFEST.web).flat().map(e => e.src);
  assert.ok(web.includes('web/fonts.css'));
  assert.ok(web.includes('fonts/RobotoFlex.woff2'));
  assert.ok(!web.includes('fonts/RobotoFlex.ttf'));
  assert.ok(MANIFEST.flutter.fonts.some(e => e.src === 'fonts/RobotoFlex.ttf'));
});

test('every font family named in tokens.css has an @font-face in fonts.css whose file is in the web fonts part', () => {
  const GENERIC = new Set(['serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui', 'ui-sans-serif', 'ui-serif', 'ui-monospace']);
  const names = [...css.matchAll(/^\s*--md-ref-typeface-(?!weight)[\w-]+:\s*([^;]+);/gm)]
    .flatMap(m => m[1].split(',').map(x => x.trim().replace(/^['"]|['"]$/g, '')))
    .filter(n => n && !GENERIC.has(n.toLowerCase()));
  assert.ok(names.includes('Roboto') && names.includes('Roboto Flex'));
  const fontsCss = readFileSync(join(skill, 'assets/web/fonts.css'), 'utf8');
  const faces = [...fontsCss.matchAll(/@font-face\s*\{([^}]*)\}/g)].map(m => m[1]);
  const part = MANIFEST.web.fonts.map(e => e.src);
  for (const n of new Set(names)) {
    const face = faces.find(f => f.includes(`font-family: '${n}'`));
    assert.ok(face, `no @font-face for ${n}`);
    const file = face.match(/url\('fonts\/([^']+)'\)/)[1];
    assert.ok(part.includes(`fonts/${file}`), `${file} is not in the web fonts part`);
    assert.ok(readFileSync(join(skill, 'assets/fonts', file)).length > 0);
  }
});
