// Task 23: the Compose project template and the Theme.kt assets.
//   Always: the template files, version pins, install-assets + color script + verify on a copy of the
//   template (folder name with spaces), the exact-body rule for Theme.kt.
//   M3_TOOLCHAIN_TESTS=1 (local toolchain): assembleDebug of the template, and the Roborazzi capture of
//   its sample screen in light and dark with harness/compose/capture.mjs (read-only, not edited).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { syncReport } from '../sync-versions.mjs';

const REPO = fileURLToPath(new URL('../../../', import.meta.url));
const SKILL = join(REPO, 'plugin/skills/material3');
const TEMPLATE = join(SKILL, 'assets/compose/template');
const skill = (p) => pathToFileURL(join(SKILL, p)).href;
const skip = process.env.M3_TOOLCHAIN_TESTS !== '1' && 'needs the local toolchain (M3_TOOLCHAIN_TESTS=1)';
const PKG = 'm3.app';
const THEME_DIR = 'app/src/main/kotlin/m3/app/theme';

// A copy of the template with the theme installed (install-assets) and a color file (color script).
async function project({ parts = ['theme'], name = 'trail notes ' } = {}) {
  const { installAssets } = await import(skill('scripts/install-assets/index.mjs'));
  const { writeTheme } = await import(skill('scripts/color/index.mjs'));
  const dir = realpathSync.native(mkdtempSync(join(tmpdir(), name)));
  cpSync(TEMPLATE, dir, { recursive: true });
  const r = installAssets({ projectDir: dir, platform: 'compose', parts, packageName: PKG });
  assert.deepEqual(r.conflicts, []);
  writeTheme({ platform: 'compose', seed: '#3366CC', variant: 'tonalSpot', packageName: PKG, out: join(dir, THEME_DIR, 'Color.kt') });
  return dir;
}

test('the template ships the project files, a pinned wrapper and no theme files', () => {
  for (const f of ['settings.gradle.kts', 'build.gradle.kts', 'gradle.properties', '.gitignore', 'gradlew', 'gradlew.bat',
    'gradle/libs.versions.toml', 'gradle/wrapper/gradle-wrapper.jar', 'gradle/wrapper/gradle-wrapper.properties',
    'app/build.gradle.kts', 'app/src/main/AndroidManifest.xml', 'app/src/main/kotlin/m3/app/MainActivity.kt']) {
    assert.ok(existsSync(join(TEMPLATE, f)), f);
  }
  assert.ok(!existsSync(join(TEMPLATE, 'app/src/main/kotlin/m3/app/theme')));
  const props = readFileSync(join(TEMPLATE, 'gradle/wrapper/gradle-wrapper.properties'), 'utf8');
  assert.match(props, /distributionSha256Sum=[0-9a-f]{64}/);
  assert.ok(!readFileSync(join(TEMPLATE, 'gradlew'), 'utf8').includes('\r'), 'gradlew has LF line endings');
});

test('sync-versions covers the template catalog, wrapper and compileSdk', () => {
  const rep = syncReport({ check: true });
  assert.deepEqual(rep.differ, []);
  assert.ok(!rep.absent.some((f) => f.includes('assets/compose/template')), `absent: ${rep.absent}`);
});

test('MainActivity opts in to the Expressive API where MaterialShapes and LoadingIndicator are used', () => {
  const text = readFileSync(join(TEMPLATE, 'app/src/main/kotlin/m3/app/MainActivity.kt'), 'utf8');
  assert.match(text, /^\/\/ [^\n]*experimental[^\n]*\n@OptIn\(ExperimentalMaterial3ExpressiveApi::class\)/im);
  assert.match(text, /MaterialShapes/);
  assert.match(text, /LoadingIndicator\(/);
});

test('Theme.kt: expressive theme on 1.5 and later, MaterialTheme below with the missing APIs named', () => {
  const t = readFileSync(join(SKILL, 'assets/compose/theme/Theme.kt'), 'utf8');
  assert.match(t, /fun M3Theme\(\s*darkTheme: Boolean = isSystemInDarkTheme\(\),\s*content: @Composable \(\) -> Unit,\s*\)/);
  assert.match(t, /MaterialExpressiveTheme\(/);
  assert.match(t, /motionScheme = MotionScheme\.expressive\(\)/);
  assert.match(t, /^\/\/ [^\n]*experimental[^\n]*\n@OptIn\(ExperimentalMaterial3ExpressiveApi::class\)/m);
  const old = readFileSync(join(SKILL, 'assets/compose/theme/below-1.5/Theme.kt'), 'utf8');
  assert.match(old, /MaterialTheme\(/);
  assert.ok(!/MaterialExpressiveTheme\(|MotionScheme\.expressive/.test(old.replace(/^\/\/.*$/gm, '')));
  assert.match(old.split('\n').slice(0, 8).join('\n'), /Missing below 1\.5:.*MaterialExpressiveTheme.*MotionScheme.*MaterialShapes.*LoadingIndicator/s);
});

for (const parts of [['theme'], ['theme-below-1.5']]) {
  test(`install-assets ${parts[0]} + color script + verify: zero findings, Theme.kt is a theme asset`, async () => {
    const { verify } = await import(skill('scripts/verify/index.mjs'));
    const dir = await project({ parts });
    try {
      const names = readdirSync(join(dir, THEME_DIR)).sort();
      assert.deepEqual(names, ['Color.kt', 'Motion.kt', 'Shape.kt', 'Space.kt', 'Theme.kt', 'Tokens.kt', 'Type.kt']);
      const theme = readFileSync(join(dir, THEME_DIR, 'Theme.kt'), 'utf8');
      assert.match(theme, /^package m3\.app\.theme\s*$/m);
      const r = await verify({ projectDir: dir, platform: 'compose' });
      assert.deepEqual(r.violations, []);
      assert.ok(Object.values(r.counts).every((n) => n === 0));
      const reason = (f) => r.allowlisted.find((a) => a.file.endsWith(`/${f}`))?.reason;
      const asset = parts[0] === 'theme' ? 'assets/compose/theme/Theme.kt' : 'assets/compose/theme/below-1.5/Theme.kt';
      assert.equal(reason('Theme.kt'), `material3 skill theme asset (${asset})`);
      for (const f of ['Type.kt', 'Shape.kt', 'Space.kt', 'Motion.kt', 'Tokens.kt']) assert.match(reason(f), /^material3 skill theme asset/, f);
      assert.match(reason('Color.kt'), /^material3 skill generated theme/);
      assert.ok(r.uiLines > 0 && r.themeLines > 0);
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
}

test('exact-body rule: an edited Theme.kt that keeps the marker is no longer the shipped asset', async () => {
  const { themeAsset } = await import(skill('scripts/verify/common.mjs'));
  const shipped = readFileSync(join(SKILL, 'assets/compose/theme/Theme.kt'), 'utf8');
  const installed = shipped.replace(/^package m3\.theme[ \t]*$/m, 'package m3.app.theme');
  assert.equal(themeAsset('app/src/main/kotlin/m3/app/theme/Theme.kt', installed), 'assets/compose/theme/Theme.kt');
  const spoofed = `${installed}\nval off = 13.dp\n`;
  assert.equal(themeAsset('app/src/main/kotlin/m3/app/theme/Theme.kt', spoofed), null);
  // The other variant's body does not pass for the main asset.
  const other = readFileSync(join(SKILL, 'assets/compose/theme/below-1.5/Theme.kt'), 'utf8').replace(/^package m3\.theme[ \t]*$/m, 'package m3.app.theme');
  assert.equal(themeAsset('app/src/main/kotlin/m3/app/theme/Theme.kt', other), 'assets/compose/theme/below-1.5/Theme.kt');
});

test('both variants of install-assets refuse to overwrite a differing Theme.kt', async () => {
  const { installAssets } = await import(skill('scripts/install-assets/index.mjs'));
  const dir = await project({ parts: ['theme'] });
  try {
    const f = join(dir, THEME_DIR, 'Theme.kt');
    writeFileSync(f, `${readFileSync(f, 'utf8')}// local edit\n`);
    const r = installAssets({ projectDir: dir, platform: 'compose', parts: ['theme-below-1.5'], packageName: PKG });
    assert.deepEqual(r.conflicts, [`app/src/main/kotlin/m3/app/theme/Theme.kt`]);
    assert.deepEqual(r.copied, []);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

async function tools() {
  return import(pathToFileURL(join(REPO, 'evals/tools/prepare-fixture.mjs')).href);
}

test('toolchain: the template builds (assembleDebug)', { skip, timeout: 40 * 60_000 }, async () => {
  const { GRADLE_FLAGS, runTool } = await tools();
  const dir = await project({ name: 'm3tpl-' });
  try {
    const r = await runTool('./gradlew.bat', [...GRADLE_FLAGS, '--offline', ':app:assembleDebug'], dir);
    assert.equal(r.code, 0, r.out.slice(-4000));
    assert.ok(existsSync(join(dir, 'app/build/outputs/apk/debug/app-debug.apk')));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('toolchain: Roborazzi captures the sample screen in light and dark', { skip, timeout: 40 * 60_000 }, async () => {
  const { captureCompose } = await import(pathToFileURL(join(REPO, 'harness/compose/capture.mjs')).href);
  const dir = await project({ name: 'm3cap-' });
  const out = mkdtempSync(join(tmpdir(), 'm3cap-out-'));
  try {
    const r = await captureCompose({ projectDir: dir, outDir: out });
    const shots = readdirSync(out).filter((f) => f.endsWith('.png')).sort();
    assert.deepEqual(shots, ['dark-412x915.png', 'light-412x915.png']);
    assert.notDeepEqual(readFileSync(join(out, shots[0])), readFileSync(join(out, shots[1])), 'light and dark differ');
    assert.ok(r, 'capture object returned');
    if (process.env.M3_KEEP_SHOTS) cpSync(out, join(process.env.M3_KEEP_SHOTS, basename(out)), { recursive: true });
  } finally {
    rmSync(dir, { recursive: true, force: true });
    rmSync(out, { recursive: true, force: true });
  }
});

test('sync-versions --check reports a template catalog, wrapper or compileSdk that drifts, and the fix mode repairs it', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'sync template '));
  try {
    const rels = ['gradle/libs.versions.toml', 'gradle/wrapper/gradle-wrapper.properties', 'app/build.gradle.kts'];
    mkdirSync(join(tmp, 'plugin/skills/material3'), { recursive: true });
    cpSync(join(SKILL, 'versions.json'), join(tmp, 'plugin/skills/material3/versions.json'));
    for (const r of rels) {
      mkdirSync(join(tmp, 'plugin/skills/material3/assets/compose/template', r, '..'), { recursive: true });
      cpSync(join(TEMPLATE, r), join(tmp, 'plugin/skills/material3/assets/compose/template', r));
    }
    const at = (r) => join(tmp, 'plugin/skills/material3/assets/compose/template', r);
    assert.deepEqual(syncReport({ check: true, root: tmp }).differ, []);
    writeFileSync(at(rels[0]), readFileSync(at(rels[0]), 'utf8').replace('1.5.0-rc01', '1.4.0'));
    writeFileSync(at(rels[1]), readFileSync(at(rels[1]), 'utf8').replace('gradle-9.6.0', 'gradle-8.0'));
    writeFileSync(at(rels[2]), readFileSync(at(rels[2]), 'utf8').replace('compileSdk = 37', 'compileSdk = 35'));
    assert.equal(syncReport({ check: true, root: tmp }).differ.length, 3);
    assert.equal(syncReport({ check: false, root: tmp }).differ.length, 3);
    assert.deepEqual(syncReport({ check: true, root: tmp }).differ, []);
  } finally { rmSync(tmp, { recursive: true, force: true }); }
});

test('toolchain: Roborazzi shows the settings icon unfilled and filled', { skip, timeout: 40 * 60_000 }, async () => {
  const { captureCompose } = await import(pathToFileURL(join(REPO, 'harness/compose/capture.mjs')).href);
  const { composeIcons } = await import(skill('scripts/icons/compose.mjs'));
  const dir = await project({ name: 'm3ico-' });
  const out = mkdtempSync(join(tmpdir(), 'm3ico-out-'));
  try {
    assert.equal(composeIcons({ projectDir: dir, names: ['settings'] }).files.length, 2);
    const f = join(dir, 'app/src/main/kotlin/m3/app/MainActivity.kt');
    const row = 'Row {\n Icon(painterResource(R.drawable.m3s_settings), contentDescription = "Settings")\n Icon(painterResource(R.drawable.m3s_settings_fill1), contentDescription = "Settings selected")\n }\n FilledTonalButton(onClick = { }) {';
    writeFileSync(f, readFileSync(f, 'utf8')
      .replace('FilledTonalButton(onClick = { }) {', row)
      .replace('import androidx.compose.material3.Scaffold', 'import androidx.compose.material3.Icon\nimport androidx.compose.material3.Scaffold\nimport androidx.compose.ui.res.painterResource'));
    const cap = await captureCompose({ projectDir: dir, outDir: out });
    assert.ok(existsSync(join(out, 'light-412x915.png')), JSON.stringify(cap).slice(0, 3000));
    if (process.env.M3_KEEP_SHOTS) cpSync(out, join(process.env.M3_KEEP_SHOTS, basename(out)), { recursive: true });
  } finally {
    rmSync(dir, { recursive: true, force: true });
    rmSync(out, { recursive: true, force: true });
  }
});
