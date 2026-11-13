// Node equivalent of tools/toolchain/env.ps1: toolchain variables for a child process only.
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

export function toolchainRoot(env = process.env) {
  const cfg = JSON.parse(readFileSync(join(repo, 'tools', 'toolchain', 'toolchain.json'), 'utf8'));
  return cfg.root.replace(/%([^%]+)%/g, (_, k) => env[k] ?? env[Object.keys(env).find(x => x.toLowerCase() === k.toLowerCase())] ?? '');
}

const pathKey = env => Object.keys(env).find(k => k.toLowerCase() === 'path') ?? 'PATH';

// Returns a new env object: toolchain variables set and the toolchain bins prepended to PATH.
export function withToolchain(env) {
  const root = toolchainRoot(env);
  const out = { ...env };
  const java = join(root, 'jdk-21');
  const android = join(root, 'android-sdk');
  Object.assign(out, {
    M3_TOOLCHAIN: root,
    JAVA_HOME: java,
    ANDROID_HOME: android,
    ANDROID_SDK_ROOT: android,
    ANDROID_USER_HOME: join(root, 'android-user'),
    GRADLE_USER_HOME: join(root, 'gradle-home'),
    PUB_CACHE: join(root, 'pub-cache'),
    PLAYWRIGHT_BROWSERS_PATH: join(root, 'ms-playwright'),
    npm_config_cache: join(root, 'npm-cache'),
    FLUTTER_SUPPRESS_ANALYTICS: 'true',
  });
  const prepend = [join(repo, 'tools', 'toolchain', 'shims'), join(java, 'bin'), join(root, 'flutter', 'bin'), join(android, 'cmdline-tools', 'latest', 'bin')];
  const key = pathKey(out);
  const rest = String(out[key] ?? '').split(';').filter(p => p && !prepend.includes(p));
  out[key] = [...prepend, ...rest].join(';');
  return out;
}
