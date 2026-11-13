// m3-forge Flutter capture (spec §10, plan Task 7).
//
//   captureFlutter({ projectDir, outDir }) -> shared capture object (also written to outDir/capture.json)
//   CLI: node harness/flutter/capture.mjs <projectDir> <outDir>
//
// Copies capture_test.dart (as test/m3_capture_test.dart) and flutter_test_config.dart into the
// project's test/ folder, runs `flutter test test/m3_capture_test.dart` with the toolchain, then
// removes them again and restores any flutter_test_config.dart the project had.
// Screenshots use toImage on the root render view, not goldens, so no --update-goldens.
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { toolchainRoot, withToolchain } from '../../evals/tools/toolchain-env.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, '..', '..');
export const FONTS_MANIFEST = join(repo, 'tools', 'toolchain', 'fonts.json');
const NEEDED_FONTS = ['RobotoFlex.ttf', 'Roboto.ttf', 'MaterialSymbolsOutlined.ttf', 'MaterialSymbolsOutlined.codepoints'];
const THEMES = ['light', 'dark'];
const VIEWPORT = '412x915';
const TEST_FILE = 'm3_capture_test.dart';
const CONFIG_FILE = 'flutter_test_config.dart';
const BACKUP_SUFFIX = '.m3-forge-backup';
const TAIL_LINES = 40;

export function fontsDir(env = process.env) {
  return join(toolchainRoot(env), 'fonts');
}

// Throws (a harness problem, not an app finding) when a font is missing or its hash is wrong.
export function verifyFonts(dir = fontsDir()) {
  const manifest = JSON.parse(readFileSync(FONTS_MANIFEST, 'utf8'));
  for (const name of NEEDED_FONTS) {
    const entry = manifest.files.find(f => f.name === name);
    if (!entry) throw new Error(`m3-forge: ${name} is not in ${FONTS_MANIFEST}`);
    const file = join(dir, name);
    if (!existsSync(file)) throw new Error(`m3-forge: font missing: ${file}`);
    const got = createHash('sha256').update(readFileSync(file)).digest('hex');
    if (got !== entry.sha256) throw new Error(`m3-forge: sha256 mismatch for ${name}: got ${got}, fonts.json says ${entry.sha256}`);
  }
  return dir;
}

export function packageName(projectDir) {
  const file = join(projectDir, 'pubspec.yaml');
  if (!existsSync(file)) return null;
  const m = readFileSync(file, 'utf8').match(/^name:\s*['"]?([A-Za-z_][A-Za-z0-9_]*)['"]?\s*$/m);
  return m ? m[1] : null;
}

// flutter_test Evaluation reasons are blocks that end with a "See also: <link>" line; each block
// starts with the failing SemanticsNode. Returns [{ where, detail }], `where` prefixed by theme.
export function parseGuidelineFailures(reason, theme) {
  if (!reason) return [];
  const out = [];
  let block = [];
  const flush = () => {
    const text = block.join('\n').trim();
    block = [];
    if (!text) return;
    const m = text.match(/^(SemanticsNode#\d+\(.*?\)):\s*([\s\S]*)$/);
    out.push(m ? { where: `${theme}: ${m[1]}`, detail: m[2].trim() } : { where: `${theme}: (unparsed)`, detail: text });
  };
  for (const line of String(reason).split(/\r?\n/)) {
    if (/^See also:/.test(line.trim())) flush();
    else block.push(line);
  }
  flush();
  return out;
}

function tail(text, n = TAIL_LINES) {
  return text.replace(/\r\n/g, '\n').trimEnd().split('\n').slice(-n).join('\n');
}

function run(cmd, args, { cwd, env, timeoutMs }) {
  return new Promise(res => {
    const win = process.platform === 'win32';
    // flutter is a .cmd shim on Windows; the arguments here never contain spaces or quotes.
    const child = win
      ? spawn('cmd.exe', ['/d', '/s', '/c', [cmd, ...args].join(' ')], { cwd, env, windowsHide: true })
      : spawn(cmd, args, { cwd, env });
    let output = '';
    child.stdout.on('data', d => { output += d; });
    child.stderr.on('data', d => { output += d; });
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      if (win) spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { windowsHide: true });
      else child.kill('SIGKILL');
    }, timeoutMs);
    child.on('error', e => { output += `\n${e.message}`; });
    child.on('close', code => {
      clearTimeout(timer);
      res({ code: timedOut ? null : code, timedOut, output });
    });
  });
}

function finish(outDir, capture) {
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'capture.json'), `${JSON.stringify(capture, null, 2)}\n`);
  return capture;
}

export async function captureFlutter({ projectDir, outDir, timeoutMs = 15 * 60_000 }) {
  projectDir = resolve(projectDir);
  outDir = resolve(outDir);
  const fonts = verifyFonts();
  const base = { platform: 'flutter', buildOk: false, reason: undefined, shots: [], runtime: { contrast: [], targets: [] }, raw: {} };

  const name = packageName(projectDir);
  if (!name) return finish(outDir, { ...base, reason: `no package name in ${join(projectDir, 'pubspec.yaml')}` });
  if (!existsSync(join(projectDir, 'lib', 'main.dart'))) return finish(outDir, { ...base, reason: 'lib/main.dart not found' });

  mkdirSync(outDir, { recursive: true });
  for (const t of THEMES) {
    rmSync(join(outDir, `${t}-${VIEWPORT}.png`), { force: true });
    rmSync(join(outDir, `runtime-${t}.json`), { force: true });
  }

  const testDir = join(projectDir, 'test');
  const hadTestDir = existsSync(testDir);
  mkdirSync(testDir, { recursive: true });
  const testPath = join(testDir, TEST_FILE);
  const configPath = join(testDir, CONFIG_FILE);
  const hadConfig = existsSync(configPath);
  if (existsSync(testPath)) throw new Error(`m3-forge: ${testPath} already exists`);
  if (hadConfig) renameSync(configPath, configPath + BACKUP_SUFFIX);

  let result;
  try {
    const template = readFileSync(join(here, 'capture_test.dart'), 'utf8');
    writeFileSync(testPath, template.replaceAll('__M3_APP_PACKAGE__', name));
    copyFileSync(join(here, CONFIG_FILE), configPath);
    const env = {
      ...withToolchain(process.env),
      M3_FONTS_DIR: fonts,
      M3_FONTS_MANIFEST: FONTS_MANIFEST,
      M3_CAPTURE_OUT: outDir,
    };
    result = await run('flutter', ['test', `test/${TEST_FILE}`, '--reporter', 'expanded'], { cwd: projectDir, env, timeoutMs });
  } finally {
    rmSync(testPath, { force: true });
    rmSync(configPath, { force: true });
    if (hadConfig) renameSync(configPath + BACKUP_SUFFIX, configPath);
    if (!hadTestDir) rmSync(testDir, { recursive: true, force: true });
  }

  if (result.timedOut) return finish(outDir, { ...base, reason: `flutter test timed out after ${timeoutMs} ms\n${tail(result.output)}` });
  if (result.code !== 0) return finish(outDir, { ...base, reason: tail(result.output) });

  const capture = { ...base, buildOk: true };
  for (const theme of THEMES) {
    const png = join(outDir, `${theme}-${VIEWPORT}.png`);
    const json = join(outDir, `runtime-${theme}.json`);
    if (!existsSync(png) || !existsSync(json)) {
      return finish(outDir, { ...base, reason: `flutter test passed but wrote no ${theme} capture\n${tail(result.output)}` });
    }
    const raw = JSON.parse(readFileSync(json, 'utf8'));
    capture.raw[theme] = raw;
    capture.shots.push({ file: png, theme, viewport: VIEWPORT });
    capture.runtime.contrast.push(...parseGuidelineFailures(raw.textContrastGuideline?.reason, theme));
    capture.runtime.targets.push(...parseGuidelineFailures(raw.androidTapTargetGuideline?.reason, theme));
  }
  capture.raw.excluded = 'Flutter guidelines skip nodes without a tap/long-press action (null callbacks) and nodes with enabled: false.';
  return finish(outDir, capture);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [projectDir, outDir] = process.argv.slice(2);
  if (!projectDir || !outDir) {
    console.error('usage: node harness/flutter/capture.mjs <projectDir> <outDir>');
    process.exit(2);
  }
  captureFlutter({ projectDir, outDir }).then(
    r => {
      console.log(JSON.stringify(r, null, 2));
      process.exit(r.buildOk ? 0 : 1);
    },
    e => {
      console.error(e.message);
      process.exit(2);
    },
  );
}
