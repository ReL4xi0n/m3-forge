// Copies an eval fixture into a work folder and installs its dependencies through the toolchain
// environment, so the session starts on a project that already builds (Phase 2 plan, Task 5).
import { spawn } from 'node:child_process';
import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { withToolchain } from './toolchain-env.mjs';

const repo = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

export const FIXTURES_DIR = join(repo, 'evals', 'fixtures');
export const FIXTURES = ['web-empty', 'web-react', 'web-vue', 'flutter-material_ui', 'flutter-legacy', 'compose-1.5'];

// Never copied: placeholders, installed dependencies, build outputs and machine-local files.
const SKIP = new Set(['.gitkeep', 'node_modules', 'build', 'dist', '.dart_tool', '.gradle', '.kotlin', 'local.properties']);

export function fixtureKind(name) {
  if (name.startsWith('web-')) return 'web';
  if (name.startsWith('flutter-')) return 'flutter';
  if (name.startsWith('compose-')) return 'compose';
  throw new Error(`unknown fixture: ${name}`);
}

// Every Gradle call: never download SDK packages, and keep the Kotlin daemon out of %LOCALAPPDATA%.
export const GRADLE_FLAGS = ['--no-daemon', '-Pandroid.builder.sdkDownload=false', '-Pkotlin.compiler.execution.strategy=in-process'];

const INSTALL = {
  web: ['npm', ['ci', '--no-audit', '--no-fund']],
  flutter: ['flutter', ['pub', 'get']],
  // Resolves every configuration of the app module (compile, runtime, Kotlin and Compose compiler).
  compose: ['./gradlew.bat', [...GRADLE_FLAGS, ':app:dependencies']],
};

// Runs a toolchain command in cwd. On Windows .cmd/.bat files need a shell; args here are fixed
// strings without spaces or shell metacharacters. A './' command is resolved against cwd, because
// the shell may not search the current folder (NoDefaultCurrentDirectoryInExePath).
export function runTool(cmd, args, cwd) {
  const exe = cmd.startsWith('./') ? `"${join(cwd, cmd.slice(2))}"` : cmd;
  return new Promise(resolvePromise => {
    let out = '';
    const child = spawn(exe, args, { cwd, env: withToolchain(process.env), shell: process.platform === 'win32', windowsHide: true });
    child.stdout.on('data', d => { out += d; });
    child.stderr.on('data', d => { out += d; });
    child.on('error', e => resolvePromise({ code: -1, out: `${out}\n${e.message}` }));
    child.on('close', code => resolvePromise({ code, out }));
  });
}

export async function prepareFixture(name, dest) {
  const start = Date.now();
  if (!FIXTURES.includes(name)) throw new Error(`unknown fixture: ${name}`);
  const src = join(FIXTURES_DIR, name);
  if (!existsSync(src)) return { ok: false, ms: Date.now() - start, log: `fixture folder missing: ${src}` };
  mkdirSync(dest, { recursive: true });
  cpSync(src, dest, { recursive: true, filter: p => p === src || !SKIP.has(basename(p)) });
  if (name === 'web-empty') return { ok: true, ms: Date.now() - start, log: 'copied (empty fixture, nothing to install)\n' };
  const [cmd, args] = INSTALL[fixtureKind(name)];
  const r = await runTool(cmd, args, dest);
  const log = `> ${cmd} ${args.join(' ')}\n${r.out}\nexit ${r.code}\n`;
  return { ok: r.code === 0, ms: Date.now() - start, log };
}
