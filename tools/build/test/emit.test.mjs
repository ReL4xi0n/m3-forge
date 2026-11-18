import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { emitAll } from '../emit.mjs';
import { buildSkillTokens } from '../tokens.mjs';
import { THEME_ASSETS } from '../../../plugin/skills/material3/scripts/verify/common.mjs';
import { verify } from '../../../plugin/skills/material3/scripts/verify/index.mjs';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const skillDir = join(root, 'plugin/skills/material3');
const cli = join(root, 'tools/build/emit.mjs');
const { sys, comp } = buildSkillTokens();
const { files } = emitAll();
const shapeScale = JSON.parse(readFileSync(join(skillDir, 'scripts/verify/shape-scale.json'), 'utf8'));

const PATHS = [
  'assets/web/tokens.css',
  'assets/flutter/lib/m3/tokens.dart',
  'assets/flutter/lib/m3/type.dart',
  'assets/flutter/lib/m3/shape.dart',
  'assets/flutter/lib/m3/space.dart',
  'assets/flutter/lib/m3/motion.dart',
  'assets/compose/theme/Type.kt',
  'assets/compose/theme/Shape.kt',
  'assets/compose/theme/Space.kt',
  'assets/compose/theme/Motion.kt',
  'assets/compose/theme/Tokens.kt',
];
const platformOf = p => (p.startsWith('assets/web/') ? 'web' : p.startsWith('assets/flutter/') ? 'flutter' : 'compose');
const R1 = [0, 4, 8, 12, 16, 20, 24, 32, 36, 40, 48, 56, 64, 72];

// Numbers as written in code: not part of an identifier or a custom-property name (space100,
// level1, --md-sys-space-100), plus the weight in FontWeight.w400.
const NUM = /(?<![\w.-])-?\d+(?:\.\d+)?|(?<=\bFontWeight\.w)\d00\b/g;
const numbers = s => (String(s).match(NUM) || []).map(Number);
const cellNumbers = v => numbers(JSON.stringify(v).replace(/"(?:ref|string|unparsed|family)":/g, ' '));

// Every line of an emitted file: { code, keys } where keys come from the trace comment at the end of
// the line (`/* md.x */` or `// md.x, md.y`) and code is the line without any comment.
function traced(text) {
  const noBlock = text.replace(/\/\*(?!\s*md\.)[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' '));
  return noBlock.split('\n').map((line, i) => {
    const m = line.match(/(?:\/\*|\/\/)\s*(md\.[^\s,*]+(?:,\s*md\.[^\s,*]+)*)\s*(?:\*\/)?\s*$/);
    // Derived lines (spring easing and duration) carry no token numbers; web-motion-fonts.test.mjs checks them.
    // [impl:] lines (material-web shadows, touch target) carry library-code values; web-components.test.mjs checks them.
    if (/\/\*\s*(?:derived from md\.|\[impl:)/.test(text.split('\n')[i])) return { n: i + 1, code: '', keys: [] };
    const keys = m ? m[1].split(/,\s*/) : [];
    let code = m ? line.slice(0, m.index) : line;
    code = code.replace(/\/\/.*$/, '');
    return { n: i + 1, code, keys };
  });
}

test('the emitters write exactly the theme asset files verify allowlists', () => {
  assert.deepEqual([...files.keys()].sort(), [...PATHS].sort());
  // Plus fonts.css (font files build step), whose @font-face weight ranges are not UI literals, and
  // the progress component, whose arcs are gradients of the color roles, and the hand-written Flutter and Compose themes.
  assert.deepEqual([...THEME_ASSETS].sort(), [...PATHS, 'assets/web/fonts.css', 'assets/web/components/progress.css', 'assets/flutter/lib/m3/theme.dart', 'assets/compose/theme/Theme.kt', 'assets/compose/theme/below-1.5/Theme.kt'].sort());
});

test('every file starts with the skill asset marker and the generated notice, and names no repo-only terms', () => {
  for (const [p, text] of files) {
    const head = text.split('\n').slice(0, 3).join('\n');
    assert.ok(head.includes(`material3 skill asset: ${p}`), p);
    assert.ok(/generated, do not edit/.test(text.split('\n').slice(0, 6).join('\n')), p);
    assert.ok(!/m3-forge|holdout|reference-screenshots/i.test(text), p);
    assert.ok(!/\r/.test(text) && text.endsWith('\n'), p);
  }
});

test('every number in every emitted file traces to its token cell (parsed back from the file)', () => {
  let tracedLines = 0;
  for (const [p, text] of files) {
    const platform = platformOf(p);
    for (const { n, code, keys } of traced(text)) {
      const where = `${p}:${n}`;
      const got = numbers(code);
      if (got.length) assert.ok(keys.length, `${where}: number without a token trace: ${code.trim()}`);
      if (!keys.length) continue;
      tracedLines++;
      const cells = keys.map(k => {
        const cells = sys[k] ?? comp[k];
        assert.ok(cells, `${where}: unknown token ${k}`);
        const [value, provenance] = cells[platform];
        assert.notEqual(value, null, `${where}: ${k} is ${provenance} on ${platform}`);
        return value;
      });
      const allowed = new Set(cells.flatMap(cellNumbers));
      for (const x of got) assert.ok(allowed.has(x), `${where}: ${x} is not in ${keys.join(', ')} (${JSON.stringify(cells)})`);
      if (keys.length === 1 && got.length) {
        assert.deepEqual([...new Set(got)].sort(), [...allowed].sort(), `${where}: not every number of ${keys[0]} was written`);
      }
      // A non-numeric raw value (a font name, a Compose constant) is written verbatim.
      const last = cells[cells.length - 1];
      const raw = last.string ?? last.unparsed;
      if (raw !== undefined && !/\d/.test(raw)) assert.ok(code.includes(raw), `${where}: ${raw} not written verbatim`);
    }
  }
  assert.ok(tracedLines > 400, `only ${tracedLines} traced lines`);
});

// name -> { value, keys } of the spacing declarations of one file.
function spacing(p, text) {
  const out = new Map();
  const re = p.endsWith('.css')
    ? /--md-sys-space-(\d+):\s*([^;]+);/
    : /\bspace(\d+)\b[^=]*=\s*([^;\n/]+)/;
  for (const { code, keys } of traced(text)) {
    const m = code.match(re);
    if (m) out.set(m[1], { value: numbers(m[2])[0], keys });
  }
  return out;
}

test('the spacing scale is exactly the md.sys.measurement steps on the 4 dp grid (ruling R1)', () => {
  for (const p of ['assets/web/tokens.css', 'assets/flutter/lib/m3/space.dart', 'assets/compose/theme/Space.kt']) {
    const s = spacing(p, files.get(p));
    assert.deepEqual([...s.values()].map(x => x.value).sort((a, b) => a - b), R1, p);
    for (const [step, { value, keys }] of s) {
      assert.deepEqual(keys, [`md.sys.measurement.space${step}`], `${p} space${step}`);
      assert.equal(numbers(JSON.stringify(sys[keys[0]][platformOf(p)][0]))[0], value);
    }
  }
});

test('the shape steps equal scripts/verify/shape-scale.json on every platform', () => {
  const FULL = Math.max(...shapeScale.scale);
  const LIBRARY = { RectangleShape: 0, CircleShape: FULL, 'StadiumBorder()': FULL };
  for (const p of ['assets/web/tokens.css', 'assets/flutter/lib/m3/shape.dart', 'assets/compose/theme/Shape.kt']) {
    const steps = {};
    for (const { code, keys } of traced(files.get(p))) {
      if (keys.length !== 1 || !(keys[0] in shapeScale.sources)) continue;
      const got = numbers(code);
      const lib = Object.keys(LIBRARY).find(k => code.includes(k));
      const v = got.length ? got[0] : lib !== undefined ? LIBRARY[lib] : undefined;
      if (v === undefined) continue;
      (steps[keys[0]] ??= new Set()).add(v);
    }
    assert.deepEqual(Object.keys(steps).sort(), Object.keys(shapeScale.sources).sort(), p);
    for (const [k, set] of Object.entries(steps)) assert.deepEqual([...set], [shapeScale.sources[k]], `${p} ${k}`);
    assert.deepEqual([...new Set(Object.values(steps).map(s => [...s][0]))].sort((a, b) => a - b), shapeScale.scale, p);
  }
});

// The declarations of each top-level CSS block: selector -> Map(prop -> value).
function cssBlocks(text) {
  const clean = text.replace(/\/\*[\s\S]*?\*\//g, '');
  const out = new Map();
  for (const m of clean.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const decls = new Map();
    for (const d of m[2].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) decls.set(d[1], d[2].trim());
    out.set(m[1].trim(), decls);
  }
  return out;
}

test('tokens.css: Expressive-only values are scoped so data-m3-style="classic" falls back to the standard set', () => {
  const css = files.get('assets/web/tokens.css');
  const blocks = cssBlocks(css);
  const base = blocks.get(':root');
  const expressive = blocks.get(':root:not([data-m3-style="classic"])');
  assert.ok(base && expressive);
  // Shape steps added by Expressive.
  for (const [step, fallback] of [['large-increased', 'large'], ['extra-large-increased', 'extra-large'], ['extra-extra-large', 'extra-large']]) {
    assert.equal(base.get(`--md-sys-shape-corner-${step}`), `var(--md-sys-shape-corner-${fallback})`);
    assert.equal(expressive.get(`--md-sys-shape-corner-${step}`), `${sys[`md.sys.shape.corner.${step}`].web[0].dp}px`);
  }
  // Emphasized type: classic uses the same role of the standard scale.
  for (const role of ['display-large', 'body-medium', 'label-small']) {
    for (const attr of ['font', 'weight', 'size', 'line-height', 'tracking']) {
      const name = `--md-sys-typescale-emphasized-${role}-${attr}`;
      assert.equal(base.get(name), `var(--md-sys-typescale-${role}-${attr})`, name);
      assert.ok(expressive.has(name), name);
    }
  }
  assert.equal(expressive.get('--md-sys-typescale-emphasized-body-large-weight'), 'var(--md-ref-typeface-weight-medium)');
  // Springs: the standard scheme in :root, the expressive scheme on top of it.
  let springs = 0;
  for (const key of Object.keys(sys).filter(k => /^md\.sys\.motion\.spring\..*@(standard|expressive)$/.test(k))) {
    const [value] = sys[key].web;
    if (value === null) continue;
    const [id, mode] = key.split('@');
    const name = `--${id.replace(/\./g, '-')}`;
    assert.equal((mode === 'standard' ? base : expressive).get(name), String(value.number), key);
    springs++;
  }
  assert.equal(springs, 24);
  // Nothing else is overridden, and nothing Expressive-only leaks into the base block.
  for (const name of expressive.keys()) assert.ok(/^--md-sys-(typescale-emphasized-|shape-corner-(large-increased|extra-large-increased|extra-extra-large)$|motion-spring-)/.test(name), name);
  // Every var() the file uses is declared in it, except the color roles (the scripts/color theme).
  const declared = new Set([...blocks.values()].flatMap(d => [...d.keys()]));
  for (const m of css.matchAll(/var\((--[\w-]+)\)/g)) assert.ok(declared.has(m[1]) || m[1].startsWith('--md-sys-color-'), m[1]);
  // Type role classes use only the variables.
  assert.match(css, /\.m3-type-body-large \{[^}]*font-size: var\(--md-sys-typescale-body-large-size\);/);
  assert.match(css, /\.m3-type-emphasized-title-medium \{[^}]*font-weight: var\(--md-sys-typescale-emphasized-title-medium-weight\);/);
});

test('Dart and Kotlin carry both motion schemes, every spring traced to its @mode token', () => {
  const springKeys = Object.keys(sys).filter(k => /^md\.sys\.motion\.spring\..*\.(stiffness|damping)@(standard|expressive)$/.test(k));
  assert.equal(springKeys.length, 24);
  for (const p of ['assets/flutter/lib/m3/motion.dart', 'assets/compose/theme/Motion.kt']) {
    const text = files.get(p);
    const keys = new Set(traced(text).flatMap(l => l.keys));
    for (const k of springKeys) assert.ok(keys.has(k), `${p}: ${k}`);
    assert.match(text, /\bstandard\b[^\n]*M3MotionScheme\(/);
    assert.match(text, /\bexpressive\b[^\n]*M3MotionScheme\(/);
  }
});

test('Dart files have at most one import line (the Material library, rewritten by install-assets); Kotlin uses the placeholder package', () => {
  for (const [p, text] of files) {
    if (p.endsWith('.dart')) {
      const imports = text.split('\n').filter(l => /^import /.test(l));
      assert.ok(imports.length <= 1, p);
      if (imports.length) assert.equal(imports[0], "import 'package:flutter/material.dart';", p);
    }
    if (p.endsWith('.kt')) assert.match(text, /^package m3\.theme$/m, p);
  }
  assert.match(files.get('assets/flutter/lib/m3/type.dart'), /class M3EmphasizedType extends ThemeExtension<M3EmphasizedType>/);
  assert.match(files.get('assets/flutter/lib/m3/space.dart'), /class M3Space\b/);
  assert.match(files.get('assets/flutter/lib/m3/shape.dart'), /class M3Shapes\b/);
  assert.match(files.get('assets/flutter/lib/m3/motion.dart'), /class M3Motion\b/);
  assert.match(files.get('assets/compose/theme/Space.kt'), /object M3Space\b/);
  assert.match(files.get('assets/compose/theme/Type.kt'), /object M3EmphasizedType\b[\s\S]*val bodyLarge: TextStyle = TextStyle\(/);
});

test('the committed asset files are up to date', () => {
  for (const [p, text] of files) assert.equal(readFileSync(join(skillDir, p), 'utf8').replace(/\r\n/g, '\n'), text, p);
});

// A project that uses only the emitted names, with the emitted files copied in.
const SAMPLES = {
  web: {
    'src/styles/tokens.css': 'assets/web/tokens.css',
    'src/index.html': `<!doctype html>
<html lang="en">
<head><link rel="stylesheet" href="styles/tokens.css"><link rel="stylesheet" href="styles/app.css"></head>
<body>
  <main class="page">
    <h1 class="m3-type-emphasized-headline-large">Title</h1>
    <section class="card"><p class="m3-type-body-large">Body</p></section>
  </main>
</body>
</html>
`,
    'src/styles/app.css': `.page {
  padding: var(--md-sys-space-200) var(--md-sys-space-300);
  gap: var(--md-sys-space-150);
}
.card {
  border-radius: var(--md-sys-shape-corner-large-increased);
  margin-block: var(--md-sys-space-100);
  padding: var(--md-sys-space-400);
  box-shadow: var(--md-sys-elevation-level1);
  transition: transform var(--md-sys-motion-duration-medium2) var(--md-sys-motion-easing-emphasized);
}
.card:hover { opacity: var(--md-sys-state-hover-state-layer-opacity); }
.title { font-size: var(--md-sys-typescale-title-large-size); font-weight: var(--md-sys-typescale-title-large-weight); }
`,
  },
  flutter: {
    ...Object.fromEntries(['tokens', 'type', 'shape', 'space', 'motion'].map(n => [`lib/m3/${n}.dart`, `assets/flutter/lib/m3/${n}.dart`])),
    'lib/main.dart': `import 'package:flutter/material.dart';

import 'm3/tokens.dart';

class Home extends StatelessWidget {
  const Home({super.key});

  @override
  Widget build(BuildContext context) {
    final emphasized = M3EmphasizedType.of(context);
    return Padding(
      padding: const EdgeInsets.all(M3Space.space200),
      child: Column(
        children: [
          Text('Title', style: emphasized.headlineLarge),
          const SizedBox(height: M3Space.space150),
          Material(
            shape: M3Shapes.largeIncreased,
            elevation: M3Elevation.level1,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: M3Space.space300, vertical: M3Space.space200),
              child: Text('Body', style: Theme.of(context).textTheme.bodyLarge),
            ),
          ),
          AnimatedContainer(
            duration: M3Motion.durationMedium2,
            curve: M3Motion.easingEmphasized,
            decoration: const BoxDecoration(borderRadius: M3Corners.medium),
          ),
        ],
      ),
    );
  }
}
`,
  },
  compose: {
    ...Object.fromEntries(['Type', 'Shape', 'Space', 'Motion', 'Tokens'].map(n => [`app/src/main/java/com/example/app/m3/${n}.kt`, `assets/compose/theme/${n}.kt`])),
    'app/src/main/java/com/example/app/Screen.kt': `package com.example.app

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import m3.theme.M3Elevation
import m3.theme.M3EmphasizedType
import m3.theme.M3Shapes
import m3.theme.M3Space

@Composable
fun Screen() {
    Column(
        modifier = Modifier.padding(M3Space.space200),
        verticalArrangement = Arrangement.spacedBy(M3Space.space150),
    ) {
        Text("Title", style = M3EmphasizedType.headlineLarge)
        Surface(shape = M3Shapes.largeIncreased, tonalElevation = M3Elevation.level1) {
            Text("Body", style = MaterialTheme.typography.bodyLarge, modifier = Modifier.padding(M3Space.space300))
        }
    }
}
`,
  },
};
const LITERAL = ['hardcoded-color', 'off-token-type', 'off-token-radius', 'off-grid-spacing', 'shadow-gradient'];

function writeSample(dir, platform) {
  for (const [rel, src] of Object.entries(SAMPLES[platform])) {
    const p = join(dir, rel);
    mkdirSync(join(p, '..'), { recursive: true });
    writeFileSync(p, files.has(src) ? files.get(src) : src);
  }
}

for (const platform of ['web', 'flutter', 'compose']) {
  test(`verify (${platform}): a sample that uses only the emitted names has zero literal findings; the emitted files are theme files`, async () => {
    const dir = mkdtempSync(join(tmpdir(), 'm3 emit sample '));
    try {
      writeSample(dir, platform);
      const r = await verify({ projectDir: dir, platform });
      assert.deepEqual(r.violations, []);
      for (const c of LITERAL) assert.equal(r.counts[c], 0, c);
      const assets = Object.entries(SAMPLES[platform]).filter(([, src]) => files.has(src));
      const allowed = new Map(r.allowlisted.map(a => [a.file, a]));
      for (const [rel, src] of assets) {
        assert.ok(allowed.has(rel), `${rel} is not allowlisted`);
        assert.match(allowed.get(rel).reason, new RegExp(`material3 skill theme asset \\(${src.replace(/\./g, '\\.')}\\)`));
      }
      const themeLines = assets.reduce((s, [, src]) => s + files.get(src).split('\n').filter(l => l.trim()).length, 0);
      assert.equal(r.themeLines, themeLines);
      assert.ok(r.uiLines > 0);
      // The literals are in the emitted files and were suppressed there.
      const suppressed = r.allowlisted.reduce((s, a) => s + Object.values(a.suppressed).reduce((x, y) => x + y, 0), 0);
      assert.ok(suppressed > 0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
}

test('verify: the asset marker exempts only the known theme asset under its own file name', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'm3 emit marker '));
  try {
    const lib = join(dir, 'lib');
    mkdirSync(lib, { recursive: true });
    const body = 'const double gap = 6;\nfinal w = EdgeInsets.all(6);\n';
    writeFileSync(join(lib, 'space.dart'), '// material3 skill asset: assets/flutter/lib/m3/unknown.dart\n' + body);
    writeFileSync(join(lib, 'gaps.dart'), '// material3 skill asset: assets/flutter/lib/m3/space.dart\n' + body);
    const r = await verify({ projectDir: dir, platform: 'flutter' });
    assert.deepEqual(r.allowlisted, []);
    assert.equal(r.counts['off-grid-spacing'], 2);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('emit --check passes on fresh output and fails when a file is stale or missing (path with spaces)', () => {
  const dir = mkdtempSync(join(tmpdir(), 'm3 emit check '));
  try {
    const run = (...a) => spawnSync(process.execPath, [cli, '--out', dir, ...a], { encoding: 'utf8' });
    assert.equal(run('--check').status, 1, 'empty folder is stale');
    const w = run();
    assert.equal(w.status, 0, w.stderr);
    const ok = run('--check');
    assert.equal(ok.status, 0, ok.stderr);
    const css = join(dir, 'assets/web/tokens.css');
    writeFileSync(css, readFileSync(css, 'utf8').replace('--md-sys-space-200: 16px;', '--md-sys-space-200: 18px;'));
    const stale = run('--check');
    assert.equal(stale.status, 1);
    assert.match(stale.stderr, /assets\/web\/tokens\.css/);
    rmSync(join(dir, 'assets/compose/theme/Motion.kt'));
    assert.match(run('--check').stderr, /Motion\.kt/);
    // Files written by other tasks next to the generated ones are not stale.
    cpSync(css, join(dir, 'assets/web/fonts.css'));
    run();
    assert.equal(run('--check').status, 0);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
