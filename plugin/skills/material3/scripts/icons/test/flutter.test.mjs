import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { constantName, flutterIcons } from '../flutter.mjs';
import { loadCodepoints } from '../names.mjs';
import { verify } from '../../verify/index.mjs';

const INDEX = fileURLToPath(new URL('../index.mjs', import.meta.url));
const NAMES = ['settings', 'home', 'arrow_back', 'favorite', 'check_circle'];
const ODD = ['2d_2', '10k', '18_up_rating', 'class', 'switch', 'try', 'sync'];

function project(fn) {
  const dir = mkdtempSync(join(tmpdir(), 'm3 flutter icons '));
  try { return fn(dir); } finally { rmSync(dir, { recursive: true, force: true }); }
}

const constants = (text) => Object.fromEntries(
  [...text.matchAll(/static const IconData (\S+) = IconData\(0x([0-9a-f]+), fontFamily: 'MaterialSymbolsOutlined'\);/g)].map((m) => [m[1], m[2]]));

test('generated constants carry the codepoints of the codepoints file', () => project((dir) => {
  const r = flutterIcons({ projectDir: dir, names: [...NAMES, ...ODD] });
  assert.equal(r.dartFile, 'lib/m3/m3_symbols.dart');
  const text = readFileSync(join(dir, r.dartFile), 'utf8');
  assert.ok(text.startsWith('// material3 skill asset: generated/m3_symbols.dart\n'));
  assert.match(text, /abstract final class M3Symbols \{/);
  const got = constants(text);
  const map = loadCodepoints();
  for (const n of [...NAMES, ...ODD]) assert.equal(got[constantName(n)], map.get(n), n);
  assert.equal(Object.keys(got).length, NAMES.length + ODD.length);
  assert.equal(got.settings, map.get('settings'));
  assert.equal(got.arrowBack, map.get('arrow_back'));
  assert.ok('$10k' in got && '$class' in got && '$2d_2' in got, 'non-identifiers get a $ prefix, unmappable names stay snake_case');
}));

test('pubspecEdit is the fonts entry; pubspec.yaml is never written; the TTF is copied once', () => project((dir) => {
  writeFileSync(join(dir, 'pubspec.yaml'), 'name: x\n');
  const r = flutterIcons({ projectDir: dir, names: ['home'] });
  assert.equal(r.pubspecEdit, '    - family: MaterialSymbolsOutlined\n      fonts:\n        - asset: assets/fonts/MaterialSymbolsOutlined.ttf');
  assert.equal(readFileSync(join(dir, 'pubspec.yaml'), 'utf8'), 'name: x\n');
  assert.equal(r.fontCopied, true);
  assert.ok(existsSync(join(dir, r.font)));
  assert.equal(flutterIcons({ projectDir: dir, names: ['home'] }).fontCopied, false);
}));

test('a second run adds icons; a foreign m3_symbols.dart is not overwritten; Rounded gets the notice', () => project((dir) => {
  flutterIcons({ projectDir: dir, names: ['home'] });
  const r = flutterIcons({ projectDir: dir, names: ['settings', 'class'], style: 'rounded' });
  assert.deepEqual(Object.keys(constants(readFileSync(join(dir, r.dartFile), 'utf8'))), ['$class', 'home', 'settings']);
  assert.match(r.notice, /^Rounded icons requested but could not be downloaded \(offline\?\); used bundled Outlined\./);
  assert.equal(flutterIcons({ projectDir: dir, names: ['home'] }).notice, undefined);
  writeFileSync(join(dir, r.dartFile), '// mine\n');
  const bad = flutterIcons({ projectDir: dir, names: ['home'] });
  assert.equal(bad.exitCode, 3);
  assert.equal(readFileSync(join(dir, r.dartFile), 'utf8'), '// mine\n');
}));

test('CLI: path with spaces, unknown name exits 4, flutter exits 0', () => project((dir) => {
  const ok = spawnSync(process.execPath, [INDEX, dir, '--platform', 'flutter', '--names', 'settings,home'], { encoding: 'utf8' });
  assert.equal(ok.status, 0, ok.stderr);
  assert.equal(JSON.parse(ok.stdout).dartFile, 'lib/m3/m3_symbols.dart');
  const bad = spawnSync(process.execPath, [INDEX, dir, '--platform', 'flutter', '--names', 'setings'], { encoding: 'utf8' });
  assert.equal(bad.status, 4);
}));

const screen = (uses) => `import 'package:flutter/material.dart';
import 'm3/m3_symbols.dart';

class Screen extends StatelessWidget {
  const Screen({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
${uses.map((u) => `        const Icon(M3Symbols.${u}, fill: 1, weight: 700),`).join('\n')}
      ],
    );
  }
}
`;

test('verify: generated usage has no icon-source and no unknown-icon finding; the file is scanned, not exempt', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'm3 flutter icons verify '));
  try {
    const all = [...NAMES, ...ODD];
    flutterIcons({ projectDir: dir, names: all });
    writeFileSync(join(dir, 'lib/screen.dart'), screen(all.map(constantName)));
    const clean = await verify({ projectDir: dir, platform: 'flutter' });
    const bad = clean.violations.filter((v) => ['icon-source', 'unknown-icon', 'asset-unused'].includes(v.check));
    assert.deepEqual(bad, []);
    // Unknown names are still reported, and a hand-edited copy of the generated file is checked like UI code.
    writeFileSync(join(dir, 'lib/screen.dart'), screen(['setings', '$nope']));
    writeFileSync(join(dir, 'lib/m3/m3_symbols.dart'), `${readFileSync(join(dir, 'lib/m3/m3_symbols.dart'), 'utf8')}\nconst x = Icons.home;\n`);
    const r = await verify({ projectDir: dir, platform: 'flutter' });
    assert.equal(r.violations.filter((v) => v.check === 'unknown-icon').length, 2);
    assert.ok(r.violations.some((v) => v.check === 'icon-source' && v.file.endsWith('m3_symbols.dart')));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
