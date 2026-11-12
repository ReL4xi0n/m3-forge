#!/usr/bin/env node
// Public-diff guard CLI. Usage:
//   node tools/guard/check-public-diff.mjs (--staged | --range <A>..<B> | --all-tracked) [--json]
// Exit codes: 0 clean, 1 violations, 2 forbidden-term list required but missing.
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { checkFiles, loadAllowlist, loadCorpus } from './lib.mjs';

const args = process.argv.slice(2);
const json = args.includes('--json');
const root = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const git = (gitArgs, encoding) =>
  execFileSync('git', gitArgs, { cwd: root, maxBuffer: 1 << 30, encoding, stdio: ['ignore', 'pipe', 'pipe'] });
const splitZ = s => s.split('\0').filter(Boolean);

function selectFiles() {
  if (args.includes('--staged')) {
    return { paths: splitZ(git(['diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z'], 'utf8')), rev: '' };
  }
  const i = args.indexOf('--range');
  if (i !== -1) {
    const range = args[i + 1] || '';
    const [a, b] = range.split('..');
    if (!a || !b) usage(`invalid --range "${range}"`);
    return { paths: splitZ(git(['diff', '--name-only', '--diff-filter=ACMR', '-z', a, b], 'utf8')), rev: b };
  }
  if (args.includes('--all-tracked')) return { paths: splitZ(git(['ls-files', '-z'], 'utf8')), rev: '' };
  usage('missing mode');
}

function usage(msg) {
  console.error(`guard: ${msg}\nusage: check-public-diff.mjs (--staged | --range <A>..<B> | --all-tracked) [--json]`);
  process.exit(64);
}

async function readTerms(notices) {
  const terms = [];
  try {
    const text = await readFile(join(root, 'private', 'guard-terms.txt'), 'utf8');
    for (const line of text.split(/\r?\n/)) {
      const t = line.trim();
      if (t && !t.startsWith('#')) terms.push(t);
    }
  } catch {
    // no local list (fresh clone or CI)
  }
  for (const t of (process.env.GUARD_FORBIDDEN_TERMS || '').split(/[\n,]/)) if (t.trim()) terms.push(t.trim());
  if (!terms.length) {
    if (/^(1|true)$/i.test(process.env.GUARD_REQUIRE_TERMS || '')) {
      console.error('guard: forbidden-term list required (GUARD_REQUIRE_TERMS) but none found');
      process.exit(2);
    }
    notices.push('NOTICE: no forbidden-term list found; term check skipped');
  }
  return terms;
}

const notices = [];
const { paths, rev } = selectFiles();
const forbiddenTerms = await readTerms(notices);
const { corpus, fromCache } = await loadCorpus(
  join(root, 'private', 'raw'),
  join(root, 'private', '.guard-cache', 'corpus.json'),
);
if (!corpus) notices.push('NOTICE: private/raw not found; raw-overlap check skipped');
else if (fromCache) notices.push('corpus: cached');
const allowlist = await loadAllowlist(join(root, 'tools', 'guard', 'allowlist.txt'));

const files = [];
for (const path of paths) {
  try {
    files.push({ path, content: git(['show', `${rev}:${path}`]) });
  } catch {
    // Unreadable entries still get path rules; gitlinks (mode 160000) are flagged explicitly.
    const entry = rev ? git(['ls-tree', rev, '--', path], 'utf8') : git(['ls-files', '-s', '--', path], 'utf8');
    const gitlink = entry.startsWith('160000');
    files.push({ path, content: null, gitlink });
    if (!gitlink) notices.push(`NOTICE: could not read ${path} (content checks skipped)`);
  }
}

const violations = checkFiles({ files, forbiddenTerms, corpus, allowlist });
if (json) {
  console.log(JSON.stringify({ violations, notices, checked: files.length }, null, 2));
} else {
  for (const n of notices) console.log(n);
  for (const v of violations) {
    const tail = v.key === '-' ? '(not allowlistable)' : `(allowlist key: ${v.key})`;
    console.log(`${v.rule}  ${v.path}  ${v.detail}  ${tail}`);
  }
  console.log(violations.length
    ? `guard: ${violations.length} violation(s) in ${files.length} file(s). Fix them, or add a reviewed entry to tools/guard/allowlist.txt. Never use --no-verify.`
    : `guard: ok (${files.length} file(s) checked)`);
}
process.exit(violations.length ? 1 : 0);
