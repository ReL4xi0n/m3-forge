// Flutter back end of the screenshot step: renders the app's home (lib/main.dart) at 412x915 (device
// pixel ratio 2.625) in light and dark, plus frames scrolled one viewport at a time down the first
// vertical Scrollable (at most 4 frames per theme), and measures text contrast and 48 dp touch
// targets with flutter_test's guidelines. Results are { where, detail } entries, the shape verify
// reads from capture.json `runtime`.
//
// Nothing is written into the project and nothing is installed. The project is copied to a folder
// under the OS temp directory (without .git, build, .dart_tool, node_modules and the platform
// folders), `flutter pub get` runs there, and a generated test (shots_test.dart.tmpl, with the font
// loader flutter_test_config.dart.tmpl) runs from the copy. The copy is deleted afterwards. Files:
//   <theme>-412x915-<nn>.png   nn = 01 for the top of the home screen, 02.. one viewport lower each
//   runtime-<theme>.json       raw guideline results per frame; app-fonts.json
// Without the Flutter SDK on PATH the step is skipped with the reason.
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, dirname, extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const SKILL = join(here, '..', '..');
const THEMES = ['light', 'dark'];
const VIEWPORT = '412x915';
const TEST_FILE = 'm3_shots_test.dart';
const CONFIG_FILE = 'flutter_test_config.dart';
const PROJECT_CONFIG_FILE = 'm3_project_test_config.dart';
const NEEDED_FONTS = ['RobotoFlex.ttf', 'Roboto.ttf', 'MaterialSymbolsOutlined.ttf'];
const SKIP_TOP = new Set(['.git', 'build', '.dart_tool', 'node_modules', 'android', 'ios', 'macos', 'linux', 'windows', 'web', '.idea', '.gradle']);
const TEST_TIMEOUT_MS = 10 * 60_000;
const PUB_TIMEOUT_MS = 5 * 60_000;
const TAIL_LINES = 40;
export const MIGRATE_COMMAND = 'dart fix --apply --code=migrate_design_widgets';

const EMPTY = () => ({ shots: [], runtime: { contrast: [], targets: [] } });
const tail = (text, n = TAIL_LINES) => text.replace(/\r\n/g, '\n').trimEnd().split('\n').slice(-n).join('\n');

const pathKey = (env) => Object.keys(env).find((k) => k.toLowerCase() === 'path') ?? 'PATH';

// The flutter launcher on PATH, or null.
export function findFlutter(env = process.env) {
  const names = process.platform === 'win32' ? ['flutter.bat', 'flutter.cmd', 'flutter.exe'] : ['flutter'];
  for (const dir of String(env[pathKey(env)] ?? '').split(delimiter)) {
    if (!dir) continue;
    for (const n of names) {
      const p = join(dir, n);
      try { if (statSync(p).isFile()) return p; } catch { /* next */ }
    }
  }
  return null;
}

// Runs the launcher (a .bat or .cmd shim on Windows) and collects its output.
function run(exe, args, { cwd, env, timeoutMs }) {
  return new Promise((res) => {
    const win = process.platform === 'win32' && /\.(bat|cmd)$/i.test(exe);
    const q = (s) => `"${s}"`;
    const child = win
      ? spawn('cmd.exe', ['/d', '/s', '/c', `"${[q(exe), ...args].join(' ')}"`], { cwd, env, windowsHide: true, windowsVerbatimArguments: true })
      : spawn(exe, args, { cwd, env, windowsHide: true });
    let output = '';
    child.stdout.on('data', (d) => { output += d; });
    child.stderr.on('data', (d) => { output += d; });
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      if (process.platform === 'win32') spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { windowsHide: true });
      else child.kill('SIGKILL');
    }, timeoutMs);
    child.on('error', (e) => { output += `\n${e.message}`; });
    child.on('close', (code) => { clearTimeout(timer); res({ code: timedOut ? null : code, timedOut, output }); });
  });
}

function flutterVersion(exe, env) {
  const win = process.platform === 'win32' && /\.(bat|cmd)$/i.test(exe);
  const r = win
    ? spawnSync('cmd.exe', ['/d', '/s', '/c', `"${[`"${exe}"`, '--version', '--machine'].join(' ')}"`], { env, encoding: 'utf8', timeout: 60_000, windowsHide: true, windowsVerbatimArguments: true })
    : spawnSync(exe, ['--version', '--machine'], { env, encoding: 'utf8', timeout: 60_000, windowsHide: true });
  try { return JSON.parse(String(r.stdout).match(/\{[\s\S]*\}/)[0]).frameworkVersion ?? null; } catch { return null; }
}

const atLeast = (v, major, minor) => {
  const m = String(v ?? '').match(/^(\d+)\.(\d+)/);
  return !!m && (Number(m[1]) > major || (Number(m[1]) === major && Number(m[2]) >= minor));
};

export function packageName(projectDir) {
  try {
    const m = readFileSync(join(projectDir, 'pubspec.yaml'), 'utf8').match(/^name:\s*['"]?([A-Za-z_][A-Za-z0-9_]*)['"]?\s*$/m);
    return m ? m[1] : null;
  } catch { return null; }
}

function dartFiles(dir, out = []) {
  let entries = [];
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) dartFiles(p, out);
    else if (extname(e.name) === '.dart') out.push(p);
  }
  return out;
}

// Warning for a project that still imports flutter/material.dart on a Flutter that has material_ui.
// Report only: nothing in the project changes.
export function legacyImportWarning(projectDir, version) {
  if (!atLeast(version, 3, 50)) return null;
  let pub = '';
  try { pub = readFileSync(join(projectDir, 'pubspec.yaml'), 'utf8'); } catch { return null; }
  if (/^\s*material_ui\s*:/m.test(pub)) return null;
  const uses = dartFiles(join(projectDir, 'lib')).some((f) => /package:flutter\/material\.dart/.test(readFileSync(f, 'utf8')));
  if (!uses) return null;
  return `Flutter ${version}: this project imports package:flutter/material.dart; the generated code and this step stay on that import and change nothing. To move the project to material_ui yourself, run \`${MIGRATE_COMMAND}\`.`;
}

// Fonts the generated test loads: the skill's own, checked against versions.json.
function checkFonts() {
  const dir = join(SKILL, 'assets', 'fonts');
  const manifest = JSON.parse(readFileSync(join(SKILL, 'versions.json'), 'utf8'));
  for (const name of NEEDED_FONTS) {
    const entry = (manifest.fonts ?? []).find((f) => f.file === name);
    const file = join(dir, name);
    if (!entry || !existsSync(file)) throw new Error(`font missing: ${file}`);
    const got = createHash('sha256').update(readFileSync(file)).digest('hex');
    if (got !== entry.sha256) throw new Error(`sha256 mismatch for ${name}: got ${got}, versions.json says ${entry.sha256}`);
  }
  return dir;
}

// Relative path dependencies of the copy point at the project's neighbors: make them absolute.
function absolutizePathDeps(copy, projectDir) {
  const file = join(copy, 'pubspec.yaml');
  const text = readFileSync(file, 'utf8');
  const fixed = text.replace(/^(\s+path:\s*)(['"]?)(\.\.?[\\/][^'"\r\n]*|\.\.?)\2\s*$/gm, (all, pre, _q, p) => `${pre}'${resolve(projectDir, p).split(sep).join('/')}'`);
  if (fixed !== text) writeFileSync(file, fixed);
}

// flutter_test Evaluation reasons are blocks that end with a "See also: <link>" line; each block
// starts with the failing SemanticsNode. Returns [{ where, detail }], `where` prefixed by `label`.
export function parseGuidelineFailures(reason, label) {
  if (!reason) return [];
  const out = [];
  let block = [];
  const flush = () => {
    const text = block.join('\n').trim();
    block = [];
    if (!text) return;
    const m = text.match(/^(SemanticsNode#\d+\(.*?\)):\s*([\s\S]*)$/);
    out.push(m ? { where: `${label}: ${m[1]}`, detail: m[2].trim() } : { where: `${label}: (unparsed)`, detail: text });
  };
  for (const line of String(reason).split(/\r?\n/)) {
    if (/^See also:/.test(line.trim())) flush();
    else block.push(line);
  }
  flush();
  return out;
}

// screenshotFlutter({ projectDir, outDir, env? }) -> result (see index.mjs).
export async function screenshotFlutter({ projectDir, outDir, env = process.env, timeoutMs = TEST_TIMEOUT_MS }) {
  const skip = (reason, extra = {}) => ({ ran: false, skippedReason: reason, ...EMPTY(), ...extra });
  const exe = findFlutter(env);
  if (!exe) return skip('Flutter SDK not found on PATH: screenshots skipped (this step never installs); run the shots later with the SDK');

  const version = flutterVersion(exe, env);
  const warnings = [];
  const legacy = legacyImportWarning(projectDir, version);
  if (legacy) warnings.push(legacy);
  const tag = { flutter: { path: exe, version }, ...(warnings.length ? { warnings } : {}) };

  const name = packageName(projectDir);
  if (!name) return skip(`no package name in ${join(projectDir, 'pubspec.yaml')}: screenshots skipped`, tag);
  if (!existsSync(join(projectDir, 'lib', 'main.dart'))) return skip('lib/main.dart not found: screenshots skipped', tag);
  let fonts;
  try { fonts = checkFonts(); } catch (e) { return skip(`the skill fonts are not usable (${e.message}): screenshots skipped`, tag); }

  const work = mkdtempSync(join(tmpdir(), 'm3-flutter-shots-'));
  const copy = join(work, name);
  try {
    cpSync(projectDir, copy, {
      recursive: true,
      filter: (src) => {
        const rel = relative(projectDir, src);
        return rel === '' || !SKIP_TOP.has(rel.split(sep)[0]);
      },
    });
    absolutizePathDeps(copy, projectDir);
    mkdirSync(join(copy, 'test'), { recursive: true });
    // The project's own test config stays in effect: it runs after the fonts load.
    const hasConfig = existsSync(join(copy, 'test', CONFIG_FILE));
    if (hasConfig) renameSync(join(copy, 'test', CONFIG_FILE), join(copy, 'test', PROJECT_CONFIG_FILE));
    writeFileSync(join(copy, 'test', TEST_FILE), readFileSync(join(here, 'flutter', 'shots_test.dart.tmpl'), 'utf8').replaceAll('__M3_APP_PACKAGE__', name));
    writeFileSync(join(copy, 'test', CONFIG_FILE), readFileSync(join(here, 'flutter', 'flutter_test_config.dart.tmpl'), 'utf8')
      .replace('__M3_PROJECT_CONFIG_IMPORT__', hasConfig ? `import '${PROJECT_CONFIG_FILE}' as project;` : '')
      .replace('__M3_RUN_MAIN__', hasConfig ? 'project.testExecutable(testMain)' : 'testMain()'));

    const childEnv = { ...env, M3_FONTS_DIR: fonts, M3_CAPTURE_OUT: outDir, FLUTTER_SUPPRESS_ANALYTICS: 'true' };
    let pub = await run(exe, ['pub', 'get', '--offline'], { cwd: copy, env: childEnv, timeoutMs: PUB_TIMEOUT_MS });
    if (pub.code !== 0) pub = await run(exe, ['pub', 'get'], { cwd: copy, env: childEnv, timeoutMs: PUB_TIMEOUT_MS });
    if (pub.code !== 0) return skip(`flutter pub get failed in the temporary copy: screenshots skipped\n${tail(pub.output)}`, { ...tag, buildOk: false });

    for (const theme of THEMES) {
      for (const f of readdirSync(outDir)) if (f.startsWith(`${theme}-${VIEWPORT}-`) || f === `runtime-${theme}.json`) rmSync(join(outDir, f), { force: true });
    }
    let last;
    // One `flutter test` process per theme: an endless animation of one theme must not reach the next.
    for (const theme of THEMES) {
      last = await run(exe, ['test', `test/${TEST_FILE}`, '--name', `m3.shots.${theme}.`, '--reporter', 'expanded'], { cwd: copy, env: childEnv, timeoutMs });
      if (last.timedOut || last.code !== 0) break;
    }
    if (last.timedOut) return skip(`flutter test timed out after ${timeoutMs} ms: screenshots skipped\n${tail(last.output)}`, { ...tag, buildOk: false });
    if (last.code !== 0) return skip(`the app did not build or run under flutter test: screenshots skipped\n${tail(last.output)}`, { ...tag, buildOk: false });

    const shots = [];
    const contrast = [];
    const targets = [];
    const seen = new Set();
    // The same fixed element shows in several frames: keep it once per theme (the node id and its rect, which moves with the scroll, are left out of the key).
    const add = (list, items, theme) => {
      for (const it of items) {
        const key = `${theme}|${it.where.split(': ').slice(1).join(': ').replace(/#\d+/g, '').replace(/Rect\.fromLTRB\([^)]*\)/g, '')}|${it.detail}`;
        if (seen.has(key)) continue;
        seen.add(key);
        list.push(it);
      }
    };
    let truncated = false;
    for (const theme of THEMES) {
      const jsonFile = join(outDir, `runtime-${theme}.json`);
      if (!existsSync(jsonFile)) return skip(`flutter test passed but wrote no ${theme} capture: screenshots skipped\n${tail(last.output)}`, { ...tag, buildOk: false });
      const raw = JSON.parse(readFileSync(jsonFile, 'utf8'));
      if (raw.truncated) truncated = true;
      for (const fr of raw.frames) {
        const png = join(outDir, fr.file);
        if (!existsSync(png)) return skip(`flutter test passed but wrote no ${fr.file}: screenshots skipped`, { ...tag, buildOk: false });
        shots.push(png);
        const label = `${theme} frame ${fr.frame}/${raw.frames.length}`;
        add(contrast, parseGuidelineFailures(fr.textContrastGuideline?.reason, label), theme);
        add(targets, parseGuidelineFailures(fr.touchTargetGuideline?.reason, label), theme);
      }
      if (raw.settle && raw.settle !== 'settled') warnings.push(`${theme}: the screen kept animating (${raw.settle}); the frame at that moment is shown`);
    }
    if (truncated) warnings.push('the first vertical Scrollable is longer than 4 viewports: the frames stop before its end; plan-check the rest by reading the code');
    return {
      ran: true,
      buildOk: true,
      ...tag,
      shots,
      runtime: { contrast, targets },
      ...(warnings.length ? { warnings } : {}),
    };
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}
