#!/usr/bin/env node
// Secret scan for the staged files of the git repository in the current folder. Used as the private
// repo's pre-commit hook, so no transcript or output carrying a token or key is ever committed there.
//   scan-secrets.mjs --staged
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { scanSecrets } from './secrets.mjs';
import { decodeText } from './lib.mjs';

const home = process.env.USERPROFILE ?? process.env.HOME ?? '';
const tokenFile = join(home, '.m3-toolchain', 'secrets', 'claude-oauth-token');
const literals = existsSync(tokenFile) ? [readFileSync(tokenFile, 'utf8').trim()] : [];

if (!process.argv.includes('--staged')) {
  console.error('usage: scan-secrets.mjs --staged');
  process.exit(2);
}
const names = execFileSync('git', ['diff', '--cached', '--name-only', '-z', '--diff-filter=ACMR'], { encoding: 'utf8' })
  .split('\0').filter(Boolean);
let found = 0;
for (const name of names) {
  const buf = execFileSync('git', ['show', `:${name}`], { maxBuffer: 1 << 30 });
  const text = decodeText(buf);
  if (text == null) continue;
  for (const h of scanSecrets(text, { literals })) {
    console.error(`secret: ${name}: ${h.rule} at line ${h.line}`);
    found++;
  }
}
if (found) {
  console.error(`scan-secrets: ${found} secret(s) staged. Redact them; never bypass this hook.`);
  process.exit(1);
}
console.log(`scan-secrets: ok (${names.length} file(s) checked)`);
