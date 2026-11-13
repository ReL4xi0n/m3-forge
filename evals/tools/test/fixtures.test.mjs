import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { FIXTURES, FIXTURES_DIR, GRADLE_FLAGS, fixtureKind, prepareFixture, runTool } from '../prepare-fixture.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..', '..');
const MB = 1024 * 1024;
const GENERATED = new Set(['node_modules', 'build', 'dist', '.dart_tool', '.gradle', '.kotlin']);
const skipToolchain = process.env.M3_TOOLCHAIN_TESTS !== '1' && 'needs the local toolchain (M3_TOOLCHAIN_TESTS=1)';

function walk(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    out.push({ path: p, name: e.name, dir: e.isDirectory() });
    if (e.isDirectory()) walk(p, out);
  }
  return out;
}

test('FIXTURES names the six fixture folders', () => {
  assert.deepEqual(FIXTURES, ['web-empty', 'web-react', 'web-vue', 'flutter-material_ui', 'flutter-legacy', 'compose-1.5']);
  assert.equal(FIXTURES_DIR, join(root, 'evals', 'fixtures'));
  assert.deepEqual(FIXTURES.map(fixtureKind), ['web', 'web', 'web', 'flutter', 'flutter', 'compose']);
});

test('every fixture folder exists, holds no generated folders and no file over 1 MB', () => {
  for (const name of FIXTURES) {
    const dir = join(FIXTURES_DIR, name);
    assert.ok(existsSync(dir) && statSync(dir).isDirectory(), `${name} exists`);
    for (const e of walk(dir)) {
      const rel = relative(FIXTURES_DIR, e.path).replace(/\\/g, '/');
      assert.ok(!(e.dir && GENERATED.has(e.name)), `generated folder in fixture: ${rel}`);
      if (!e.dir && e.name !== 'gradle-wrapper.jar') assert.ok(statSync(e.path).size <= MB, `over 1 MB: ${rel}`);
    }
  }
  assert.deepEqual(readdirSync(join(FIXTURES_DIR, 'web-empty')), ['.gitkeep']);
});

test('fixtures pin their versions and commit their lockfiles', () => {
  for (const name of ['web-react', 'web-vue']) {
    const dir = join(FIXTURES_DIR, name);
    assert.ok(existsSync(join(dir, 'package-lock.json')), `${name}: package-lock.json`);
    const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
    for (const [dep, v] of Object.entries({ ...pkg.dependencies, ...pkg.devDependencies })) {
      assert.match(v, /^\d+\.\d+\.\d+(-[\w.]+)?$/, `${name}: ${dep}@${v} is not an exact version`);
    }
  }
  for (const name of ['flutter-material_ui', 'flutter-legacy']) {
    const dir = join(FIXTURES_DIR, name);
    assert.ok(existsSync(join(dir, 'pubspec.lock')), `${name}: pubspec.lock`);
    const pubspec = readFileSync(join(dir, 'pubspec.yaml'), 'utf8');
    if (name === 'flutter-material_ui') assert.match(pubspec, /^\s+material_ui: 1\.11\.0\s*$/m);
    else assert.doesNotMatch(pubspec, /material_ui/);
  }
  const compose = join(FIXTURES_DIR, 'compose-1.5');
  const catalog = readFileSync(join(compose, 'gradle', 'libs.versions.toml'), 'utf8');
  assert.match(catalog, /"1\.5\.0-rc01"/);
  assert.ok(existsSync(join(compose, 'gradle', 'wrapper', 'gradle-wrapper.properties')));
  assert.ok(existsSync(join(compose, 'gradle', 'wrapper', 'gradle-wrapper.jar')));
  assert.ok(existsSync(join(compose, 'gradlew.bat')));
});

const BUILD = {
  web: ['npm', ['run', 'build']],
  flutter: ['flutter', ['test']],
  compose: ['./gradlew.bat', [...GRADLE_FLAGS, 'assembleDebug']],
};

for (const name of FIXTURES) {
  test(`${name}: prepareFixture copies, installs, then the project builds with no edits`, { skip: skipToolchain, timeout: 30 * 60 * 1000 }, async () => {
    // realpath: tmpdir() can be an 8.3 short path (MUHAMM~1), which breaks Vite's HTML emit.
    const dest = realpathSync.native(mkdtempSync(join(tmpdir(), `m3-fixture-${name}-`)));
    try {
      const prep = await prepareFixture(name, dest);
      assert.equal(typeof prep.ms, 'number');
      assert.equal(typeof prep.log, 'string');
      assert.ok(prep.ok, `prepare failed:\n${prep.log.slice(-4000)}`);
      if (name === 'web-empty') {
        assert.deepEqual(readdirSync(dest), []);
        return;
      }
      const [cmd, args] = BUILD[fixtureKind(name)];
      const r = await runTool(cmd, args, dest);
      assert.equal(r.code, 0, `${cmd} ${args.join(' ')} failed:\n${r.out.slice(-4000)}`);
    } finally {
      rmSync(dest, { recursive: true, force: true, maxRetries: 5, retryDelay: 500 });
    }
  });
}
