// Git plumbing shared by the guard CLI (check-public-diff.mjs) and the pre-push hook (pre-push.mjs).
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { checkFiles, checkCommitMeta, loadAllowlist, loadCorpus, loadPrivateHashes } from './lib.mjs';

export const isZeroSha = sha => /^0+$/.test(sha);
const truthy = v => /^(1|true)$/i.test(String(v || ''));

export function openRepo(cwd = process.cwd()) {
  const run = (dir, args, encoding) =>
    execFileSync('git', args, { cwd: dir, maxBuffer: 1 << 30, encoding, stdio: ['ignore', 'pipe', 'pipe'] });
  const root = run(cwd, ['rev-parse', '--show-toplevel'], 'utf8').trim();
  const git = (args, encoding) => run(root, args, encoding);
  // private/ lives in the main checkout; resolve it from the common git dir so linked worktrees
  // (agents often work in one) still get the term list and the raw corpus.
  const commonDir = git(['rev-parse', '--path-format=absolute', '--git-common-dir'], 'utf8').trim();
  return { root, git, privateDir: join(dirname(commonDir), 'private') };
}

// Terms, corpus and allowlist. Returns { fatal } when required private data is missing.
export async function loadContext(repo, env = process.env) {
  const notices = [];
  const terms = [];
  try {
    const text = await readFile(join(repo.privateDir, 'guard-terms.txt'), 'utf8');
    for (const line of text.split(/\r?\n/)) {
      const t = line.trim();
      if (t && !t.startsWith('#')) terms.push(t);
    }
  } catch {
    // no local list (fresh clone or CI)
  }
  for (const t of (env.GUARD_FORBIDDEN_TERMS || '').split(/[\n,]/)) if (t.trim()) terms.push(t.trim());
  if (!terms.length) {
    if (truthy(env.GUARD_REQUIRE_TERMS)) return { fatal: 'forbidden-term list required (GUARD_REQUIRE_TERMS) but none found' };
    notices.push('NOTICE: no forbidden-term list found; term check skipped');
  }
  const { corpus, fromCache } = await loadCorpus(
    join(repo.privateDir, 'raw'),
    join(repo.privateDir, '.guard-cache', 'corpus.json'),
  );
  if (!corpus) {
    if (truthy(env.GUARD_REQUIRE_CORPUS)) return { fatal: 'private/raw required (GUARD_REQUIRE_CORPUS) but not found' };
    notices.push('NOTICE: private/raw not found; raw-overlap check skipped');
  } else if (fromCache) notices.push('corpus: cached');
  const privateHashes = await loadPrivateHashes(repo.privateDir, join(repo.privateDir, '.guard-cache', 'hashes.json'));
  const allowlist = await loadAllowlist(join(repo.root, 'tools', 'guard', 'allowlist.txt'));
  return { terms, corpus, allowlist, privateHashes, notices };
}

// `--raw -z` output: ":oldmode newmode oldsha newsha status\0path\0" (no renames).
function parseRaw(out) {
  const t = out.split('\0');
  const entries = [];
  for (let i = 0; i < t.length; i++) {
    if (!t[i].startsWith(':')) continue;
    const m = t[i].slice(1).split(' ');
    entries.push({ mode: m[1], sha: m[3], path: t[++i] });
  }
  return entries;
}

const RAW = ['--raw', '-z', '--no-abbrev', '--no-renames', '--diff-filter=d'];

export const stagedEntries = repo => parseRaw(repo.git(['diff', '--cached', ...RAW], 'utf8'));

export const rangeEntries = (repo, a, b) => parseRaw(repo.git(['diff', ...RAW, a, b], 'utf8'));

export function trackedEntries(repo) {
  return repo.git(['ls-files', '-s', '-z'], 'utf8').split('\0').filter(Boolean).map(line => {
    const tab = line.indexOf('\t');
    const [mode, sha] = line.slice(0, tab).split(' ');
    return { mode, sha, path: line.slice(tab + 1) };
  });
}

function commitEntries(repo, sha) {
  const parents = repo.git(['rev-list', '--parents', '-n', '1', sha], 'utf8').trim().split(' ').slice(1);
  if (parents.length) return parseRaw(repo.git(['diff', ...RAW, parents[0], sha], 'utf8'));
  return parseRaw(repo.git(['diff-tree', '-r', '--root', '--no-commit-id', ...RAW, sha], 'utf8'));
}

// The mode always comes from the index/tree listing, so a gitlink is flagged even when its commit
// happens to exist in the local object store.
export function loadFiles(repo, entries, notices) {
  return entries.map(({ mode, sha, path }) => {
    if (mode === '160000') return { path, content: null, gitlink: true };
    try {
      return { path, content: repo.git(['cat-file', 'blob', sha]) };
    } catch {
      notices.push(`NOTICE: could not read ${path} (content checks skipped)`);
      return { path, content: null };
    }
  });
}

export function checkEntries(repo, entries, ctx) {
  const files = loadFiles(repo, entries, ctx.notices);
  const violations = checkFiles({
    files, forbiddenTerms: ctx.terms, corpus: ctx.corpus, allowlist: ctx.allowlist, privateHashes: ctx.privateHashes,
  });
  return { violations, checked: files.length };
}

// Every commit in `git rev-list <revArgs>`: its metadata and the content it introduces.
export function checkCommits(repo, revArgs, ctx) {
  const shas = repo.git(['rev-list', '--reverse', ...revArgs], 'utf8').split('\n').filter(Boolean);
  const violations = [];
  let checked = 0;
  for (const sha of shas) {
    const short = sha.slice(0, 7);
    const [authorEmail, committerEmail, ...rest] = repo.git(['log', '-1', '--format=%ae%x00%ce%x00%B', sha], 'utf8').split('\0');
    violations.push(...checkCommitMeta({ sha, authorEmail, committerEmail, message: rest.join('\0') }, ctx.terms));
    const r = checkEntries(repo, commitEntries(repo, sha), ctx);
    checked += r.checked;
    for (const v of r.violations) violations.push({ ...v, path: `${short}:${v.path}` });
  }
  return { violations, checked, commits: shas.length };
}

export function report({ violations, notices, checked, commits, json }) {
  if (json) {
    console.log(JSON.stringify({ violations, notices, checked, commits }, null, 2));
  } else {
    for (const n of notices) console.log(n);
    for (const v of violations) {
      const tail = v.key === '-' ? '(not allowlistable)' : `(allowlist key: ${v.key})`;
      console.log(`${v.rule}  ${v.path}  ${v.detail}  ${tail}`);
    }
    const scope = commits == null ? `${checked} file(s)` : `${commits} commit(s), ${checked} file change(s)`;
    console.log(violations.length
      ? `guard: ${violations.length} violation(s) in ${scope}. Fix them, or add a reviewed entry to tools/guard/allowlist.txt. Never use --no-verify.`
      : `guard: ok (${scope} checked)`);
  }
  return violations.length ? 1 : 0;
}
