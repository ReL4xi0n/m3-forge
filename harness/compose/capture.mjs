// m3-forge Compose capture (spec §10, plan Task 8).
//
//   captureCompose({ projectDir, outDir }) -> shared capture object (also written to outDir/capture.json)
//   CLI: node harness/compose/capture.mjs <projectDir> <outDir>
//
// Runs the project's own Gradle wrapper with roborazzi.init.gradle.kts, which adds Robolectric,
// Roborazzi and ATF to the app module's unit tests plus M3CaptureTest (src/test/kotlin). The
// project's build files are never edited. M3CaptureTest writes <theme>-412x915.png and
// atf-<theme>.json into outDir; this script normalizes the ATF and semantics results.
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { withToolchain } from '../../evals/tools/toolchain-env.mjs';

const here = dirname(fileURLToPath(import.meta.url));
export const INIT_SCRIPT = join(here, 'roborazzi.init.gradle.kts');
const THEMES = ['light', 'dark'];
const VIEWPORT = '412x915';
const TAIL_LINES = 40;
const SKIP_DIRS = new Set(['build', '.gradle', '.kotlin', '.idea', 'node_modules', 'gradle']);

const isAppBuildFile = text => /com\.android\.application|plugins\.android\.application|android\.application\b/.test(text);

function moduleNamespace(moduleDir, manifest) {
  for (const f of ['build.gradle.kts', 'build.gradle']) {
    const p = join(moduleDir, f);
    if (!existsSync(p)) continue;
    const m = readFileSync(p, 'utf8').match(/\bnamespace\s*=?\s*["']([\w.]+)["']/);
    if (m) return m[1];
  }
  return manifest.match(/<manifest\b[^>]*\bpackage\s*=\s*"([\w.]+)"/)?.[1] ?? null;
}

// Activities (and aliases) whose intent filter has MAIN + LAUNCHER, in manifest order.
function launcherNames(manifest) {
  const names = [];
  const re = /<(activity|activity-alias)\b([^>]*?)(\/>|>([\s\S]*?)<\/\1>)/g;
  for (const m of manifest.matchAll(re)) {
    const body = m[4] ?? '';
    if (!/android\.intent\.action\.MAIN/.test(body) || !/android\.intent\.category\.LAUNCHER/.test(body)) continue;
    const attr = k => m[2].match(new RegExp(`android:${k}\\s*=\\s*"([^"]+)"`))?.[1];
    const name = m[1] === 'activity-alias' ? attr('targetActivity') : attr('name');
    if (name) names.push(name);
  }
  return names;
}

// Finds the module that applies com.android.application and its launcher activity (fully
// qualified). Returns { module, activity } (activity may be null), or null with no app module.
export function findLauncher(projectDir) {
  const candidates = [];
  const visit = (dir, rel, depth) => {
    let entries;
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
    const build = ['build.gradle.kts', 'build.gradle'].map(f => join(dir, f)).find(existsSync);
    const manifestPath = join(dir, 'src', 'main', 'AndroidManifest.xml');
    if (rel && build && existsSync(manifestPath) && isAppBuildFile(readFileSync(build, 'utf8'))) {
      candidates.push({ dir, rel, manifest: readFileSync(manifestPath, 'utf8') });
    }
    if (depth >= 2) return;
    for (const e of entries) {
      if (e.isDirectory() && !e.name.startsWith('.') && !SKIP_DIRS.has(e.name) && e.name !== 'src') {
        visit(join(dir, e.name), rel ? `${rel}/${e.name}` : e.name, depth + 1);
      }
    }
  };
  visit(projectDir, '', 0);
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => (a.rel === 'app' ? -1 : b.rel === 'app' ? 1 : a.rel.localeCompare(b.rel)));
  for (const c of candidates) {
    const [name] = launcherNames(c.manifest);
    if (!name) continue;
    const ns = moduleNamespace(c.dir, c.manifest);
    let activity = name;
    if (name.startsWith('.')) activity = ns ? ns + name : null;
    else if (!name.includes('.')) activity = ns ? `${ns}.${name}` : null;
    return { module: c.rel, activity };
  }
  return { module: candidates[0].rel, activity: null };
}

function tail(text, n = TAIL_LINES) {
  return text.replace(/\r\n/g, '\n').trimEnd().split('\n').slice(-n).join('\n');
}

const quoteWin = a => (/[\s"&|<>^()]/.test(a) ? `"${a.replace(/"/g, '""')}"` : a);

function runGradle(projectDir, args, { env, timeoutMs }) {
  return new Promise(res => {
    const win = process.platform === 'win32';
    // Node refuses to spawn .bat files directly; cmd /d /s /c with a verbatim, fully quoted
    // command line keeps paths with spaces intact.
    const child = win
      ? spawn(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', `"${[join(projectDir, 'gradlew.bat'), ...args].map(quoteWin).join(' ')}"`], {
        cwd: projectDir, env, windowsHide: true, windowsVerbatimArguments: true,
      })
      : spawn('sh', [join(projectDir, 'gradlew'), ...args], { cwd: projectDir, env });
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

function describe(theme, el) {
  if (!el) return `${theme}: (no element)`;
  const parts = [el.className || 'View'];
  if (el.contentDescription) parts.push(`desc="${el.contentDescription}"`);
  if (el.text) parts.push(`text="${el.text}"`);
  if (el.resourceName) parts.push(`id=${el.resourceName}`);
  if (Array.isArray(el.bounds)) parts.push(`bounds=[${el.bounds[0]},${el.bounds[1]}][${el.bounds[2]},${el.bounds[3]}]`);
  return `${theme}: ${parts.join(' ')}`;
}

const center = b => [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2];
const inside = (p, b) => p[0] >= b[0] && p[0] <= b[2] && p[1] >= b[1] && p[1] <= b[3];

// Normalizes one theme's M3CaptureTest report. Disabled nodes (Compose
// SemanticsProperties.Disabled, which ATF sees as isEnabled() == false) are left out.
// - contrast: ATF TextContrastCheck ERROR or WARNING. For Compose text ATF cannot read the text
//   color, so it estimates both colors from the screenshot and reports a WARNING.
// - targets: clickable semantics nodes under 48x48dp, plus any ATF TouchTargetSizeCheck ERROR
//   that is not the same node (ATF sees the touch area Compose extends to 48dp).
export function normalizeReport(theme, report) {
  const contrast = [];
  const targets = [];
  const semantics = (report?.semanticsTargets ?? []).filter(t => t.enabled !== false);
  for (const t of semantics) {
    const label = t.label ? `"${t.label}"` : '(no label)';
    const b = t.bounds ?? [];
    targets.push({
      where: `${theme}: clickable ${label}${t.role ? ` role=${t.role}` : ''} bounds=[${b[0]},${b[1]}][${b[2]},${b[3]}]`,
      detail: `${t.widthDp}x${t.heightDp}dp, below the 48x48dp minimum touch target (layout size)`,
    });
  }
  for (const r of report?.results ?? []) {
    if (r.element?.enabled === false) continue;
    const item = { where: describe(theme, r.element), detail: r.message ?? r.check };
    if (r.check === 'TextContrastCheck' && (r.type === 'ERROR' || r.type === 'WARNING')) contrast.push(item);
    else if (r.check === 'TouchTargetSizeCheck' && r.type === 'ERROR') {
      const bounds = r.element?.bounds;
      if (bounds && semantics.some(t => t.bounds && inside(center(t.bounds), bounds))) continue;
      targets.push(item);
    }
  }
  return { contrast, targets };
}

function finish(outDir, capture) {
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'capture.json'), `${JSON.stringify(capture, null, 2)}\n`);
  return capture;
}

export async function captureCompose({ projectDir, outDir, timeoutMs = 45 * 60_000 }) {
  projectDir = resolve(projectDir);
  outDir = resolve(outDir);
  const base = { platform: 'compose', buildOk: false, reason: undefined, shots: [], runtime: { contrast: [], targets: [] }, raw: {} };

  mkdirSync(outDir, { recursive: true });
  for (const t of THEMES) {
    rmSync(join(outDir, `${t}-${VIEWPORT}.png`), { force: true });
    rmSync(join(outDir, `atf-${t}.json`), { force: true });
  }

  const wrapper = join(projectDir, process.platform === 'win32' ? 'gradlew.bat' : 'gradlew');
  if (!existsSync(wrapper)) return finish(outDir, { ...base, reason: `no Gradle wrapper: ${wrapper} not found` });
  const app = findLauncher(projectDir);
  if (!app) return finish(outDir, { ...base, reason: 'no module applies com.android.application' });

  const args = [
    '--no-daemon', '--console=plain',
    'testDebugUnitTest', '--tests', '*M3CaptureTest*',
    '--init-script', INIT_SCRIPT,
    `-Pm3.outDir=${outDir}`,
    `-Pm3.harnessDir=${here}`,
    ...(app.activity ? [`-Pm3.launcher=${app.activity}`] : []),
    '-Pandroid.builder.sdkDownload=false',
    '-Pkotlin.compiler.execution.strategy=in-process',
  ];
  const result = await runGradle(projectDir, args, { env: withToolchain(process.env), timeoutMs });

  const raw = { module: app.module, launcher: app.activity ?? '(merged manifest)', gradleExitCode: result.code, atf: {}, semanticsTargets: {}, fonts: {} };
  const runtime = { contrast: [], targets: [] };
  const shots = [];
  for (const theme of THEMES) {
    const file = `${theme}-${VIEWPORT}.png`;
    if (existsSync(join(outDir, file))) shots.push({ file, theme, viewport: VIEWPORT });
    const atfPath = join(outDir, `atf-${theme}.json`);
    if (!existsSync(atfPath)) continue;
    const report = JSON.parse(readFileSync(atfPath, 'utf8'));
    raw.atf[theme] = report.results ?? [];
    raw.semanticsTargets[theme] = report.semanticsTargets ?? [];
    raw.fonts[theme] = report.fonts;
    if (report.atfError) raw[`atfError_${theme}`] = report.atfError;
    if (report.semanticsError) raw[`semanticsError_${theme}`] = report.semanticsError;
    const n = normalizeReport(theme, report);
    runtime.contrast.push(...n.contrast);
    runtime.targets.push(...n.targets);
  }

  if (result.timedOut) {
    return finish(outDir, { ...base, shots, runtime, raw, reason: `Gradle timed out after ${timeoutMs} ms\n${tail(result.output, TAIL_LINES - 1)}` });
  }
  if (result.code !== 0) {
    // Compiled, but M3CaptureTest itself failed (for example the activity crashed): the build is
    // fine and the capture is not.
    const captureFailed = /M3CaptureTest > \w+.* FAILED/.test(result.output);
    return finish(outDir, { ...base, buildOk: captureFailed, shots, runtime, raw, reason: tail(result.output) });
  }
  const missing = THEMES.filter(t => !shots.some(s => s.theme === t));
  const reason = missing.length ? `missing screenshots: ${missing.join(', ')}` : undefined;
  return finish(outDir, { ...base, buildOk: true, reason, shots, runtime, raw });
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const [projectDir, outDir] = process.argv.slice(2);
  if (!projectDir || !outDir) {
    console.error('usage: node harness/compose/capture.mjs <projectDir> <outDir>');
    process.exit(2);
  }
  const cap = await captureCompose({ projectDir, outDir });
  console.log(JSON.stringify({ buildOk: cap.buildOk, reason: cap.reason, shots: cap.shots.length, contrast: cap.runtime.contrast.length, targets: cap.runtime.targets.length }, null, 2));
  process.exit(cap.buildOk && !cap.reason ? 0 : 1);
}
