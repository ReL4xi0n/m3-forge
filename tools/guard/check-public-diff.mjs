#!/usr/bin/env node
// Public-diff guard CLI. Usage:
//   node tools/guard/check-public-diff.mjs (--staged | --range <A>..<B> | --all-tracked | --commits <rev> | --paths <file...>) [--json]
//     --staged        files in the index (pre-commit)
//     --range A..B    files that differ between A and B
//     --all-tracked   every tracked file
//     --commits <rev> every commit in `git rev-list <rev>` (A..B, or one sha for its whole history):
//                     the content each commit introduces, its message, and noreply author/committer emails
// Env: GUARD_FORBIDDEN_TERMS (extra terms), GUARD_REQUIRE_TERMS / GUARD_REQUIRE_CORPUS (fail closed).
// Exit codes: 0 clean, 1 violations, 2 required private data missing, 64 usage.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { openRepo, loadContext, stagedEntries, rangeEntries, trackedEntries, checkEntries, checkCommits, report } from './repo.mjs';
import { checkFiles } from './lib.mjs';

const args = process.argv.slice(2);
const json = args.includes('--json');
const valueOf = flag => {
  const i = args.indexOf(flag);
  return i === -1 ? null : args[i + 1] || '';
};

function usage(msg) {
  console.error(`guard: ${msg}\nusage: check-public-diff.mjs (--staged | --range <A>..<B> | --all-tracked | --commits <rev>) [--json]`);
  process.exit(64);
}

let select;
if (args.includes('--paths')) {
  // Working-tree files, not staged: lets writers check their own files before anything is committed.
  const paths = args.slice(args.indexOf('--paths') + 1).filter(a => !a.startsWith('--'));
  if (!paths.length) usage('--paths needs at least one file');
  select = (repo, ctx) => {
    const files = paths.map(p => ({ path: p.replace(/\\/g, '/'), content: readFileSync(join(repo.root, p)) }));
    const violations = checkFiles({ files, forbiddenTerms: ctx.terms, corpus: ctx.corpus, allowlist: ctx.allowlist, privateHashes: ctx.privateHashes });
    return { violations, checked: files.length };
  };
} else if (args.includes('--staged')) select = (repo, ctx) => checkEntries(repo, stagedEntries(repo), ctx);
else if (valueOf('--range') !== null) {
  const range = valueOf('--range');
  const [a, b] = range.split('..');
  if (!a || !b) usage(`invalid --range "${range}"`);
  select = (repo, ctx) => checkEntries(repo, rangeEntries(repo, a, b), ctx);
} else if (args.includes('--all-tracked')) select = (repo, ctx) => checkEntries(repo, trackedEntries(repo), ctx);
else if (valueOf('--commits') !== null) {
  const rev = valueOf('--commits');
  if (!rev || rev.startsWith('-')) usage(`invalid --commits "${rev}"`);
  select = (repo, ctx) => checkCommits(repo, [rev], ctx);
} else usage('missing mode');

const repo = openRepo();
const ctx = await loadContext(repo);
if (ctx.fatal) {
  console.error(`guard: ${ctx.fatal}`);
  process.exit(2);
}
const result = select(repo, ctx);
process.exit(report({ ...result, notices: ctx.notices, json }));
