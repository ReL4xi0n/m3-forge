// Compose back end of the screenshot step: renders the app's launcher activity at 412x915 dp (420 dpi)
// in light and dark under Robolectric (native graphics) with Roborazzi, plus frames scrolled one
// viewport at a time down the first vertical scrollable (at most 4 frames per theme), and measures
// text contrast (Accessibility Test Framework) and 48 dp touch targets (semantic touch bounds, minimum interactive size included). Results are { where, detail }
// entries, the shape verify reads from capture.json `runtime`; disabled nodes are left out.
//
// The project does not need Roborazzi, and none of its files is edited: the project is copied to a
// folder under the OS temp directory (without .git, build outputs, .gradle, .kotlin, .idea,
// node_modules), the copy's own Gradle wrapper runs there with the init script
// compose/m3-shots.init.gradle.kts, which adds Robolectric, Roborazzi and ATF to the app module's
// unit tests and a test generated from compose/M3ShotsTest.kt.tmpl. The copy is deleted afterwards.
// Files in the output folder:
//   <theme>-412x915-<nn>.png   nn = 01 for the top of the screen, 02.. one viewport lower each
//   runtime-<theme>.json       raw ATF and semantics results per frame
// States (`states`, see index.mjs): one fresh launch per state, the steps through the Compose
// semantics actions, then state-<name>-<theme>-412x915.png and state-<name>-<theme>.json. A failing
// step marks that state ok:false in `states` and adds a warning; the main shots still count.
// Skipped (ran: false, with the reason): no gradlew, no JDK 17+, no Android SDK, no Compose, no
// launcher activity, Gradle dependencies that cannot be resolved (offline), build or test failure.
// Reduced motion and trace recording off keep an endless animation from filling the test heap.
import { spawn, spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { delimiter, dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
export const INIT_SCRIPT = join(here, 'compose', 'm3-shots.init.gradle.kts');
const TEST_TEMPLATE = join(here, 'compose', 'M3ShotsTest.kt.tmpl');
const THEMES = ['light', 'dark'];
const VIEWPORT = '412x915';
const TAIL_LINES = 40;
const SKIP_DIRS = new Set(['.git', '.gradle', '.kotlin', '.idea', 'node_modules', 'captures']);
// Wall-clock cap of the whole step (main shots and states): a stuck test JVM never holds a session longer.
export const TOTAL_CAP_MS = 12 * 60_000;
const MIN_STATES_MS = 45_000;

const EMPTY = () => ({ shots: [], runtime: { contrast: [], targets: [] } });
const tail = (text, n = TAIL_LINES) => text.replace(/\r\n/g, '\n').trimEnd().split('\n').slice(-n).join('\n');
const pathKey = (env) => Object.keys(env).find((k) => k.toLowerCase() === 'path') ?? 'PATH';
const envGet = (env, name) => env[name] ?? env[Object.keys(env).find((k) => k.toLowerCase() === name.toLowerCase())];

const isAppBuildFile = (text) => /com\.android\.application|plugins\.android\.application|android\.application\b/.test(text);

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
export function launcherNames(manifest) {
  const names = [];
  const re = /<(activity|activity-alias)\b([^>]*?)(\/>|>([\s\S]*?)<\/\1>)/g;
  for (const m of manifest.matchAll(re)) {
    const body = m[4] ?? '';
    if (!/android\.intent\.action\.MAIN/.test(body) || !/android\.intent\.category\.LAUNCHER/.test(body)) continue;
    const attr = (k) => m[2].match(new RegExp(`android:${k}\\s*=\\s*"([^"]+)"`))?.[1];
    const name = m[1] === 'activity-alias' ? attr('targetActivity') : attr('name');
    if (name) names.push(name);
  }
  return names;
}

// Finds the module that applies com.android.application and its launcher activity (fully
// qualified). -> { module, dir, activity, compose } (activity null when none is declared or its package
// is unknown), or null with no app module.
export function findLauncher(projectDir) {
  const candidates = [];
  const visit = (dir, rel, depth) => {
    let entries;
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
    const build = ['build.gradle.kts', 'build.gradle'].map((f) => join(dir, f)).find(existsSync);
    const manifestPath = join(dir, 'src', 'main', 'AndroidManifest.xml');
    if (rel && build && existsSync(manifestPath) && isAppBuildFile(readFileSync(build, 'utf8'))) {
      candidates.push({ dir, rel, build, manifest: readFileSync(manifestPath, 'utf8') });
    }
    if (depth >= 2) return;
    for (const e of entries) {
      if (e.isDirectory() && !e.name.startsWith('.') && !SKIP_DIRS.has(e.name) && e.name !== 'build' && e.name !== 'src' && e.name !== 'gradle') {
        visit(join(dir, e.name), rel ? `${rel}/${e.name}` : e.name, depth + 1);
      }
    }
  };
  visit(projectDir, '', 0);
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => (a.rel === 'app' ? -1 : b.rel === 'app' ? 1 : a.rel.localeCompare(b.rel)));
  const compose = (c) => /compose/i.test(readFileSync(c.build, 'utf8')) || /compose/i.test(readIf(join(projectDir, 'gradle', 'libs.versions.toml')));
  for (const c of candidates) {
    const [name] = launcherNames(c.manifest);
    if (!name) continue;
    const ns = moduleNamespace(c.dir, c.manifest);
    let activity = name;
    if (name.startsWith('.')) activity = ns ? ns + name : null;
    else if (!name.includes('.')) activity = ns ? `${ns}.${name}` : null;
    return { module: c.rel, dir: c.dir, activity, compose: compose(c), hasLauncher: true };
  }
  return { module: candidates[0].rel, dir: candidates[0].dir, activity: null, compose: compose(candidates[0]), hasLauncher: false };
}

function readIf(file) { try { return readFileSync(file, 'utf8'); } catch { return ''; } }

// The Java launcher (JAVA_HOME, else PATH) and its major version: { exe, major } | null.
export function findJava(env = process.env) {
  const exeName = process.platform === 'win32' ? 'java.exe' : 'java';
  const dirs = [];
  const home = envGet(env, 'JAVA_HOME');
  if (home) dirs.push(join(home, 'bin'));
  dirs.push(...String(env[pathKey(env)] ?? '').split(delimiter).filter(Boolean));
  for (const d of dirs) {
    const exe = join(d, exeName);
    if (!existsSync(exe)) continue;
    const r = spawnSync(exe, ['-version'], { env, encoding: 'utf8', timeout: 30_000, windowsHide: true });
    const m = `${r.stderr}${r.stdout}`.match(/version "(\d+)(?:\.(\d+))?/);
    return { exe, major: m ? (m[1] === '1' ? Number(m[2]) : Number(m[1])) : null };
  }
  return null;
}

// The Android SDK folder: ANDROID_HOME, ANDROID_SDK_ROOT, local.properties sdk.dir, the Android Studio
// default folder. -> string | null
export function findAndroidSdk(projectDir, env = process.env) {
  for (const k of ['ANDROID_HOME', 'ANDROID_SDK_ROOT']) {
    const v = envGet(env, k);
    if (v && existsSync(v)) return v;
  }
  const m = readIf(join(projectDir, 'local.properties')).match(/^\s*sdk\.dir\s*=\s*(.+?)\s*$/m);
  if (m) {
    const dir = m[1].replace(/\\:/g, ':').replace(/\\\\/g, '\\');
    if (existsSync(dir)) return dir;
  }
  const guesses = [
    join(envGet(env, 'LOCALAPPDATA') ?? '', 'Android', 'Sdk'),
    join(homedir(), 'Library', 'Android', 'sdk'),
    join(homedir(), 'Android', 'Sdk'),
  ];
  return guesses.find((g) => g && existsSync(join(g, 'platforms'))) ?? null;
}

// Gradle output that says the dependencies (or the Robolectric jars) could not be downloaded.
export function isResolutionFailure(output) {
  return /Could not resolve|Could not GET|Could not HEAD|Could not download|UnknownHostException|No cached version|offline mode|Connection refused|connect timed out|Read timed out|Unable to download/i.test(output);
}

const quoteWin = (a) => (/[\s"&|<>^()]/.test(a) ? `"${a.replace(/"/g, '""')}"` : a);

// Kills every process whose command line names `marker` (the Gradle daemon and the test JVM are not
// children of the wrapper that was started).
function killStray(marker) {
  try {
    if (process.platform === 'win32') {
      const q = marker.replace(/'/g, "''");
      spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command',
        `Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*${q}*' -and $_.ProcessId -ne $PID } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }`],
      { windowsHide: true, timeout: 60_000 });
    } else {
      spawnSync('pkill', ['-9', '-f', marker], { timeout: 30_000 });
    }
  } catch { /* best effort */ }
}

// The phase a Gradle output line says the build is in.
export function phaseOf(line) {
  if (/> Task :\S*compile\S*/i.test(line)) return 'compiling';
  if (/> Task :\S*test\S*UnitTest\s*$/i.test(line)) return 'running the Robolectric test';
  if (/Configure project|> Configure/.test(line)) return 'configuring';
  return null;
}

// Runs the project's wrapper. `timeoutMs` is a hard wall-clock limit: the wrapper tree and every stray
// process that names `marker` (the temp copy) are killed. -> { code, timedOut, output, phase, seconds }
function runGradle(dir, args, { env, timeoutMs, marker }) {
  return new Promise((res) => {
    const win = process.platform === 'win32';
    // Node refuses to spawn .bat files directly; cmd /d /s /c with a verbatim, fully quoted command
    // line keeps paths with spaces intact.
    const child = win
      ? spawn(envGet(process.env, 'ComSpec') || 'cmd.exe', ['/d', '/s', '/c', `"${[join(dir, 'gradlew.bat'), ...args].map(quoteWin).join(' ')}"`], {
        cwd: dir, env, windowsHide: true, windowsVerbatimArguments: true,
      })
      : spawn('sh', [join(dir, 'gradlew'), ...args], { cwd: dir, env });
    const started = Date.now();
    let output = '';
    let phase = 'starting Gradle';
    let carry = '';
    const onData = (d) => {
      output += d;
      const lines = (carry + d).split(/\r?\n/);
      carry = lines.pop();
      for (const l of lines) { const p = phaseOf(l); if (p) phase = p; }
    };
    child.stdout.on('data', onData);
    child.stderr.on('data', onData);
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      if (win) spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { windowsHide: true });
      else child.kill('SIGKILL');
      if (marker) killStray(marker);
    }, Math.max(1000, timeoutMs));
    child.on('error', (e) => { output += `\n${e.message}`; });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (marker) killStray(marker);
      res({ code: timedOut ? null : code, timedOut, output, phase, seconds: Math.round((Date.now() - started) / 1000) });
    });
  });
}

function describe(label, el) {
  if (!el) return `${label}: (no element)`;
  const parts = [el.className || 'View'];
  if (el.contentDescription) parts.push(`desc="${el.contentDescription}"`);
  if (el.text) parts.push(`text="${el.text}"`);
  if (el.resourceName) parts.push(`id=${el.resourceName}`);
  if (Array.isArray(el.bounds)) parts.push(`bounds=[${el.bounds[0]},${el.bounds[1]}][${el.bounds[2]},${el.bounds[3]}]`);
  return `${label}: ${parts.join(' ')}`;
}

const center = (b) => [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2];
const inside = (p, b) => p[0] >= b[0] && p[0] <= b[2] && p[1] >= b[1] && p[1] <= b[3];

// Normalizes the report of one frame. `label` is "light frame 2/3". Disabled nodes (Compose
// SemanticsProperties.Disabled, which ATF sees as isEnabled() == false) are left out.
// - contrast: ATF TextContrastCheck ERROR or WARNING. For Compose text ATF cannot read the text color,
//   so it estimates both from the screenshot and reports a WARNING.
// - targets: clickable semantics nodes whose touch bounds (minimum interactive size included) are under 48x48dp, plus any ATF TouchTargetSizeCheck ERROR that is
//   not the same node (ATF sees the touch area Compose extends to 48dp).
export function normalizeReport(label, report) {
  const contrast = [];
  const targets = [];
  const semantics = (report?.semanticsTargets ?? []).filter((t) => t.enabled !== false);
  for (const t of semantics) {
    const name = t.label ? `"${t.label}"` : '(no label)';
    const b = t.bounds ?? [];
    targets.push({
      where: `${label}: clickable ${name}${t.role ? ` role=${t.role}` : ''} bounds=[${b[0]},${b[1]}][${b[2]},${b[3]}]`,
      detail: `${t.widthDp}x${t.heightDp}dp, below the 48x48dp minimum touch target (touch bounds)`,
    });
  }
  for (const r of report?.results ?? []) {
    if (r.element?.enabled === false) continue;
    const item = { where: describe(label, r.element), detail: r.message ?? r.check };
    if (r.check === 'TextContrastCheck' && (r.type === 'ERROR' || r.type === 'WARNING')) contrast.push(item);
    else if (r.check === 'TouchTargetSizeCheck' && r.type === 'ERROR') {
      const bounds = r.element?.bounds;
      if (bounds && semantics.some((t) => t.bounds && inside(center(t.bounds), bounds))) continue;
      targets.push(item);
    }
  }
  return { contrast, targets };
}

// The same fixed element shows in several frames: keep it once per theme (frame label and bounds, which
// move with the scroll, are left out of the key).
function dedupe(list, seen, theme) {
  const out = [];
  for (const it of list) {
    const key = `${theme}|${it.where.split(': ').slice(1).join(': ').replace(/bounds=\[[^\]]*\]\[[^\]]*\]/g, '')}|${it.detail}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(it);
  }
  return out;
}

// screenshotCompose({ projectDir, outDir, env?, states?, timeoutMs?, tools? }) -> result (see index.mjs).
// `tools` ({ java: { exe, major }, sdk }) replaces the JDK and SDK lookup (tests with a fake wrapper).
export async function screenshotCompose({ projectDir, outDir, env = process.env, timeoutMs = TOTAL_CAP_MS, states, tools }) {
  const skip = (reason, extra = {}) => ({ ran: false, skippedReason: reason, ...EMPTY(), ...extra });
  const wrapperName = process.platform === 'win32' ? 'gradlew.bat' : 'gradlew';
  if (!existsSync(join(projectDir, wrapperName))) return skip(`no Gradle wrapper (${wrapperName}) in the project: screenshots skipped (this step uses the project's own wrapper and never installs Gradle)`);
  const app = findLauncher(projectDir);
  if (!app) return skip('no module applies com.android.application: screenshots skipped (is this an Android app project?)');
  if (!app.compose) return skip(`module ${app.module} does not use Jetpack Compose: screenshots skipped`);
  if (!app.hasLauncher || !app.activity) {
    return skip(`no launcher activity found in ${app.module}/src/main/AndroidManifest.xml (an activity with MAIN and LAUNCHER${app.hasLauncher ? ', whose package is unknown' : ''}): screenshots skipped; the step renders the activity that calls setContent`);
  }
  const java = tools?.java ?? findJava(env);
  if (!java) return skip('no JDK found (JAVA_HOME or java on PATH): screenshots skipped (this step never installs one)');
  if (java.major !== null && java.major < 17) return skip(`JDK ${java.major} found, Android Gradle builds and this step need JDK 17 or newer: screenshots skipped`);
  const sdk = tools?.sdk ?? findAndroidSdk(projectDir, env);
  if (!sdk) return skip('Android SDK not found (ANDROID_HOME, ANDROID_SDK_ROOT, local.properties sdk.dir): screenshots skipped (this step never installs it)');

  const tag = { gradle: { module: app.module, launcher: app.activity, java: java.major, sdk } };
  const warnings = [];
  const work = mkdtempSync(join(tmpdir(), 'm3-compose-shots-'));
  const copy = join(work, 'project');
  try {
    cpSync(projectDir, copy, {
      recursive: true,
      filter: (src) => {
        const rel = relative(projectDir, src);
        if (rel === '') return true;
        const name = rel.split(sep).pop();
        if (SKIP_DIRS.has(name)) return false;
        // build output folders of the project and of its modules
        if (name === 'build' && ['build.gradle.kts', 'build.gradle'].some((f) => existsSync(join(src, '..', f)))) return false;
        return true;
      },
    });
    const testSrc = join(work, 'test-src', 'm3shots');
    mkdirSync(testSrc, { recursive: true });
    writeFileSync(join(testSrc, 'M3ShotsTest.kt'), readFileSync(TEST_TEMPLATE, 'utf8'));
    const statesFile = join(work, 'states.json');
    if (states?.length) writeFileSync(statesFile, JSON.stringify({ states }));

    mkdirSync(outDir, { recursive: true });
    for (const f of readdirSync(outDir)) {
      if (/^(light|dark)-412x915-\d+\.png$/.test(f) || /^runtime-(light|dark)\.json$/.test(f) || f.startsWith('state-')) rmSync(join(outDir, f), { force: true });
    }

    const childEnv = { ...env, ANDROID_HOME: sdk, ANDROID_SDK_ROOT: envGet(env, 'ANDROID_SDK_ROOT') ?? sdk };
    const base = [
      '--no-daemon', '--console=plain',
      'testDebugUnitTest',
      '--init-script', INIT_SCRIPT,
      `-Pm3.outDir=${outDir}`,
      `-Pm3.testSrcDir=${join(work, 'test-src')}`,
      `-Pm3.launcher=${app.activity}`,
      '-Pandroid.builder.sdkDownload=false',
      '-Pkotlin.compiler.execution.strategy=in-process',
    ];
    const started = Date.now();
    const left = () => timeoutMs - (Date.now() - started);
    const written = () => readdirSync(outDir).filter((f) => f.endsWith('.png')).length;
    const capMessage = (g, what) => `the screenshot step is capped at ${Math.round(timeoutMs / 1000)} s in total; ${what} was stopped after ${g.seconds} s while ${g.phase} (${written()} PNGs written so far). The Gradle build and the test JVM were killed. A screen that animates endlessly or loops in layout is the usual cause: simplify it or skip the screenshot step`;

    // Phase 1: the main shots. The states run in a second Gradle call so that a stuck state never costs them.
    const gradle = await runGradle(copy, [...base, '--tests', '*M3ShotsTest.light', '--tests', '*M3ShotsTest.dark'], { env: childEnv, timeoutMs: left(), marker: work });
    tag.gradle.seconds = { shots: gradle.seconds };
    const missing = THEMES.filter((t) => !existsSync(join(outDir, `runtime-${t}.json`)));
    if (missing.length) {
      if (gradle.timedOut) return skip(`${capMessage(gradle, 'the shots run')}\n${tail(gradle.output, 12)}`, { ...tag, buildOk: false });
      if (isResolutionFailure(gradle.output)) {
        return skip(`Gradle could not resolve or download dependencies (offline? The first run needs the network for Robolectric, Roborazzi and the project's own libraries): screenshots skipped\n${tail(gradle.output)}`, { ...tag, buildOk: false });
      }
      const why = gradle.code === 0 ? 'Gradle passed but wrote no capture' : 'the app did not build or run under Robolectric';
      return skip(`${why}: screenshots skipped\n${tail(gradle.output)}`, { ...tag, buildOk: gradle.code === 0 ? false : /M3ShotsTest > \w+.* FAILED/.test(gradle.output) });
    }
    // Both captures were written: a run that then hung or failed while closing the app still counts.
    if (gradle.timedOut) warnings.push(capMessage(gradle, 'the shots run (after the captures were written)'));
    else if (gradle.code !== 0) warnings.push(`the shots run ended with an error after the captures were written: ${tail(gradle.output, 6).replace(/\s*\n\s*/g, ' | ')}`);

    // Phase 2: the states (the compiled test is reused).
    const stateFiles = () => readdirSync(outDir).filter((f) => /^state-.*-(light|dark)\.json$/.test(f)).length;
    const allStatesWritten = () => (states ?? []).every((st) => THEMES.every((t) => existsSync(join(outDir, `state-${st.name}-${t}.json`))));
    let statesNote = null;
    if (states?.length) {
      // A state that leaves an animation frame loop behind stops the test JVM (the next launch would never
      // return); the next Gradle call starts a fresh JVM and carries on with the states without a result.
      const MAX_RUNS = 8;
      let runs = 0;
      while (!allStatesWritten()) {
        if (left() < Math.min(MIN_STATES_MS, timeoutMs / 4)) {
          statesNote = `no time left for the states within the ${Math.round(timeoutMs / 1000)} s cap`;
          break;
        }
        const before = stateFiles();
        const g2 = await runGradle(copy, [...base, `-Pm3.statesFile=${statesFile}`, '--tests', '*M3ShotsTest.stateLight', '--tests', '*M3ShotsTest.stateDark'], { env: childEnv, timeoutMs: left(), marker: work });
        runs += 1;
        tag.gradle.seconds.states = (tag.gradle.seconds.states ?? 0) + g2.seconds;
        if (allStatesWritten()) break;
        if (g2.timedOut) { statesNote = capMessage(g2, 'the states run'); break; }
        if (stateFiles() <= before && g2.code !== 0) { statesNote = `the states run ended with an error: ${tail(g2.output, 8).replace(/\s*\n\s*/g, ' | ')}`; break; }
        if (runs >= MAX_RUNS) { statesNote = `the states needed more than ${MAX_RUNS} test runs`; break; }
      }
      if (runs > 1) tag.gradle.statesRuns = runs;
      if (statesNote) warnings.push(`states: ${statesNote}`);
    }

    const shots = [];
    const contrast = [];
    const targets = [];
    const seen = new Set();
    let truncated = false;
    for (const theme of THEMES) {
      const raw = JSON.parse(readFileSync(join(outDir, `runtime-${theme}.json`), 'utf8'));
      if (raw.truncated) truncated = true;
      for (const fr of raw.frames) {
        const png = join(outDir, fr.file);
        if (!existsSync(png)) return skip(`Gradle passed but wrote no ${fr.file}: screenshots skipped`, { ...tag, buildOk: false });
        shots.push(png);
        const n = normalizeReport(`${theme} frame ${fr.frame}/${raw.frames.length}`, fr);
        contrast.push(...dedupe(n.contrast, seen, theme));
        targets.push(...dedupe(n.targets, seen, theme));
        if (fr.atfError) warnings.push(`${theme} frame ${fr.frame}: the accessibility check did not run (${fr.atfError}); contrast is not measured there`);
        if (fr.semanticsError) warnings.push(`${theme} frame ${fr.frame}: touch targets from semantics not measured (${fr.semanticsError})`);
      }
    }

    let stateResults;
    if (states?.length) {
      stateResults = states.map((s) => {
        const r = { name: s.name, ok: true, shots: [] };
        for (const theme of THEMES) {
          let rec = null;
          try { rec = JSON.parse(readFileSync(join(outDir, `state-${s.name}-${theme}.json`), 'utf8')); } catch { /* none */ }
          if (!rec) { if (r.ok) { r.ok = false; r.error = `${theme}: no result (${statesNote ?? 'the test did not reach this state'})`; } continue; }
          if (rec.ok && rec.file && existsSync(join(outDir, rec.file))) r.shots.push(join(outDir, rec.file));
          else if (r.ok) { r.ok = false; r.error = `${theme}: ${rec.error ?? 'no shot written'}`; }
        }
        if (!r.ok) warnings.push(`state "${r.name}" failed: ${r.error}`);
        return r;
      });
    }
    if (truncated) warnings.push('the first vertical scrollable is longer than 4 viewports: the frames stop before its end; rows below the last frame are not visible: move them up or reach them with a state');
    return {
      ran: true,
      buildOk: true,
      ...tag,
      shots,
      runtime: { contrast, targets },
      ...(stateResults ? { states: stateResults } : {}),
      ...(warnings.length ? { warnings } : {}),
    };
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}
