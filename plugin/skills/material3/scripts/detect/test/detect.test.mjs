import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cp, mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { detect } from '../index.mjs';

const INDEX = fileURLToPath(new URL('../index.mjs', import.meta.url));
const FIXTURES = fileURLToPath(new URL('../../../../../../evals/fixtures/', import.meta.url));

// A fake environment: an empty PATH directory so no external tool resolves.
async function bare() {
  const dir = await mkdtemp(join(tmpdir(), 'm3 detect path '));
  return { dir, env: { PATH: dir, SystemRoot: process.env.SystemRoot, ComSpec: process.env.ComSpec } };
}

async function copyFixture(name, edit) {
  const root = await mkdtemp(join(tmpdir(), 'm3 detect fx '));
  const dest = join(root, name);
  await cp(join(FIXTURES, name), dest, { recursive: true });
  if (edit) await edit(dest);
  return { root, dest };
}

async function run(name, platform, edit) {
  const { dir, env } = await bare();
  const { root, dest } = await copyFixture(name, edit);
  try {
    return await detect(dest, { platform, env });
  } finally {
    await rm(root, { recursive: true, force: true });
    await rm(dir, { recursive: true, force: true });
  }
}

test('web-empty: plain web, empty', async () => {
  const r = await run('web-empty');
  assert.equal(r.platform, 'web');
  assert.equal(r.framework, 'plain');
  assert.equal(r.empty, true);
  assert.equal(r.flutterLibrary, null);
  assert.equal(r.belowExpressive, false);
});

test('web-react: react, not empty', async () => {
  const r = await run('web-react');
  assert.equal(r.platform, 'web');
  assert.equal(r.framework, 'react');
  assert.equal(r.empty, false);
});

test('web-vue: vue', async () => {
  const r = await run('web-vue');
  assert.equal(r.framework, 'vue');
});

test('next, nuxt and sveltekit map to their base framework', async () => {
  for (const [dep, want] of [['next', 'react'], ['nuxt', 'vue'], ['@sveltejs/kit', 'svelte'], ['svelte', 'svelte']]) {
    const root = await mkdtemp(join(tmpdir(), 'm3 detect fw '));
    try {
      await writeFile(join(root, 'package.json'), JSON.stringify({ devDependencies: { [dep]: '1.0.0' } }));
      const r = await detect(root, { env: { PATH: '' } });
      assert.equal(r.framework, want, dep);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  }
});

test('web: css files defining --md-sys-color- are theme files; node_modules skipped', async () => {
  const root = await mkdtemp(join(tmpdir(), 'm3 detect css '));
  try {
    await mkdir(join(root, 'src'), { recursive: true });
    await mkdir(join(root, 'node_modules', 'x'), { recursive: true });
    await writeFile(join(root, 'package.json'), '{}');
    await writeFile(join(root, 'src', 'theme.css'), ':root { --md-sys-color-primary: #123456; }');
    await writeFile(join(root, 'src', 'other.css'), 'a { color: red }');
    await writeFile(join(root, 'node_modules', 'x', 'dep.css'), ':root { --md-sys-color-primary: #000; }');
    const r = await detect(root, { env: { PATH: '' } });
    assert.deepEqual(r.themeFiles, ['src/theme.css']);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('flutter-material_ui: material_ui library', async () => {
  const r = await run('flutter-material_ui');
  assert.equal(r.platform, 'flutter');
  assert.equal(r.framework, null);
  assert.equal(r.flutterLibrary, 'material_ui');
  assert.equal(r.flutterVersion, null);
});

test('flutter-legacy: material library, ThemeData files found', async () => {
  const r = await run('flutter-legacy');
  assert.equal(r.platform, 'flutter');
  assert.equal(r.flutterLibrary, 'material');
  assert.ok(r.themeFiles.includes('lib/main.dart'), JSON.stringify(r.themeFiles));
});

test('compose-1.5: material3 1.5.0-rc01 is not below expressive', async () => {
  const r = await run('compose-1.5');
  assert.equal(r.platform, 'compose');
  assert.equal(r.composeMaterial3, '1.5.0-rc01');
  assert.equal(r.belowExpressive, false);
});

test('compose pinned to 1.4.0 is below expressive', async () => {
  const r = await run('compose-1.5', undefined, async (dest) => {
    const f = join(dest, 'gradle', 'libs.versions.toml');
    await writeFile(f, (await readFile(f, 'utf8')).replace('1.5.0-rc01', '1.4.0'));
  });
  assert.equal(r.composeMaterial3, '1.4.0');
  assert.equal(r.belowExpressive, true);
});

test('compose version read directly from build.gradle.kts', async () => {
  const r = await run('compose-1.5', undefined, async (dest) => {
    await rm(join(dest, 'gradle', 'libs.versions.toml'));
    const f = join(dest, 'app', 'build.gradle.kts');
    await writeFile(f, (await readFile(f, 'utf8')).replace('implementation(libs.androidx.compose.material3)', 'implementation("androidx.compose.material3:material3:1.3.1")'));
  });
  assert.equal(r.platform, 'compose');
  assert.equal(r.composeMaterial3, '1.3.1');
  assert.equal(r.belowExpressive, true);
});

test('1.10.0 compares numerically above 1.5.0', async () => {
  const r = await run('compose-1.5', undefined, async (dest) => {
    const f = join(dest, 'gradle', 'libs.versions.toml');
    await writeFile(f, (await readFile(f, 'utf8')).replace('1.5.0-rc01', '1.10.0'));
  });
  assert.equal(r.belowExpressive, false);
});

test('explicit platform argument overrides detection', async () => {
  const r = await run('web-react', 'flutter');
  assert.equal(r.platform, 'flutter');
  assert.equal(r.flutterLibrary, null);
  const r2 = await run('flutter-legacy', 'web');
  assert.equal(r2.platform, 'web');
  assert.equal(r2.framework, 'plain');
});

test('tools reflect a PATH without flutter or node; ANDROID_HOME needs platforms/', async () => {
  const { dir, env } = await bare();
  const sdk = await mkdtemp(join(tmpdir(), 'm3 detect sdk '));
  const root = await mkdtemp(join(tmpdir(), 'm3 detect t '));
  try {
    const a = await detect(root, { env });
    assert.equal(a.tools.flutter.available, false);
    assert.equal(a.tools.java.available, false);
    assert.equal(a.tools.androidSdk.available, false);
    assert.equal(a.tools.node.available, true);
    assert.equal(a.tools.node.onPath, false);
    assert.equal(a.tools.node.version, process.version);
    assert.equal(typeof a.tools.playwright.available, 'boolean');
    const b = await detect(root, { env: { ...env, ANDROID_HOME: sdk } });
    assert.equal(b.tools.androidSdk.available, false);
    await mkdir(join(sdk, 'platforms'));
    const c = await detect(root, { env: { ...env, ANDROID_SDK_ROOT: sdk } });
    assert.equal(c.tools.androidSdk.available, true);
  } finally {
    await rm(root, { recursive: true, force: true });
    await rm(dir, { recursive: true, force: true });
    await rm(sdk, { recursive: true, force: true });
  }
});

test('playwright resolves from the project', async () => {
  const root = await mkdtemp(join(tmpdir(), 'm3 detect pw '));
  try {
    await mkdir(join(root, 'node_modules', 'playwright'), { recursive: true });
    await writeFile(join(root, 'node_modules', 'playwright', 'package.json'), '{"name":"playwright","version":"9.9.9","main":"index.js"}');
    await writeFile(join(root, 'node_modules', 'playwright', 'index.js'), '');
    const r = await detect(root, { env: { PATH: '' } });
    assert.equal(r.tools.playwright.available, true);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('cli: JSON on stdout, path with spaces, exit 2 on bad usage', async () => {
  const { root, dest } = await copyFixture('web-react');
  try {
    const r = spawnSync(process.execPath, [INDEX, dest], { encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr);
    assert.equal(JSON.parse(r.stdout).framework, 'react');
    const o = spawnSync(process.execPath, [INDEX, dest, 'compose'], { encoding: 'utf8' });
    assert.equal(JSON.parse(o.stdout).platform, 'compose');
    assert.equal(spawnSync(process.execPath, [INDEX], { encoding: 'utf8' }).status, 2);
    assert.equal(spawnSync(process.execPath, [INDEX, dest, 'ios'], { encoding: 'utf8' }).status, 2);
    assert.equal(spawnSync(process.execPath, [INDEX, join(dest, 'nope')], { encoding: 'utf8' }).status, 2);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
