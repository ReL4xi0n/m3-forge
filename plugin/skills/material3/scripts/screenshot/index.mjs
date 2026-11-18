#!/usr/bin/env node
// Screenshot step of the material3 skill: renders the built UI in light and dark, and measures text
// contrast and touch targets in the rendered page.
//
//   screenshot({ projectDir, platform, out?, url?, states?, roots?, browsers?, env? }) -> {
//     ran: boolean, skippedReason?: string, engine?: 'playwright' | 'cdp', shots: string[] (PNG paths),
//     runtime: { contrast: [{ where, detail }], targets: [{ where, detail }] },
//     states?: [{ name, ok, shots: string[], error? }],
//     out, capture (capture.json path), pageErrors?, warnings?, measured?, playwright?, browser? }
//   Compose: back end in compose.mjs (Robolectric + Roborazzi + ATF through an init script, in a temporary copy
//   of the project; needs no Roborazzi in the project; frames named like Flutter's; `env` replaces the
//   environment that finds JAVA_HOME, ANDROID_HOME and the project's Gradle wrapper, tests).
//   Flutter: back end in flutter.mjs (frames named <theme>-412x915-<nn>.png, 01 = top of the home screen;
//   `env` replaces the environment whose PATH finds the flutter launcher, tests).
//   Interaction states (screens reached by an action: dialog, empty search result, open menu):
//   `states` is a path to a JSON file, or its content ({ states: [...] } or the array). Format:
//     { "states": [ { "name": "empty-search", "steps": [ ... ] } ] }       name: letters, digits, - _
//     web steps:     {"click":sel} {"fill":sel,"text":"cactus"} {"press":"Enter"} {"waitMs":300}
//                    sel is a CSS selector, or `text=Label` (exact visible text)
//     flutter steps: {"tap":F} {"enterText":{"into":I,"text":"cactus"}} {"scrollTo":F}
//                    F: {"text":..} | {"key":..} | {"tooltip":..} | {"semanticsLabel":..}
//                    I: {"type":"TextField","index":0} | {"key":..} | {"hint":..}
//     compose steps: {"click":C} {"enterText":{"into":I,"text":"cactus"}} {"scrollTo":C} {"waitMs":300}
//                    C: {"text":..} | {"tag":..} | {"desc":..}  (+ optional "index")
//                    I: {"text":..} | {"tag":..} | {"hint":..}  (+ optional "index"); text is the label shown
//   After the main shots, each state starts the app fresh, runs its steps and shoots as
//   state-<name>-<theme>-<viewport>.png (web: 412x915 and 1440x900, flutter and compose: 412x915; light and dark).
//   A failing step (not found, exception) gives that state ok:false with `error` and an entry in
//   `warnings`; the other shots still run. An invalid file is a UsageError (exit 2). `shots` stays the main shots; each state lists its own.
//   `runtime` is what verify reads from capture.json. `roots` replaces the global node_modules
//   folders searched for Playwright, `browsers` the browser executables tried without it (tests).
//   engine 'playwright': a Playwright that resolves; 'cdp': an installed Chrome, Edge or Chromium.
//
// CLI: node index.mjs <projectDir> --platform web|flutter|compose [--out <dir>] [--url <address>] [--states <file.json>]
//   Writes the PNGs and capture.json to a new folder under the OS temp directory, or to --out, which
//   must not be inside the project. Prints JSON. Then: verify <projectDir> <platform> <capture.json>.
//   Exit 0: ran. Exit 5: skipped (the reason is in `skippedReason`). Exit 2: bad usage.
import { mkdirSync, mkdtempSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { screenshotCompose } from './compose.mjs';
import { screenshotFlutter } from './flutter.mjs';
import { screenshotWeb } from './web.mjs';

export const PLATFORMS = ['web', 'flutter', 'compose'];
// Platform back ends: ({ projectDir, outDir, url, roots, browsers }) -> result without out/capture.
export const BACKENDS = { web: screenshotWeb, flutter: screenshotFlutter, compose: screenshotCompose };

export class UsageError extends Error {}

const isDir = (p) => { try { return statSync(p).isDirectory(); } catch { return false; } };
const within = (child, parent) => {
  const r = relative(parent, child);
  return r === '' || (!r.startsWith('..') && !isAbsolute(r));
};

const NAME = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/;
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const nonEmpty = (v) => typeof v === 'string' && v.trim() !== '';
const WEB_STEPS = {
  click: (st) => nonEmpty(st.click),
  fill: (st) => nonEmpty(st.fill) && typeof st.text === 'string',
  press: (st) => nonEmpty(st.press),
  waitMs: (st) => Number.isFinite(st.waitMs) && st.waitMs >= 0 && st.waitMs <= 30_000,
};
const FINDER = ['text', 'key', 'tooltip', 'semanticsLabel'];
const finderOk = (f, keys) => isObj(f) && keys.filter((k) => k in f).length === 1 && keys.every((k) => !(k in f) || nonEmpty(f[k]))
  && (!('index' in f) || (Number.isInteger(f.index) && f.index >= 0));
const FLUTTER_STEPS = {
  tap: (st) => finderOk(st.tap, FINDER),
  scrollTo: (st) => finderOk(st.scrollTo, FINDER),
  enterText: (st) => isObj(st.enterText) && typeof st.enterText.text === 'string'
    && finderOk(st.enterText.into, ['type', 'key', 'hint']),
};
const COMPOSE_FINDER = ['text', 'tag', 'desc'];
const COMPOSE_STEPS = {
  click: (st) => finderOk(st.click, COMPOSE_FINDER),
  scrollTo: (st) => finderOk(st.scrollTo, COMPOSE_FINDER),
  enterText: (st) => isObj(st.enterText) && typeof st.enterText.text === 'string'
    && finderOk(st.enterText.into, ['text', 'tag', 'hint']),
  waitMs: WEB_STEPS.waitMs,
};

// The states of a --states file (path), or of its parsed content -> [{ name, steps }]. Throws UsageError.
export function loadStates(input, platform) {
  let data = input;
  if (typeof input === 'string') {
    try { data = JSON.parse(readFileSync(resolve(input), 'utf8')); } catch (e) { throw new UsageError(`states file ${input}: ${e.code === 'ENOENT' ? 'not found' : e.message}`); }
  }
  const list = Array.isArray(data) ? data : data?.states;
  if (!Array.isArray(list) || list.length === 0) throw new UsageError('states: expected { "states": [ { "name", "steps" } ] } with at least one state');
  const allowed = platform === 'web' ? WEB_STEPS : platform === 'flutter' ? FLUTTER_STEPS : COMPOSE_STEPS;
  const names = new Set();
  return list.map((st, i) => {
    const at = `states[${i}]`;
    if (!isObj(st) || !NAME.test(st.name ?? '')) throw new UsageError(`${at}: "name" must be letters, digits, - or _ (it names the PNG files)`);
    if (names.has(st.name)) throw new UsageError(`${at}: duplicate state name "${st.name}"`);
    names.add(st.name);
    if (!Array.isArray(st.steps) || st.steps.length === 0) throw new UsageError(`state "${st.name}": "steps" must be a non-empty array`);
    st.steps.forEach((step, j) => {
      if (!isObj(step)) throw new UsageError(`state "${st.name}" step ${j + 1}: expected an object`);
      const kinds = Object.keys(allowed).filter((k) => k in step);
      const extra = Object.keys(step).filter((k) => !(k in allowed) && k !== 'text');
      if (kinds.length !== 1 || extra.length || !allowed[kinds[0]](step)) {
        throw new UsageError(`state "${st.name}" step ${j + 1}: not a valid ${platform} step (${Object.keys(allowed).join(', ')}): ${JSON.stringify(step)}`);
      }
    });
    return { name: st.name, steps: st.steps };
  });
}

export async function screenshot({ projectDir, platform, out, url, states, roots, browsers, env, tools } = {}) {
  if (!PLATFORMS.includes(platform)) throw new UsageError(`unknown platform "${platform}" (expected ${PLATFORMS.join(', ')})`);
  const dir = resolve(String(projectDir ?? ''));
  if (!isDir(dir)) throw new UsageError(`project folder not found: ${projectDir}`);
  const stateList = states === undefined || states === null ? undefined : loadStates(states, platform);
  let outDir;
  if (out) {
    outDir = resolve(out);
    if (within(outDir, dir)) throw new UsageError(`--out must be outside the project (${outDir})`);
    mkdirSync(outDir, { recursive: true });
  } else {
    outDir = mkdtempSync(join(tmpdir(), 'm3-screenshot-'));
  }

  const backend = BACKENDS[platform];
  const result = backend
    ? await backend({ projectDir: dir, outDir, url, roots, browsers, env, states: stateList, tools })
    : { ran: false, skippedReason: `no screenshot back end for ${platform} in this version: screenshots skipped`, shots: [], runtime: { contrast: [], targets: [] } };

  const capture = join(outDir, 'capture.json');
  const record = {
    platform, ...result, shots: result.shots.map((s) => relative(outDir, s)),
    ...(result.states ? { states: result.states.map((st) => ({ ...st, shots: st.shots.map((s) => relative(outDir, s)) })) } : {}),
  };
  writeFileSync(capture, `${JSON.stringify(record, null, 2)}\n`);
  return { ...result, out: outDir, capture };
}

function parseArgs(argv) {
  const [dir, ...rest] = argv;
  if (!dir || dir.startsWith('--')) return null;
  const o = { dir };
  for (let i = 0; i < rest.length; i += 2) {
    if (!rest[i].startsWith('--') || rest[i + 1] === undefined) return null;
    o[rest[i].slice(2)] = rest[i + 1];
  }
  return o;
}

async function main(argv) {
  const o = parseArgs(argv);
  if (!o || !PLATFORMS.includes(o.platform)) {
    process.stderr.write('usage: screenshot <projectDir> --platform web|flutter|compose [--out dir] [--url address] [--states file.json]\n');
    return 2;
  }
  let r;
  try {
    r = await screenshot({ projectDir: o.dir, platform: o.platform, out: o.out, url: o.url, states: o.states });
  } catch (e) {
    if (e instanceof UsageError) { process.stderr.write(`${e.message}\n`); return 2; }
    throw e;
  }
  const summary = {
    ran: r.ran,
    ...(r.engine ? { engine: r.engine } : {}),
    ...(r.skippedReason ? { skippedReason: r.skippedReason } : {}),
    shots: r.shots,
    ...(r.states ? { states: r.states } : {}),
    contrast: r.runtime.contrast.map(({ where, detail }) => ({ where, detail })),
    targets: r.runtime.targets.map(({ where, detail }) => ({ where, detail })),
    ...(r.warnings?.length ? { warnings: r.warnings } : {}),
    ...(r.pageErrors && Object.keys(r.pageErrors).length ? { pageErrors: r.pageErrors } : {}),
    capture: r.capture,
  };
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  return r.ran ? 0 : 5;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = await main(process.argv.slice(2));
}
