# m3-forge Phase 0 (Skeleton) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the empty `material-design-3` repo into the `m3-forge` skeleton. That means a
renamed public repo, a private sibling repo in `private/`, a public-diff guard with a pre-commit
hook, a plugin skeleton, a minimal CI, and a single-folder local toolchain.

**Architecture:**
- The guard is dependency-free Node (ESM, `node:test`). A pure library does the checks; a thin CLI
  collects the inputs from git, and the same CLI runs in the hook and in CI.
- The toolchain is a set of Windows PowerShell 5.1 scripts driven by a pinned
  `toolchain.json`. They set environment variables only per process.
- The plugin skeleton is validated by our own script (deterministic, runs in CI) plus
  `claude plugin validate` locally.

**Tech Stack:** Node 22 (`node:test`, no npm deps), Windows PowerShell 5.1, Git for Windows `sh`
(hook), GitHub Actions (`ubuntu-24.04`), `gh` CLI.

**Spec:** `docs/superpowers/specs/2026-11-12-m3-forge-design.md`. Roadmap:
`docs/superpowers/plans/2026-11-12-m3-forge-roadmap.md`.

## Global Constraints

### Names
- The repo, plugin and marketplace are named `m3-forge`. The skill and command are `material3`.
  "Google" never appears in any name.
- The private repo is `ReL4xi0n/<private-name>`. Its name is given to the implementer out of band;
  it is in the owner's memory notes. It must **never** appear in any tracked file. It lives only in
  `private/guard-terms.txt` and in the GitHub Actions secret `GUARD_FORBIDDEN_TERMS`.

### Copy
- The README title and the plugin description contain the exact phrase "an unofficial skill for
  Material Design 3".
- The README states that the project is not affiliated with or endorsed by Google, and that it is a
  different project from `hamen/material-3-skill`.
- License: Apache-2.0. Copyright line: "Copyright 2026 The m3-forge authors". No personal data.

### Toolchain
- Root: `%USERPROFILE%\.m3-toolchain`.
- JDK 21, x64 (Temurin).
- Never modify the user or machine `PATH`, `JAVA_HOME`, or the system Java 1.8.
- Never auto-accept Android SDK licenses. The owner runs `sdkmanager --licenses`.
- Scripts must run under Windows PowerShell 5.1 (no `pwsh` 7 is installed), and from a path that
  contains spaces (the working copy's folder name has spaces).
- `.ps1` files are ASCII-only. PowerShell 5.1 reads BOM-less UTF-8 as ANSI.

### Git and GitHub
- Git identity and credentials are repo-local and already configured. They must not be changed.
- `gh` is not on PATH. Use the executable that the repo-local credential helper points to:
  `git config --local --get-all credential.https://github.com.helper`. It is shown below as `$GH`.
  Local machine paths are never written into tracked files.
- Before every public commit, run `npm run guard -- --staged` and it must pass.
- `git commit --no-verify` and any other hook bypass are forbidden. A guard false positive is
  resolved only by a reviewed entry in `tools/guard/allowlist.txt`, with a reason.

## Review Focus

1. **A fresh clone, or CI, with no `private/` folder.** The guard must still enforce the path,
   image and term rules (terms come from the env secret). It must skip only the corpus check, print
   a visible notice, and never crash. Covered in Task 3, test `cli: works without private dir`.
2. **Windows path variants with `core.ignorecase=true`.** `Private/x`, `private\x` and `./private/x`
   must all be caught. Covered in Task 3, test `isPrivatePath variants`.
3. **Repo paths containing spaces.** The hook, guard and toolchain scripts must work from the
   working copy, whose folder name has spaces. Covered in Task 3 (the integration repo is created under a temp dir named
   `guard test repo`) and Task 6 (run from the real repo path).
4. **Interrupted or repeated toolchain setup.** A corrupt or partial download is re-downloaded after
   a hash mismatch, and a second full run is a no-op. Covered in Task 6, Step 6.
5. **Node missing at commit time.** The hook must block the commit with a clear message, never pass
   silently. Covered in Task 3, test `hook blocks without node`.

---

### Task 1: Rename the public repo and verify the remote

**Files:** none. This changes GitHub and the local git config only.

- [ ] **Step 1: Rename the repo.**
  Run `& $GH repo rename m3-forge --repo ReL4xi0n/material-design-3 --yes`.
  Expected output: `✓ Renamed repository ReL4xi0n/m3-forge`.
- [ ] **Step 2: Point the local remote at the new URL.**
  Run `git remote set-url origin https://github.com/ReL4xi0n/m3-forge.git`.
- [ ] **Step 3: Verify.**
  - `git remote -v` shows `https://github.com/ReL4xi0n/m3-forge.git` for both fetch and push.
  - `& $GH repo view ReL4xi0n/m3-forge --json name,visibility` returns
    `{"name":"m3-forge","visibility":"PUBLIC"}`.
  - `git ls-remote origin` exits 0. Output is empty because there are no commits yet.

### Task 2: `.gitignore` and the private repo

**Files:**
- Create: `.gitignore`
- Create, inside `private/` (a separate repo): `README.md`, `raw/.gitkeep`,
  `reference-screenshots/.gitkeep`, `evals/.gitkeep`, `guard-terms.txt`

**Interfaces:**
- Produces: `private/guard-terms.txt`. Format: one forbidden term per line; lines starting with `#`
  are comments. Task 3 reads it.

- [ ] **Step 1: Write `.gitignore` first**, before `private/` exists.
  It must contain: `private/`, `out/`, `node_modules/`, `.dart_tool/`, `build/`, `.gradle/`,
  `local.properties`, `*.iml`, `.idea/`, `.DS_Store`.
- [ ] **Step 2: Create the GitHub repo.**
  Run `& $GH repo create ReL4xi0n/<private-name> --private --description "Private data for m3-forge"`.
- [ ] **Step 3: Initialize `private/`.**
  - Run `git init -b main` in `private/`.
  - Copy the main repo's local `user.name`, `user.email` and the `credential.https://github.com.helper`
    entries with `git config --local`.
  - Add `origin`.
- [ ] **Step 4: Write the files.**
  - `guard-terms.txt` contains the private repo name.
  - `README.md` contains one paragraph:
    - what this repo holds: `raw/` (dated scrapes), `reference-screenshots/`, `evals/` (full eval
      screenshots and code);
    - that it must never be referenced from the public repo.
- [ ] **Step 5: Commit and push.**
  Message: `chore: initialize private data repo`. Push with `git push -u origin main`.
- [ ] **Step 6: Verify.**
  - `& $GH repo view ReL4xi0n/<private-name> --json visibility` returns `"PRIVATE"`.
  - In the main repo, `git check-ignore private/README.md` prints the path.
  - `git status --porcelain` does not list `private/`.

### Task 3: Public-diff guard and pre-commit hook

**Files:**
- Create: `package.json`
- Create: `tools/guard/lib.mjs`
- Create: `tools/guard/check-public-diff.mjs`
- Create: `.githooks/pre-commit`
- Test: `tools/guard/test/lib.test.mjs`, `tools/guard/test/cli.test.mjs`
- Test fixtures: `tools/guard/test/fixtures/raw/page.txt`, `tools/guard/test/fixtures/raw/page.json`.
  These hold invented 30-word lorem-style text, never site text.

**Interfaces:**
- Consumes: `private/guard-terms.txt` (Task 2); env `GUARD_FORBIDDEN_TERMS` (newline- or
  comma-separated); env `GUARD_REQUIRE_TERMS` (`1`/`true` means exit 2 when no terms are found).
- Produces (`tools/guard/lib.mjs`):
  - `normalizePath(p: string): string`. Converts to forward slashes and strips a leading `./`. Case
    is preserved.
  - `isPrivatePath(p: string): boolean`. True when the first segment equals `private`,
    case-insensitively.
  - `isImagePath(p: string): boolean`. Extensions: png, jpg, jpeg, gif, webp, avif, svg, bmp, tif,
    tiff.
  - `isAllowedImagePath(p: string): boolean`. Allowlist: `harness/**/references/**`,
    `harness/**/goldens/**`, `examples/**`, `docs/images/**`.
  - `isBinary(buf: Buffer): boolean`. True if there is a NUL byte in the first 8000 bytes.
  - `shingles(text: string, n = 12): Set<string>`. Lowercases; maps every char that is not
    `\p{L}`/`\p{N}` to a space; splits; joins each window of n words with a space; stores the first
    16 hex chars of its SHA-1.
  - `buildCorpus(rawDir: string): Promise<Set<string> | null>`. Returns `null` if the dir is
    missing. Reads `.txt`, `.md`, `.html` (tags stripped), and `.json` (all string values,
    recursively).
  - `loadCorpus(rawDir: string, cacheFile: string): Promise<{ corpus: Set<string> | null, fromCache: boolean }>`.
    The cache lives at `private/.guard-cache/corpus.json` and holds:
    - `{ fingerprint, shingles: string[] }`;
    - `fingerprint`: the SHA-256 over the sorted list of `relativePath|size|mtimeMs` of every file
      `buildCorpus` reads.
    On a matching fingerprint it returns the cached set without reading file contents. On a
    mismatch, or a missing or corrupt cache, it rebuilds and rewrites the cache. If `rawDir` is
    missing it returns `{ corpus: null, fromCache: false }`.
  - `loadAllowlist(file: string): Promise<AllowEntry[]>`. Format of `tools/guard/allowlist.txt`
    (tracked):
    - one entry per line: `<rule>\t<path>\t<key>\t<reason>`;
    - `#` comments and blank lines are ignored;
    - `rule` is `raw-overlap` (key = the 16-hex shingle hash) or `forbidden-term` (key = `*`). The
      latter is for a reviewed false positive such as a generic word;
    - `reason` must be non-empty, ≥ 10 chars;
    - a malformed line throws `Error('allowlist line <n>: <problem>')`.

    `private-path` and `foreign-image` can never be allowlisted. A line naming them throws.
  - `checkFiles({ files: {path: string, content: Buffer}[], forbiddenTerms: string[], corpus: Set<string> | null, allowlist?: AllowEntry[] }): Violation[]`.
    A violation is dropped only when an allowlist entry matches its rule, its exact normalized path,
    and its key. `raw-overlap` violations carry `key` (the shingle hash) so they can be allowlisted.
    `Violation = { rule: 'private-path' | 'foreign-image' | 'forbidden-term' | 'raw-overlap', path: string, detail: string }`.
    - Forbidden terms are matched case-insensitively.
    - Binary files get only the path and image rules.
    - `raw-overlap` detail shows at most the first 6 words of the match plus `…`.
- Produces (CLI): `node tools/guard/check-public-diff.mjs (--staged | --range <A>..<B> | --all-tracked) [--json]`.
  - Content sources:
    - `--staged`: `git diff --cached --name-only --diff-filter=ACMR -z`, with content from
      `git show :<path>`.
    - `--range`: `git diff --name-only --diff-filter=ACMR -z A B`, with content from
      `git show B:<path>`.
    - `--all-tracked`: `git ls-files -z`, with content from the index.
  - Missing inputs print notices:
    - `NOTICE: no forbidden-term list found; term check skipped`
    - `NOTICE: private/raw not found; raw-overlap check skipped`
  - Exit codes: 0 clean; 1 violations (one line each: `<rule>  <path>  <detail>`); 2 terms
    required but missing.
  - The corpus comes from `loadCorpus('private/raw', 'private/.guard-cache/corpus.json')`. On a
    cache hit, print `corpus: cached`.
  - Always loads `tools/guard/allowlist.txt`. Create it in this task with only a header comment that
    explains the format and the "no --no-verify" rule.
  - Each violation line ends with `(allowlist key: <key>)`, so a reviewed false positive can be
    added without guessing.
- Produces: the `package.json` scripts `"test": "node --test"` and
  `"guard": "node tools/guard/check-public-diff.mjs"`.
  `"type": "module"`, `"private": true`, `"engines": {"node": ">=22"}`.

- [ ] **Step 1: Write the failing library tests** in `tools/guard/test/lib.test.mjs`:

```js
test('isPrivatePath variants', () => {
  for (const p of ['private/raw/a.txt', 'Private/x.txt', 'private\\x.txt', './private/y'])
    assert.equal(isPrivatePath(p), true, p);
  for (const p of ['docs/private-notes.md', 'knowledge/private/x.md', 'privately.md'])
    assert.equal(isPrivatePath(p), false, p);
});
test('foreign images flagged, allowlisted images pass', () => {
  const v = checkFiles({ files: [
    { path: 'docs/shot.png', content: Buffer.from([0x89, 0x50, 0]) },
    { path: 'harness/web/references/a.png', content: Buffer.from([0x89, 0]) },
    { path: 'examples/web/x.webp', content: Buffer.from([0]) },
  ], forbiddenTerms: [], corpus: null });
  assert.deepEqual(v.map(x => [x.rule, x.path]), [['foreign-image', 'docs/shot.png']]);
});
test('forbidden term is case-insensitive and skipped for binaries', () => {
  const v = checkFiles({ files: [
    { path: 'a.md', content: Buffer.from('see Secret-Repo-XYZ here') },
    { path: 'b.bin', content: Buffer.concat([Buffer.from([0]), Buffer.from('secret-repo-xyz')]) },
  ], forbiddenTerms: ['secret-repo-xyz'], corpus: null });
  assert.deepEqual(v.map(x => [x.rule, x.path]), [['forbidden-term', 'a.md']]);
});
test('raw-overlap: 12-word run caught across case/punctuation, 11 words not', async () => {
  const corpus = await buildCorpus(fixturesRawDir);
  const twelve = /* first 12 words of fixtures/raw/page.txt, re-cased, with commas inserted */;
  const eleven = /* first 11 words */;
  assert.equal(checkFiles({ files: [{ path: 'k.md', content: Buffer.from(`x ${twelve} y`) }], forbiddenTerms: [], corpus })[0].rule, 'raw-overlap');
  assert.equal(checkFiles({ files: [{ path: 'k.md', content: Buffer.from(eleven) }], forbiddenTerms: [], corpus }).length, 0);
});
test('buildCorpus: missing dir -> null; json string values included', async () => {
  assert.equal(await buildCorpus(join(tmpdir(), 'does-not-exist-guard')), null);
  const c = await buildCorpus(fixturesRawDir);   // page.json holds a 12+ word string nested 2 levels deep
  assert.ok([...shingles(/* that json string */)].every(h => c.has(h)));
});
```

Additional tests, owner additions 2 and 3:

```js
test('allowlist drops only the exact rule+path+key', ...);
// The raw-overlap violation on k.md is suppressed by an entry with its key and path k.md.
// The same key on path other.md is still reported.
test('allowlist rejects private-path/foreign-image entries and short reasons', ...);
// loadAllowlist throws, with the message containing 'line 1'.
test('loadCorpus caches and invalidates on raw change', async () => {
  // Copy the fixtures to a temp raw dir; first call -> fromCache false; second -> fromCache true and same size;
  // append a word to page.txt (changes size+mtime) -> fromCache false;
  // corrupt the cache file -> fromCache false, and no throw.
});
```

- [ ] **Step 2: Run `npm test` and confirm the tests fail** with
  `Cannot find module .../tools/guard/lib.mjs`.
- [ ] **Step 3: Implement `tools/guard/lib.mjs`** with the signatures above.
- [ ] **Step 4: Run `npm test` and confirm all lib tests pass.**
- [ ] **Step 5: Write the failing CLI tests** in `tools/guard/test/cli.test.mjs`.
  Each test creates a temp git repo under `join(tmpdir(), 'guard test repo', <random>)`, so the
  path has spaces. The test copies the guard into it and runs it with `execFileSync('node', …)`.

```js
test('cli: staged private file -> exit 1, private-path', ...);
// mkdir private, write private/planted.txt, `git add -f private/planted.txt`;
// run --staged: status 1, stdout includes 'private-path' and 'private/planted.txt'.

test('cli: clean staged file -> exit 0', ...);
// stage README.md 'hello'; status 0.

test('cli: works without private dir', ...);
// no private/, env GUARD_FORBIDDEN_TERMS='secret-repo-xyz', stage a.md containing it;
// status 1, stdout includes 'forbidden-term' and 'NOTICE: private/raw not found'.

test('cli: terms required but missing -> exit 2', ...);
// GUARD_REQUIRE_TERMS=1, no env terms, no private/; status 2.

test('cli: --range checks only files changed in range', ...);
// two commits; the second adds docs/x.png; --range HEAD~1..HEAD flags only docs/x.png.

test('hook blocks without node', ...);
// Windows only (skip elsewhere): run `sh .githooks/pre-commit` with env PATH set to Git's usr/bin only;
// status 1; output includes 'node not found; commit blocked'.
```

- [ ] **Step 6: Run `npm test` and confirm the CLI tests fail** because the CLI is missing.
- [ ] **Step 7: Implement the CLI and the hook.**
  - `tools/guard/check-public-diff.mjs`: the CLI as specified above.
  - `.githooks/pre-commit`: an sh script.
    - If `node` is missing: echo `m3-forge guard: node not found; commit blocked` and exit 1.
    - Otherwise: `exec node tools/guard/check-public-diff.mjs --staged`.
- [ ] **Step 8: Run `npm test` and confirm all pass.**
  Then run `git config core.hooksPath .githooks` in the main repo; this is local config.

### Task 4: Baseline files, first commit, push, planted-file evidence

**Files:**
- Create: `LICENSE` (the verbatim Apache-2.0 text from https://www.apache.org/licenses/LICENSE-2.0.txt)
- Create: `NOTICE`
- Create: `README.md`
- Create: `.gitattributes`
- Already present: `docs/superpowers/specs/2026-11-12-m3-forge-design.md`, `docs/superpowers/plans/*.md`

- [ ] **Step 1: Write `NOTICE`:**
  `m3-forge` / `Copyright 2026 The m3-forge authors` / a blank line / "This product is licensed under
  the Apache License, Version 2.0. Third-party attributions are added as third-party material is
  included."
- [ ] **Step 2: Write the `README.md` stub.** It contains:
  - Title: `# m3-forge — an unofficial skill for Material Design 3`.
  - A disclaimer: "Not affiliated with or endorsed by Google. Material Design is a design system by
    Google."
  - The line "Not to be confused with hamen/material-3-skill; this is a separate project."
  - A status line: "Under construction; not yet released."
  - Planned install commands (spec §14), marked "planned".
  - A Contributing section: `npm test`, `git config core.hooksPath .githooks`, and the rule that
    nothing under `private/` is ever committed.
- [ ] **Step 3: Write `.gitattributes`:**
  `* text=auto eol=lf`, `*.ps1 text eol=crlf`, and `binary` for `*.ttf *.otf *.woff *.woff2 *.png
  *.jpg *.webp`.
- [ ] **Step 4: Run the planted-file check (evidence).**
  - Write `private/planted.txt`.
  - Run `git add -f private/planted.txt`, then `npm run guard -- --staged`.
  - Expected: exit 1 and a `private-path  private/planted.txt` line.
  - Record the output for the phase report.
  - Clean up: `git rm --cached private/planted.txt`, then delete the file inside `private/`.
- [ ] **Step 5: Stage everything else and run `npm run guard -- --staged`.**
  Expected: exit 0. Also confirm `git diff --cached --name-only` lists nothing under `private/`.
- [ ] **Step 6: Commit and push.**
  - Commit message: `chore: initial skeleton (license, readme, guard, design docs)`. The hook runs
    the guard automatically.
  - Push with `git push -u origin main`.
- [ ] **Step 7: Verify** that `& $GH api repos/ReL4xi0n/m3-forge/commits/main --jq .sha` equals
  `git rev-parse HEAD`.

### Task 5: Plugin skeleton, plugin validator, minimal CI (via PR)

**Files:**
- Create: `.claude-plugin/marketplace.json`
- Create: `plugin/.claude-plugin/plugin.json`
- Create: `plugin/skills/material3/SKILL.md`
- Create: `tools/ci/validate-plugin.mjs`
- Create: `.github/workflows/ci.yml`
- Test: `tools/ci/test/validate-plugin.test.mjs`

**Interfaces:**
- Produces: `validatePlugin(repoRoot: string): Promise<string[]>`. It returns error messages, and an
  empty array means valid. The CLI `node tools/ci/validate-plugin.mjs [root]` exits 1 on any error.
  The checks:
  - `marketplace.json`: `name === 'm3-forge'`; `owner.name` is non-empty; `plugins[0]` has
    `{name: 'm3-forge', source: './plugin'}`.
  - `plugin.json`: `name === 'm3-forge'`; `description` contains "an unofficial skill for Material
    Design 3", case-insensitively.
  - `SKILL.md`:
    - frontmatter `name: material3`;
    - `disable-model-invocation: true`;
    - a non-empty `argument-hint`;
    - the body contains `$ARGUMENTS`;
    - the file is ≤ 500 lines.
  - No plugin, marketplace or skill name contains "google", case-insensitively.
  - Frontmatter is parsed as simple `key: value` lines between `---` fences, with no YAML dependency.

- [ ] **Step 1: Write the failing tests.**
  - `validatePlugin(realRepoRoot)` returns `[]`. This fails until the files exist.
  - For each of the mutations below, applied to a temp copy, assert that the returned errors
    mention it:
    - `disable-model-invocation: false`;
    - `name: material-3`;
    - the description without the phrase;
    - a missing `$ARGUMENTS`;
    - plugin name `google-m3`.
- [ ] **Step 2: Run `npm test` and confirm the tests fail.**
- [ ] **Step 3: Create the three manifest files.**
  `marketplace.json`:

```json
{ "name": "m3-forge",
  "owner": { "name": "ReL4xi0n" },
  "plugins": [ { "name": "m3-forge", "source": "./plugin",
                 "description": "an unofficial skill for Material Design 3 — /material3 builds M3 Expressive UIs for web, Flutter and Jetpack Compose" } ] }
```

  `plugin.json`: `{"name": "m3-forge", "version": "0.0.1", "description": <same text>, "license": "Apache-2.0", "repository": "https://github.com/ReL4xi0n/m3-forge"}`.

  `SKILL.md`:

```markdown
---
name: material3
description: Build a Material Design 3 (Expressive by default) UI for web, Flutter or Jetpack Compose from a request. An unofficial skill for Material Design 3.
argument-hint: "<UI request>"
disable-model-invocation: true
---

This skill is under construction (m3-forge Phase 0). Tell the user it is not functional yet and do not build anything.

Request: $ARGUMENTS
```

- [ ] **Step 4: Implement `tools/ci/validate-plugin.mjs`.**
  Run `npm test` and confirm all pass. Run `node tools/ci/validate-plugin.mjs` and confirm exit 0.
- [ ] **Step 5: Run the official validator locally.**
  Run `claude plugin validate .` and `claude plugin validate ./plugin`. Expected: both report valid.
  Record the output. If the CLI reports issues that our validator missed, add each one as a check
  in `validatePlugin`, with a test.
- [ ] **Step 6: Write `.github/workflows/ci.yml`.**

```yaml
name: ci
on:
  pull_request:
  push:
    branches: [main]
permissions:
  contents: read
jobs:
  checks:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: npm test
      - run: node tools/ci/validate-plugin.mjs
      - name: guard (all tracked files)
        run: node tools/guard/check-public-diff.mjs --all-tracked
        env:
          GUARD_FORBIDDEN_TERMS: ${{ secrets.GUARD_FORBIDDEN_TERMS }}
          GUARD_REQUIRE_TERMS: ${{ github.event_name == 'push' || github.event.pull_request.head.repo.full_name == github.repository }}
```

- [ ] **Step 7: Set the CI secret.**
  Run `& $GH secret set GUARD_FORBIDDEN_TERMS --repo ReL4xi0n/m3-forge`, feeding the private repo
  name on stdin, so it never appears in shell history or a file.
- [ ] **Step 8: Open the PR.**
  - Create branch `phase-0/plugin-ci`.
  - Commit with message `feat: plugin skeleton, plugin validator, minimal CI`. The hook runs the
    guard.
  - Push the branch.
  - Run `& $GH pr create --fill --base main`.
- [ ] **Step 9: Wait for CI and merge.**
  - `& $GH pr checks --watch` must show `checks` passing.
  - Record the run URL.
  - Run `& $GH pr merge --squash --delete-branch`.
  - Run `git checkout main && git pull`.
  - Confirm that the `push` run on main is also green.

### Task 6: Local toolchain (single folder, license stop)

**Files:**
- Create: `tools/toolchain/toolchain.json`
- Create: `tools/toolchain/env.ps1`
- Create: `tools/toolchain/setup.ps1`
- Create: `tools/toolchain/accept-licenses.ps1`
- Create: `tools/toolchain/check.ps1`
- Create: `tools/toolchain/snapshot-system.ps1`
- Create: `tools/toolchain/README.md`

**Interfaces:**
- Produces: `toolchain.json`:

```json
{ "root": "%USERPROFILE%\\.m3-toolchain",
  "components": {
    "jdk":          { "version": "", "url": "", "checksum": { "algo": "SHA256", "value": "" }, "dir": "jdk-21" },
    "flutter":      { "version": "", "url": "", "checksum": { "algo": "SHA256", "value": "" }, "dir": "flutter" },
    "cmdlinetools": { "version": "", "url": "", "checksum": { "algo": "SHA1",   "value": "" }, "dir": "android-sdk/cmdline-tools/latest" } },
  "androidPackages": ["platforms;android-36", "build-tools;36.0.0"] }
```

  The empty fields are filled in Step 1 from official sources. They are never typed from memory.
- Produces: dot-sourcing `env.ps1` sets the following for the current process only:
  - `M3_TOOLCHAIN`;
  - `JAVA_HOME` = `<root>\jdk-21`;
  - `ANDROID_HOME` and `ANDROID_SDK_ROOT` = `<root>\android-sdk`;
  - `ANDROID_USER_HOME` = `<root>\android-user`;
  - `GRADLE_USER_HOME` = `<root>\gradle-home`;
  - `PUB_CACHE` = `<root>\pub-cache`;
  - `PLAYWRIGHT_BROWSERS_PATH` = `<root>\ms-playwright`;
  - `FLUTTER_SUPPRESS_ANALYTICS` = `true`;
  - `$env:Path` prepended with the jdk `bin`, flutter `bin`, and cmdline-tools `bin`.

  Later phases' harness scripts dot-source it.
- Produces: `setup.ps1 -Stage base|packages`.
  - `base`: downloads into `<root>\downloads`, verifies checksums, extracts, then prints the license
    instruction and exits 0.
  - `packages`: exits 3 with `Android SDK licenses not accepted yet: run tools\toolchain\accept-licenses.ps1`
    unless `<root>\android-sdk\licenses\android-sdk-license` exists. Otherwise it runs
    `sdkmanager --install` with the packages in `androidPackages`.
- Produces: `accept-licenses.ps1`. It dot-sources `env.ps1` and runs `sdkmanager --licenses`
  interactively. **Only the owner runs it.**

- [ ] **Step 1: Resolve the pinned versions and fill in `toolchain.json`.**
  - **JDK:** latest Temurin 21 GA, Windows x64 JDK zip, from
    `https://api.adoptium.net/v3/assets/latest/21/hotspot?architecture=x64&image_type=jdk&os=windows`.
    Use `binary.package.link`, `binary.package.checksum` and `version.semver`.
  - **Flutter:** current stable from
    `https://storage.googleapis.com/flutter_infra_release/releases/releases_windows.json`. Use the
    entry whose `hash` equals `current_release.stable`, with its `archive`, `sha256` and `version`.
  - **Android command-line tools:** the latest from
    `https://dl.google.com/android/repository/repository2-3.xml`. Use the `cmdline-tools` package's
    Windows archive URL and its SHA-1.
  - Confirm that `platforms;android-36` and `build-tools;36.0.0` exist in that XML. If they don't,
    use the highest 36.x build-tools and record the change.
- [ ] **Step 2: Take the "before" snapshot.**
  Run `powershell -NoProfile -File tools\toolchain\snapshot-system.ps1 -Out out\snapshot-before.json`.
  It records:
  - the User and Machine `Path`;
  - User and Machine `JAVA_HOME`;
  - `java -version` from a fresh `powershell -NoProfile`;
  - the top-level entry names in `%APPDATA%`, `%LOCALAPPDATA%` and `%USERPROFILE%`.
- [ ] **Step 3: Run the base stage.**
  Run `powershell -NoProfile -ExecutionPolicy Bypass -File tools\toolchain\setup.ps1 -Stage base`.
  Expected output ends with:
  `STOP: owner must run tools\toolchain\accept-licenses.ps1, then setup.ps1 -Stage packages`.
- [ ] **Step 4: STOP. Ask the owner (in Turkish) to accept the licenses.**
  Ask them to run `powershell -NoProfile -ExecutionPolicy Bypass -File tools\toolchain\accept-licenses.ps1`
  and accept the licenses themselves. Wait for their confirmation.
- [ ] **Step 5: Run the packages stage.**
  Run `setup.ps1 -Stage packages`. Expected: `sdkmanager --list_installed` shows both packages.
- [ ] **Step 6: Test idempotence and recovery.**
  - Run `setup.ps1 -Stage base` again. Expected: every component prints `ok (already installed,
    checksum verified)` and nothing is downloaded.
  - Truncate `<root>\downloads\<jdk zip>` to 1 KB, delete `<root>\jdk-21`, and run again.
    Expected: `checksum mismatch -> re-downloading`, then `ok`.
- [ ] **Step 7: Run the check.**
  Run `powershell -NoProfile -File tools\toolchain\check.ps1`. Expected:
  - `java -version` includes `21.` and `64-Bit`;
  - `flutter --version` prints the pinned version;
  - `sdkmanager --version` succeeds;
  - `flutter doctor` shows the Android toolchain without license errors. Other doctor warnings,
    such as Visual Studio or Chrome, are expected and recorded.
- [ ] **Step 8: Take the "after" snapshot and compare.**
  Run `snapshot-system.ps1 -Out out\snapshot-after.json`, then
  `check.ps1 -CompareSnapshots out\snapshot-before.json out\snapshot-after.json`. Expected:
  - Path, JAVA_HOME and system `java -version` (1.8) are identical.
  - Any new top-level entries in `%APPDATA%`, `%LOCALAPPDATA%` or `%USERPROFILE%`, such as Dart or
    Flutter settings dirs, are listed. They are written into `tools/toolchain/README.md` under
    "Residue outside the toolchain folder", together with the uninstall steps: delete
    `%USERPROFILE%\.m3-toolchain` and those listed entries.
- [ ] **Step 9: Commit.**
  - Run `npm run guard -- --staged`.
  - Commit message: `feat: single-folder local toolchain scripts`.
  - Push via PR, as in Task 5 Steps 8–9: branch `phase-0/toolchain`.

### Task 7: Phase 0 evidence and stop

- [ ] **Step 1: Run the final verification on `main`.**
  - `npm test` (all pass);
  - `node tools/ci/validate-plugin.mjs` (exit 0);
  - `npm run guard -- --all-tracked` (exit 0);
  - `git ls-files | grep -i '^private/'` (empty);
  - `git grep -i -F -f private/guard-terms.txt` (no matches);
  - `git remote -v`;
  - `cd private && git log --oneline -1 && git remote -v`.
- [ ] **Step 2: Report to the owner in Turkish.**
  - Remote URLs (public renamed; private is PRIVATE).
  - The planted-file guard output from Task 4 Step 4.
  - CI run URLs: the PR run and the main push run.
  - Toolchain versions and checksums.
  - The before/after snapshot comparison and the residue list.
  - `claude plugin validate` output.
  - Anything that deviated from this plan.
- [ ] **Step 3: STOP.** Wait for approval. On approval, write the Phase 1 plan.
