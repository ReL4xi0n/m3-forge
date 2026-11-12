#!/usr/bin/env node
// Called by .githooks/pre-push with the remote name; reads "<local ref> <local sha> <remote ref> <remote sha>"
// lines on stdin. Blocks backup/* branches, forbidden terms in ref names, and any pushed commit that fails
// the guard (content it introduces, its message, or a non-noreply author/committer email).
import { readFileSync } from 'node:fs';
import { openRepo, loadContext, checkCommits, isZeroSha, report } from './repo.mjs';
import { checkRefName } from './lib.mjs';

const remote = process.argv[2] || 'origin';
const repo = openRepo();
const ctx = await loadContext(repo);
if (ctx.fatal) {
  console.error(`guard: ${ctx.fatal}; push blocked`);
  process.exit(2);
}

const violations = [];
let checked = 0;
let commits = 0;
for (const line of readFileSync(0, 'utf8').split(/\r?\n/).filter(Boolean)) {
  const [localRef, localSha, remoteRef, remoteSha] = line.split(' ');
  if (isZeroSha(localSha)) continue; // deleting a remote ref
  if ([localRef, remoteRef].some(r => /^refs\/heads\/backup\//.test(r))) {
    violations.push({ rule: 'backup-branch', path: 'ref', key: '-', detail: 'backup/* branches are local-only and are never pushed' });
    continue;
  }
  violations.push(...checkRefName(localRef, ctx.terms), ...checkRefName(remoteRef, ctx.terms));
  const revArgs = isZeroSha(remoteSha) ? [localSha, '--not', `--remotes=${remote}`] : [`${remoteSha}..${localSha}`];
  const r = checkCommits(repo, revArgs, ctx);
  violations.push(...r.violations);
  checked += r.checked;
  commits += r.commits;
}
const code = report({ violations, notices: ctx.notices, checked, commits });
if (code) console.error('m3-forge guard: push blocked');
process.exit(code);
