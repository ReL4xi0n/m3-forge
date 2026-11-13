# m3-forge Phase 1 (Knowledge) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the knowledge base the skill is written from. It has four parts:
- a terms report;
- a polite, resumable scrape of m3.material.io, stored only in `private/`;
- pinned token extraction from five official sources;
- `knowledge/`, written in our own words, with provenance for every number and separate NOT FOUND and conflict lists.

**Architecture:**
- **Scraper:** Node + Playwright, under `tools/extract/scrape/`. It is driven by the sitemap and checks robots.txt. It keeps a state file, so a run can resume. It saves rendered text, the site's own JSON responses, and image URL/alt metadata into `private/raw/<date>/`.
- **Token pipeline:** `tools/extract/sources/` pins and fetches the source repos and packages into the toolchain folder. `tools/extract/tokens/` normalizes every source into one canonical record model, then merges the records and generates the NOT FOUND and conflict reports.
- **Knowledge notes:** written by hand from the private raw text. A linter checks that every number carries a provenance marker. The guard's 12-word overlap check blocks copied sentences in every commit.

**Tech Stack:** Node ≥ 22 (ESM, `node:test`), Playwright (pinned exact version, devDependency only), git, Windows PowerShell 5.1 for the toolchain environment.

**Spec:** `docs/superpowers/specs/2026-11-12-m3-forge-design.md`. Mainly §3, §5, §6, §8, §11, §13 and §15. The roadmap's standing rules apply: `docs/superpowers/plans/2026-11-12-m3-forge-roadmap.md`.

## Global Constraints

- Numeric token values are never rounded or guessed. A value that cannot be found in a source is recorded as `"NOT FOUND"`.
- When the site and a repo disagree, the repo value wins and the difference is logged.
- Precedence: platform-specific values come from that platform's own repo. Cross-platform canonical values come from material-web. Any disagreement goes into `conflicts.md`.
- NOT FOUND and conflicts are separate files: `knowledge/not-found.md` and `knowledge/conflicts.md`.
- Raw scraped text, rendered pages, captured site JSON and screenshots live only in `private/`. The public repo contains no reference to the private repository.
- Images and illustrations from m3.material.io never enter the public repo. The scraper never downloads image files.
- Screenshots taken to read measurements are stored only in `private/reference-screenshots/<YYYY-MM-DD>/`.
- Scraping politeness:
  - obey robots.txt;
  - one page at a time;
  - at least **3 s** between page navigations;
  - user agent: Playwright's default Chromium UA followed by exactly ` m3-forge (+https://github.com/ReL4xi0n/m3-forge)` (owner decision, 2026-11-13). The same string is used for robots/sitemap fetches. No personal data in any request.
- Component pages: every tab the site offers for a component (Overview, Specs, Guidelines, Accessibility, or whatever exists) is scraped as its own page. Content behind clicks (accordions, in-page tabs, "show more") is expanded and captured.
- **Gate:** no request to m3.material.io's pages or sitemap is made by our code until the owner has approved `docs/sources-and-licensing.md` (Task 1 STOP).
- Token sources are pinned in `knowledge/sources.lock.json`, each with a commit or version plus a hash:
  - material-web;
  - material-color-utilities (TS 0.4.0);
  - material-components-android;
  - Flutter `material_ui`;
  - Compose material3 **1.5.0-rc01**.
- `knowledge/guidance/` is in our own words, with no copied sentences. The guard's raw-overlap check (12-word shingles against `private/raw/`) runs in pre-commit and pre-push on every commit.
- Toolchain downloads go into `%USERPROFILE%\.m3-toolchain` only. This covers Playwright browsers, source caches and the npm cache. Environment changes are process-only.
- Git:
  - commits use the noreply email as author and committer;
  - one branch per task, a PR, green CI, then a local fast-forward merge and push; never GitHub's merge;
  - `--no-verify` is forbidden;
  - private-repo commits also use the noreply email.
- Everything in the repo is in English. The owner is spoken to in Turkish.

## Review Focus

1. **Site quietly changes shape.** A page renders but its main text is near-empty, or no JSON is captured. Expected: the page is recorded as `failed`/flagged, never as `done`, and it shows up in the coverage report. *Pinned in Task 4 (`capturePage` result validation) and Task 5 (coverage lists `json: none`).*
2. **Run interrupted mid-page** (closed laptop, crash, Ctrl+C). Expected: no half-written page counts as done, and `--resume` continues without re-fetching finished pages. *Pinned in Task 3 (`writePageAtomic` + state test) and Task 5 (resume test).*
3. **A sitemap URL redirects** to another in-scope page or out of scope. Expected: it is recorded as a redirect with its final URL; the page is neither counted twice nor reported missing. *Pinned in Task 5 (coverage redirect test).*
4. **Two native token names map to one canonical id within a source.** Expected: hard error naming both, never a silent overwrite. *Pinned in Task 8 (`buildIndex` collision test).*
5. **Unparseable values** (`calc()`, `rem`, Sass expressions, unknown units). Expected: kept verbatim as `{unparsed}`, counted, and listed in `not-found.md` under "unparsed". They are never coerced into a number. *Pinned in Task 8 (`normalizeValue` tests).*

---

## File structure

```
docs/sources-and-licensing.md            Task 1: terms report (gate)
NOTICE                                   Task 1: attributions
tools/guard/lib.mjs, repo.mjs            Task 2: corpus versioning, private-copy rule
tools/toolchain/env.ps1                  Task 4: npm cache into toolchain folder
tools/extract/scrape/
  robots.mjs      parse + isAllowed (Google semantics)
  sitemap.mjs     parse sitemap(s), scope + expressive URL flag
  slug.mjs        URL path -> collision-free file name
  pacer.mjs       min delay, crawl-delay, backoff
  state.mjs       run dir, state.json, atomic page writes
  capture.mjs     Playwright: render, capture JSON, text, image metadata (only Playwright importer)
  coverage.mjs    planned vs scraped, exceptions, knowledge/coverage.md
  run.mjs         CLI: plan | scrape [--resume] | coverage
  capture-specs.mjs  CLI: private measurement screenshots (Task 12)
  test/…          unit tests + fixtures (fixture server for capture)
tools/extract/sources/
  lock.mjs        lock schema + verify
  fetch.mjs       CLI: --resolve | fetch (cache in toolchain folder)
tools/extract/tokens/
  model.mjs       TokenRecord, normalizeValue, canonical ids, buildIndex
  web.mjs compose.mjs mdc.mjs flutter.mjs mcu.mjs   one extractor per source
  aliases.json    reviewed set-name aliases (native -> canonical)
  merge.mjs       precedence, conflicts, NOT FOUND
  report.mjs      CLI: writes knowledge/tokens/*.json, conflicts.md, not-found.md (--check in CI)
tools/extract/knowledge/lint.mjs          Task 11: note schema + provenance markers (--check in CI)
knowledge/
  README.md  sources.lock.json  coverage.md  coverage-exceptions.json
  tokens/<source>.json  tokens/merged.json  tokens/summary.json  site-values.json
  conflicts.md  not-found.md
  guidance/styles/*.md  guidance/foundations/*.md  guidance/components/*.md  guidance/expressive.md
private/raw/<YYYY-MM-DD>/{meta/, pages/}          (private repo)
private/reference-screenshots/<YYYY-MM-DD>/       (private repo)
```

---

### Task 1: Terms report and attributions — then STOP

**Files:**
- Create: `docs/sources-and-licensing.md`
- Modify: `NOTICE`

**Interfaces:** Produces the approved scraping rules that Tasks 3–6 implement: delay, robots handling, blocked resources, user agent and storage.

- [ ] **Step 1: Research. These are reads for the report, not scraping.**
  - Read these with WebFetch, one request each:
    - `https://m3.material.io/robots.txt`;
    - the page where m3.material.io states its content license;
    - Google Terms of Service, the clauses on automated access;
    - Google's trademark guidelines;
    - the LICENSE files of the five token sources and of the two font and icon repos named in spec §3.
  - Record each URL and the date read. Do not fetch the sitemap or any guidance page.
- [ ] **Step 2: Write `docs/sources-and-licensing.md`.** Use these sections:
  1. Summary and verdict ("proceed" or "blocker found").
  2. robots.txt: the rules that apply to us, the date, the file's SHA-256, and any `Sitemap:` / `Crawl-delay` lines.
  3. Content license statement (paraphrased, with a link).
  4. Google ToS on automated access, and how robots compliance satisfies it.
  5. Trademarks and naming.
  6. Per-source licenses table: source, license, what we take, where it lands.
  7. Our compliance choices, matching the Global Constraints: delay, one page at a time, blocked resource types (image, media, font), blocked analytics hosts, the exact user-agent suffix, clicking only in-page expanders (never forms or links off the page), no logins or cookies kept, private storage, no images in public.
  8. Attribution: the NOTICE text, and the CC BY 4.0 attribution form for paraphrased guidance.
  9. Open questions for the owner.
  - Paraphrase throughout. Quote at most a few words at a time; the guard blocks 12-word runs once the raw corpus exists.
- [ ] **Step 3: Update `NOTICE`.**
  - Attribute the source repositories by name.
  - Attribute the M3 guidance under CC BY 4.0, with the license link and the statement that our notes are paraphrased and changed.
  - Use names only; no private-repo reference.
- [ ] **Step 4: Run the guard, then do the PR and local merge.**
  - Guard: `node tools/guard/check-public-diff.mjs --staged` must pass.
  - Commit: `docs: sources and licensing report`.
  - Push the branch `phase-1/terms`, open a PR, wait for green CI, fast-forward merge, then run `node tools/guard/check-public-diff.mjs --commits origin/main..main` and push.
- [ ] **Step 5: STOP.** Report to the owner in Turkish: the verdict, any blocker, and the open questions. Do not start Task 2 until the owner approves the report.

---

### Task 2: Guard readiness for a real corpus

**Files:**
- Modify: `tools/guard/lib.mjs` (`loadCorpus` fingerprint)
- Modify: `tools/guard/repo.mjs` (`loadContext`, new private-copy index)
- Test: `tools/guard/test/phase1-guard.test.mjs`

**Interfaces:**
- Produces:
  - `CORPUS_VERSION` (string const) in `lib.mjs`;
  - `loadPrivateHashes(privateDir: string, cacheFile: string) → Promise<Set<string> | null>` in `lib.mjs`, holding SHA-256 hex of every file under `private/` except `.git/` and `.guard-cache/`;
  - `checkFiles` accepts `privateHashes?: Set<string>`;
  - new rule `private-copy`, not allowlistable.

- [ ] **Step 1: Write failing tests.**
  - `corpus cache is rebuilt when CORPUS_VERSION changes`: write a cache with `version: 'old'`, then assert `fromCache === false`.
  - `private-copy: a committed file identical to any private file is flagged`: copy `private/reference-screenshots/x.png` to `docs/images/x.png`, stage it, run `--staged`. Expect exit 1 and the line `private-copy  docs/images/x.png`.
  - `private-copy: hashes are cached and rebuilt when a private file changes`.
- [ ] **Step 2: Run them and confirm they fail.** `node --test tools/guard/test/phase1-guard.test.mjs`. Expected: 3 failures.
- [ ] **Step 3: Implement.**
  - Include `CORPUS_VERSION = '2'` in the corpus fingerprint input.
  - `loadPrivateHashes` uses the same `rel|size|mtime` fingerprint cache pattern, in `private/.guard-cache/hashes.json`.
  - `loadContext` passes the hashes through. In CI (no `private/`) the rule is simply skipped.
  - `GUARD_REQUIRE_CORPUS` already makes hooks fail closed.
- [ ] **Step 4: Run the full suite.** `node --test` must be all green.
- [ ] **Step 5: Commit, PR and merge.** Commit message: `feat(guard): versioned corpus cache and private-copy rule`.

---

### Task 3: Scraper core (pure modules)

**Files:**
- Create: `tools/extract/scrape/{robots,sitemap,slug,pacer,state}.mjs`
- Test: `tools/extract/scrape/test/core.test.mjs`, plus fixtures in `test/fixtures/` (invented robots and sitemap files)

**Interfaces (Produces):**
- `parseRobots(text: string) → Robots` and `isAllowed(robots: Robots, pathAndQuery: string) → boolean`.
  - Rules apply to the `User-agent: *` group.
  - Longest match wins; `Allow` wins a tie.
  - `*` and a trailing `$` are supported.
- `crawlDelaySeconds(robots) → number | null`.
- `parseSitemap(xml: string) → { urls: string[], sitemaps: string[] }`. It handles both `urlset` and `sitemapindex`.
- `classify(path: string) → { inScope: boolean, section: 'styles'|'foundations'|'components'|'expressive'|null, expressiveUrl: boolean }`.
  - In scope: the path starts with `/styles/`, `/foundations/` or `/components/`, or the path contains `expressive` (case-insensitive).
- `slugFor(path: string) → string`.
  - Lowercase; segments joined by `__`; every character outside `[a-z0-9-]` becomes `-`.
  - Always suffixed with `~` + the first 8 hex characters of SHA-1(path), so the result is collision-free on case-insensitive file systems.
- `createPacer({ minDelayMs = 3000, crawlDelaySec = null, now, sleep }) → { wait(): Promise<void>, backoff(attempt: number, retryAfterSec?: number): Promise<void> }`.
  - The effective delay is `max(minDelayMs, crawlDelaySec*1000)`.
  - Backoff is `max(retryAfter, 30 s × 2^attempt)`.
- `openRun({ privateDir, date, resume }) → Run`, where:
  - `Run` is `{ dir, state, save(), writePageAtomic(slug, files: Record<ext, string>) }`;
  - `state` is `{ runDate, robotsSha256, sitemapSha256, pages: Record<path, PageState> }`;
  - `PageState` is `{ status: 'pending'|'done'|'failed'|'skipped'|'redirect', attempts, reason?, finalPath?, slug?, textChars?, jsonCount? }`.

- [ ] **Step 1: Write failing tests (key assertions):**
  - robots: given the fixture with the live rules recorded in the terms report (`Disallow: /archive`, `Disallow: /search.html`, `Disallow: /*?*q=`, `Disallow: /*?*utm_source=`):
    - `isAllowed(r,'/components/buttons/overview') === true`;
    - `isAllowed(r,'/archive/x') === false`;
    - `isAllowed(r,'/components?q=a') === false`;
    - `isAllowed(r,'/components?x=1&faq=2') === false`, because the wildcard also matches `faq=`;
    - `isAllowed(r,'/components?utm_source=x') === false`;
    - `Allow: /archive/ok` beats `Disallow: /archive` for `/archive/ok`.
  - sitemap: the index fixture yields child sitemap URLs; the urlset fixture yields 5 URLs.
  - classify: `/components/split-button/overview` is in scope with section `components`; `/blog/m3-expressive-launch` is in scope with `expressiveUrl: true`; `/develop/web` is out of scope.
  - slug: `slugFor('/Components/Buttons')` ≠ `slugFor('/components/buttons')`, and both match `/^[a-z0-9_-]+~[0-9a-f]{8}$/`.
  - pacer (fake clock):
    - two `wait()` calls are ≥ 3000 ms apart;
    - with `crawlDelaySec: 10` they are 10000 ms apart;
    - `createPacer({minDelayMs: 1000})` throws "minimum delay is 3000 ms".
  - state, Review Focus 2: kill between the files of a page by making `writePageAtomic` throw midway through a test hook. The page stays `pending`, and no `pages/<slug>.*` file exists, because files are written to `pages/.tmp-<slug>/` and renamed together.
  - state: `openRun` refuses an output dir that does not resolve under `privateDir`, throwing "scraper writes only to private/".
- [ ] **Step 2: Run and confirm they fail.** `node --test tools/extract/scrape/test/core.test.mjs`. Expected: FAIL (modules missing).
- [ ] **Step 3: Implement the five modules with the signatures above.**
  - Write `state.json` via a temp file plus rename.
  - Page files land in `pages/<slug>.{txt,json,images.json}`.
- [ ] **Step 4: Run and confirm they pass.** Expected: PASS.
- [ ] **Step 5: Commit, PR and merge.** Commit message: `feat(extract): scraper core (robots, sitemap, pacing, resumable state)`.

---

### Task 4: Browser capture (Playwright)

**Files:**
- Create: `tools/extract/scrape/capture.mjs`; `tools/extract/scrape/test/capture.test.mjs`; `tools/extract/scrape/test/fixtures/site/` (`index.html`, `app.js`, `_dsm/page.json`, `img.png`)
- Modify: `package.json` (devDependency `playwright`, exact version, resolved at implementation and recorded in the lock); `package-lock.json`; `tools/toolchain/env.ps1` (`$env:npm_config_cache = <root>\npm-cache`); `tools/toolchain/README.md`

**Interfaces:**
- Produces: `capturePage(browserContext, url: string, { isAllowedUrl: (u: URL) => boolean, origin: string }) → Promise<CaptureResult>`.
  - `CaptureResult` is `{ finalUrl, httpStatus, text, json: Array<{ url, status, body }>, images: Array<{ src, alt }>, thirdPartyHosts: string[], tabLinks: string[], expanded: number }`.
  - `tabLinks` holds the same-origin paths of the page's tab navigation (links that share the page's component prefix, e.g. `/components/buttons/*`). Task 5 uses them for per-component tab coverage.
  - **Expansion before reading text, all inside `main` only:**
    - open every closed `details`;
    - click every `[role=tab]` that is not selected, and every `button[aria-expanded="false"]`;
    - wait for the network to go idle after each click, at most 5 s.
    - It never clicks links (`a[href]`), form controls or submit buttons.
    - The text is collected after every click and de-duplicated, so content from every in-page tab is kept. JSON loaded by clicks is captured too.
  - `expanded` is the number of elements opened or clicked.
- Produces: `userAgentFor(browser) → Promise<string>`, which is the default UA of a fresh context plus the exact suffix ` m3-forge (+https://github.com/ReL4xi0n/m3-forge)`.
- Produces: `validateCapture(r: CaptureResult, { minTextChars = 200 }) → { ok: boolean, flags: string[] }`.
  - Flags: `text-short`, `json-none`, `http-<code>`.
- Produces: `newContext(browser) → BrowserContext`, with routing installed:
  - abort resource types `image`, `media`, `font`;
  - abort hosts matching `/(^|\.)(google-analytics|googletagmanager|doubleclick)\.(com|net)$/`;
  - abort same-origin requests that `isAllowedUrl` rejects (robots);
  - no stored cookies.
- `capture.mjs` is the only module that imports `playwright`, via dynamic `import()`, so `npm test` works without it installed.

- [ ] **Step 1: Write failing tests.** The capture tests run only when `playwright` and its Chromium are installed; otherwise they are skipped with the reason "playwright not installed (run in the toolchain env)". CI skips them; local runs must execute them.
  - Fixture server (`node:http`, ephemeral port). `app.js` fetches `/_dsm/page.json` and renders its text into `<main>`; the page also has `<img src="img.png" alt="diagram">` and a request to `/search.html?q=x`.
  - Assertions:
    - `r.json[0].url` ends with `/_dsm/page.json`;
    - `r.text` includes the rendered string;
    - `r.images` deep-equals `[{src:'img.png' (absolute), alt:'diagram'}]`;
    - the server log contains no `GET /img.png` and no `/search.html` request;
    - expansion:
      - text inside a closed `<details>` is in `r.text`;
      - text revealed by an `aria-expanded="false"` button is in `r.text`;
      - text of a second `[role=tab]` panel, loaded on click from `/_dsm/tab2.json`, is in `r.text`, and that JSON is in `r.json`;
      - an `<a href="/elsewhere">` inside `main` is never requested;
      - `r.expanded >= 3`;
    - `r.tabLinks` deep-equals the fixture's tab bar paths;
    - the request header `user-agent` seen by the server ends with ` m3-forge (+https://github.com/ReL4xi0n/m3-forge)` and starts with the browser's default UA.
  - Pure tests (always run): `validateCapture` on a 50-character text returns `{ ok:false, flags:['text-short'] }`; on an empty `json` it returns the flag `json-none` with `ok:true` (flagged, not failed).
- [ ] **Step 2: Install Playwright into the toolchain folder and confirm the tests fail.**
  - Dot-source `env.ps1`, which sets `PLAYWRIGHT_BROWSERS_PATH` and `npm_config_cache`, then run `npm install --save-dev --save-exact playwright@<latest stable>` and `npx playwright install chromium`.
  - Run `node --test tools/extract/scrape/test/capture.test.mjs`. Expected: FAIL (module missing).
- [ ] **Step 3: Implement `capture.mjs`.**
  - Navigate with `waitUntil: 'networkidle'` and a 45 s timeout.
  - Collect `response` events for same-origin JSON (by `content-type`).
  - Text is `main.innerText`, falling back to `body.innerText`.
  - Images: all `img` elements' `src` (absolute) and `alt`.
  - `thirdPartyHosts`: the set of other origins requested.
- [ ] **Step 4: Run tests, then the snapshot check.**
  - `node --test` must pass, with the capture tests executed locally.
  - Run `tools\toolchain\snapshot-system.ps1 -Out out\snapshot-p1.json` and `check.ps1 -Before out\snapshot-before.json -After out\snapshot-p1.json`. The only new entry allowed is `.m3-toolchain`.
- [ ] **Step 5: Commit, PR and merge.** Commit message: `feat(extract): Playwright page capture with resource blocking`.

---

### Task 5: Scrape CLI, resume and coverage

**Files:**
- Create: `tools/extract/scrape/coverage.mjs`, `tools/extract/scrape/run.mjs`, `tools/extract/scrape/test/run.test.mjs`, `knowledge/coverage-exceptions.json` (`{}`)
- Modify: `package.json`, adding the script `"extract:scrape": "node tools/extract/scrape/run.mjs"`

**Interfaces:**
- Consumes: Task 3 modules and `capturePage`/`validateCapture`/`newContext`.
- Produces: `computeCoverage(state, plan, exceptions) → Coverage`.
  - `Coverage` has these fields:
    - `{ sitemapTotal, inScope, expressive: { url: n, content: n } }`;
    - `{ done, redirects, skippedRobots, failed, missing: string[], unjustified: string[] }`;
    - `{ jsonNone: string[], rows: CoverageRow[] }`.
  - `CoverageRow` is `{ path, section, expressive: 'url'|'content'|'-', status, finalPath?, json: n, reason? }`.
  - A page is `content`-Expressive when its saved text contains `expressive` (case-insensitive) and it was not already URL-flagged.
- Produces: `renderCoverageMd(c: Coverage) → string`, written to `knowledge/coverage.md`, plus `knowledge/coverage.json`, which holds the same `rows` and counts. CI and the Task 11 linter read the JSON, because CI has no `private/`.
  - Both files contain only paths, sections, flags, statuses and counts; no page text and no titles.
- The CLI has three subcommands:
  - `run.mjs plan`: robots + sitemap, then `meta/plan.json`;
  - `run.mjs scrape [--resume]`;
  - `run.mjs coverage [--check]`. It exits 1 if `unjustified.length > 0`. With `--check`, it also fails when `knowledge/coverage.md` is stale.
- Exceptions file shape: `{ "<path>": { "kind": "robots"|"http-404"|"redirect-out-of-scope"|"duplicate-of"|"owner-excluded", "detail": string (≥ 10 chars) } }`.
- **Per-component tab coverage.** `Coverage` also has `components: Array<{ component, tabsOnSite: string[], tabsScraped: string[], missingTabs: string[] }>`.
  - A component is the second segment of a `/components/<name>/<tab>` path.
  - `tabsOnSite` is the union of the sitemap paths under that prefix and every `tabLinks` captured on any of its pages.
  - A tab found only through `tabLinks` (not in the sitemap) is added to the plan and scraped. It is not silently ignored.
  - `missingTabs` entries count as `missing` and need an exception like any page.
  - `coverage.md` renders a table with columns: component | Overview | Specs | Guidelines | Accessibility | other tabs | expanded elements. Each cell is ✓, ✗ (+reason) or "—" (tab not on site).

- [ ] **Step 1: Write failing tests.** These are pure; they use a fake `capturePage` injected through `run.mjs`'s exported `scrape({ capture, pacer, run, plan })`.
  - Resume (Review Focus 2):
    - The first `scrape` processes 2 of 4 pages, then throws.
    - A second `scrape` with `resume` captures only the remaining 2; the fake capture's call count is 2.
    - `failed` pages with `attempts < 3` are retried.
  - Redirect (Review Focus 3): `/a` redirects to `/b` and both are in the plan. `/a` gets `status: 'redirect', finalPath: '/b'`, it is not in `missing`, and `/b` is counted once.
  - Coverage:
    - an unjustified failed page makes `coverage` exit 1;
    - adding an exception with `kind: 'http-404'` and a 10+ character detail makes it exit 0;
    - an exception whose detail has fewer than 10 characters throws.
  - Review Focus 1: a capture with `text-short` is stored as `failed` with reason `text-short`, never as `done`. `json-none` pages are `done`, but they are listed in `jsonNone` and rendered in their own section of `coverage.md`.
  - Robots: a plan URL disallowed by robots becomes `skipped` with reason `robots`, and it counts as justified automatically, without an exceptions entry.
  - No sitemap: `plan` with no `Sitemap:` line and a 404 on `/sitemap.xml` exits 3 with "no sitemap found: stop and ask the owner".
  - Tabs:
    - sitemap has `/components/chips/overview` and `/components/chips/specs`, and the captured `tabLinks` add `/components/chips/guidelines`. The guidelines tab is scraped in the same run, and the chips row shows all three tabs as ✓;
    - if that tab then fails, `missingTabs` is `['/components/chips/guidelines']` and coverage exits 1.
- [ ] **Step 2: Run and confirm they fail.** `node --test tools/extract/scrape/test/run.test.mjs`.
- [ ] **Step 3: Implement `coverage.mjs` and `run.mjs`.**
  - `plan` writes `meta/robots.txt`, `meta/sitemap*.xml` and `meta/plan.json` (all URLs with `classify` results), and records the SHA-256 of robots and sitemaps in state.
  - Before scraping, `scrape` refetches robots.txt. If its SHA-256 changed since `plan`, it stops with "robots.txt changed since plan: review and re-plan".
  - Pages run sequentially through `pacer.wait()`; on HTTP 429/503 it calls `pacer.backoff`.
  - It writes `meta/run.json`: Playwright version, user agent string, start/end, counts and the union of `thirdPartyHosts`.
- [ ] **Step 4: Run and confirm they pass.** `node --test` must be all green.
- [ ] **Step 5: Commit, PR and merge.** Commit message: `feat(extract): scrape CLI with resume and coverage report`.

---

### Task 6: Run the scrape (private) and prove coverage

**Files:**
- Private repo: `private/raw/<YYYY-MM-DD>/**`
- Public: `knowledge/coverage.md`, `knowledge/coverage.json`, `knowledge/coverage-exceptions.json`

- [ ] **Step 1: Plan.** `node tools/extract/scrape/run.mjs plan`. Report these counts to the session log: sitemap total, in scope per section, Expressive by URL.
- [ ] **Step 2: Scrape.** `node tools/extract/scrape/run.mjs scrape`, in the background. If it is interrupted, run it again with `--resume` until no page is `pending`.
- [ ] **Step 3: Coverage.**
  - Run `node tools/extract/scrape/run.mjs coverage`.
  - For each remaining page, investigate and either re-run it or add a justified exception. An exception's `detail` must state what was observed, for example "HTTP 404 on 2026-11-14 at 10:12 and again at 10:20".
  - Repeat until the command exits 0, which means unjustified = 0.
- [ ] **Step 4: Private commit.**
  - In `private/`, run `git add raw/<date>` and `git commit -m "raw: m3 site <date>"`, using the noreply email.
  - Check that `git -C private log -1 --format='%ae %ce'` shows the noreply address, then push.
- [ ] **Step 5: Corpus check.**
  - Run `node tools/guard/check-public-diff.mjs --all-tracked`.
  - It must print a corpus build (first run) and pass. Record the corpus build time and the shingle count for the evidence.
- [ ] **Step 6: Public commit, PR and merge.** Commit `knowledge/coverage.md` and the exceptions with the message `docs(knowledge): site coverage <date>`.

---

### Task 7: Pin and fetch token sources

**Files:**
- Create: `tools/extract/sources/lock.mjs`, `tools/extract/sources/fetch.mjs`, `tools/extract/sources/test/lock.test.mjs`, `knowledge/sources.lock.json`
- Modify: `package.json`, adding the script `"extract:sources": "node tools/extract/sources/fetch.mjs"`

**Interfaces:**
- Produces a `Lock` JSON with this shape:

```json
{ "schemaVersion": 1, "resolvedOn": "YYYY-MM-DD", "sources": [
  { "id": "material-web", "type": "git", "repo": "https://github.com/material-components/material-web.git",
    "ref": "<branch or tag resolved>", "commit": "<40 hex>", "paths": ["tokens/versions/latest"], "license": "Apache-2.0" },
  { "id": "material-color-utilities", "type": "archive", "name": "@material/material-color-utilities", "version": "0.4.0",
    "url": "<registry tarball>", "sha256": "<64 hex>", "license": "Apache-2.0" },
  { "id": "material-components-android", "type": "git", "ref": "<latest stable release tag>", "commit": "…", "paths": ["…tokens.xml paths found"] },
  { "id": "material_ui", "type": "git|archive", "version": "<pub version>", "…": "commit or sha256", "paths": ["…"] },
  { "id": "compose-material3", "type": "archive", "version": "1.5.0-rc01",
    "url": "https://dl.google.com/android/maven2/androidx/compose/material3/material3-android/1.5.0-rc01/material3-android-1.5.0-rc01-sources.jar",
    "sha256": "<64 hex>" } ] }
```

- Produces `validateLock(lock) → string[]` and `verifySource(entry, dir) → Promise<void>`:
  - git entries: `rev-parse HEAD` must equal `commit`;
  - archive entries: the archive's SHA-256 must equal `sha256`.
- Produces `sourceDir(id) → string`, the path `%USERPROFILE%\.m3-toolchain\sources\<id>`.
- The two modes:
  - `fetch.mjs --resolve` resolves current refs and versions and writes the lock;
  - `fetch.mjs` fetches exactly what the lock says and verifies it.
- material_ui needs a decision recorded in the lock:
  - use the material_ui git repository at the tag for its pub version, which must contain machine-readable token data (gen_defaults `*.json`);
  - if that data does not exist at that tag, **STOP and ask the owner**. Do not substitute another source silently.

- [ ] **Step 1: Write failing tests.**
  - `validateLock` rejects a missing commit or sha256, a non-40-hex commit, and a Compose version other than `1.5.0-rc01`.
  - `verifySource` passes on a local bare-repo fixture at the pinned commit and fails after an extra commit is checked out.
  - An archive fixture over a `file://` URL passes; with one byte changed it fails with "sha256 mismatch".
- [ ] **Step 2: Run and confirm they fail.** `node --test tools/extract/sources/test/lock.test.mjs`.
- [ ] **Step 3: Implement.**
  - git sources: `git clone --filter=blob:none --no-checkout`, sparse-checkout of `paths`, then check out `commit`.
  - archives: `curl.exe -fL`, then SHA-256, then extract with `tar.exe` into `sourceDir(id)`.
- [ ] **Step 4: Resolve and fetch for real.**
  - Run `node tools/extract/sources/fetch.mjs --resolve` and then `node tools/extract/sources/fetch.mjs`. Both must exit 0.
  - Rerun the snapshot check; only `.m3-toolchain` may be new.
- [ ] **Step 5: Commit, PR and merge.** Commit message: `feat(extract): pinned token sources (sources.lock.json)`.

---

### Task 8: Token model, material-web and Compose extractors

**Files:**
- Create: `tools/extract/tokens/{model,web,compose}.mjs`, `tools/extract/tokens/aliases.json`, `tools/extract/tokens/test/{model,web,compose}.test.mjs`, plus small invented fixtures in each source's format

**Interfaces:**
- Produces the `TokenRecord` type:
  - `{ id: string|null, native: string, source: SourceId, file: string, line: number, kind: 'ref'|'sys'|'comp', mode?: 'light'|'dark', value: Value, raw: string }`.
  - `SourceId` is one of `'material-web'|'compose-material3'|'material-components-android'|'material_ui'|'material-color-utilities'`.
  - `Value` is one of:
    - `{dp:number}`, `{ms:number}`, `{number:number}`;
    - `{hex:'#rrggbbaa'}`, `{ref:string}`;
    - `{easing:[n,n,n,n]}`, `{spring:{stiffness:number,dampingRatio:number}}`;
    - `{string:string}`, `{unparsed:string}`.
- Produces `normalizeValue(raw: string, source: SourceId) → Value`. The rules:
  - `40px`, `40dp` and `40.0.dp` become `{dp:40}`;
  - `200ms` and `200L` (Compose duration) become `{ms:200}`;
  - `0.38` / `0.38f` becomes `{number:0.38}`;
  - `#RGB`, `#RRGGBB`, `#RRGGBBAA` and `Color(0xAARRGGBB)` become `{hex}`, lowercase with alpha;
  - `cubic-bezier(a,b,c,d)` and `CubicBezierEasing(a,b,c,d)` become `{easing}`;
  - a token reference becomes `{ref: canonical id}`;
  - anything else becomes `{unparsed: raw}`.
  - Numbers are parsed exactly as written: no rounding, no unit conversion other than px↔dp, which are the same in M3 tokens and noted in `knowledge/README.md`.
- Produces `canonicalId(kind, set, prop) → string`, in the form `md.<kind>.<set>.<prop>`. `set` and `prop` are kebab-case; this is material-web's naming.
- Produces `buildIndex(records: TokenRecord[]) → Map<string, TokenRecord>`. It is keyed by `id + (mode ? '@'+mode : '')`. It throws `canonical id collision in <source>: <native A> and <native B> -> <id>` on duplicates (Review Focus 4).
- Produces `extractWeb(dir) → TokenRecord[]`: the Sass maps in `tokens/versions/latest/{ref,sys,comp}/_md-*.scss`, with keys such as `'container-height'` inside each map.
- Produces `extractCompose(dir) → TokenRecord[]`: `androidx/compose/material3/tokens/*Tokens.kt` objects.
  - `FilledButtonTokens.ContainerHeight` maps to set `filled-button`, prop `container-height`.
  - `ColorLightTokens` and `ColorDarkTokens` map to sys color with `mode`.
  - Spring values come from the motion tokens objects.
- `aliases.json` has the shape `{ "<source>": { "<native set>": { "set": "<canonical set>", "why": "<≥ 10 chars>" } } }`. It starts empty. An entry is added only with a stated reason, and every entry is listed in the phase evidence.

- [ ] **Step 1: Write failing tests (key assertions):**
  - normalize (Review Focus 5):
    - `normalizeValue('40px','material-web')` deep-equals `{dp:40}`;
    - `normalizeValue('40.0.dp','compose-material3')` deep-equals `{dp:40}`;
    - `normalizeValue('Color(0xFF6750A4)', …)` deep-equals `{hex:'#6750a4ff'}`;
    - `normalizeValue('calc(1px + 2px)', …)` deep-equals `{unparsed:'calc(1px + 2px)'}`;
    - `normalizeValue('0.38', …)` deep-equals `{number:0.38}`.
  - collision: two records from one source with the same id cause `buildIndex` to throw with both native names in the message.
  - web fixture: `_md-comp-filled-button.scss` with `'container-height': 40px` and `'container-color': map.get($deps,'md-sys-color','primary')` yields `{id:'md.comp.filled-button.container-height', value:{dp:40}, line:<n>}` and `{value:{ref:'md.sys.color.primary'}}`.
  - compose fixture: `internal object FilledButtonTokens { val ContainerHeight = 40.0.dp; val ContainerColor = ColorSchemeKeyTokens.Primary }` yields the same two ids and values.
- [ ] **Step 2: Run and confirm they fail.** `node --test tools/extract/tokens/test`.
- [ ] **Step 3: Implement `model.mjs`, `web.mjs` and `compose.mjs` to the signatures above.** Records keep `file` relative to the source root, plus the 1-based `line`.
- [ ] **Step 4: Run and confirm they pass.** Then run both extractors on the fetched sources through a temporary script, and confirm `buildIndex` does not throw and there are 0 `id: null` records. If there are null ids, add `aliases.json` entries with reasons, or keep the records and list them in the report.
- [ ] **Step 5: Commit, PR and merge.** Commit message: `feat(extract): token model, material-web and Compose extractors`.

---

### Task 9: MDC-Android, Flutter material_ui and color-utilities extractors

**Files:**
- Create: `tools/extract/tokens/{mdc,flutter,mcu}.mjs`, with tests and fixtures in `tools/extract/tokens/test/`

**Interfaces:**
- Consumes `normalizeValue`, `canonicalId` and `aliases.json` from Task 8.
- Produces `extractMdc(dir) → TokenRecord[]`.
  - It reads `<item name="m3_comp_…">` / `<dimen>` / `<color>` / `<integer>` entries in the locked `tokens.xml` paths.
  - Snake-case names are split into set and prop by the **longest known canonical set name**: material-web's set names plus aliases. With no match, `id: null`.
- Produces `extractFlutter(dir) → TokenRecord[]`.
  - It reads the locked gen_defaults data `*.json`. Keys like `md.comp.filled-button.container.height` become set `filled-button`, prop `container-height`.
  - Spring constants come from the `Springs` source file: stiffness and damping ratio, exactly as written.
- Produces `extractMcu(dir) → ColorSystem`, where `ColorSystem` is `{ variants: string[], roles: string[], specVersions: string[], defaultVariantEvidence: Array<{file, line, text}> }`.
  - `roles` are the dynamic color names. `defaultVariantEvidence` is every place a default variant is set or documented. Nothing is inferred.

- [ ] **Step 1: Write failing tests.**
  - MDC: `m3_comp_filled_button_container_height` = `40dp` maps to `md.comp.filled-button.container-height` `{dp:40}`. An unknown set gives `id: null`, not a guessed split.
  - Flutter: the JSON fixture `{"md.comp.filled-button.container.height": 40.0, "md.comp.filled-button.container.color": "primary"}` gives `{dp:40}` and `{ref:'md.sys.color.primary'}`. The value-to-ref rule follows the gen_defaults data format, which is verified against one real file before it is written into code.
  - MCU: the fixture `Variant` enum gives variant names exactly as written, and roles from the `MaterialDynamicColors` fixture.
- [ ] **Step 2: Run and confirm they fail.**
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run and confirm they pass, then run on the real sources.**
- [ ] **Step 5: Commit, PR and merge.** Commit message: `feat(extract): MDC-Android, Flutter material_ui and color-utilities extractors`.

---

### Task 10: Merge, conflicts, NOT FOUND and counts

**Files:**
- Create: `tools/extract/tokens/merge.mjs`, `tools/extract/tokens/report.mjs`, `tools/extract/tokens/test/merge.test.mjs`
- Generated and committed: `knowledge/tokens/{material-web,compose-material3,material-components-android,material_ui}.json`, `knowledge/tokens/color-system.json`, `knowledge/tokens/merged.json`, `knowledge/tokens/summary.json`, `knowledge/conflicts.md`, `knowledge/not-found.md`
- Modify: `package.json` (`"extract:tokens": "node tools/extract/tokens/report.mjs"`); `.github/workflows/ci.yml` (step `node tools/extract/tokens/report.mjs --check`, which uses only the committed `knowledge/tokens/*.json`)

**Interfaces:**
- Platforms are `web` (material-web), `flutter` (material_ui) and `compose` (compose-material3). `android-views` (MDC) is a cross-check only, not a target platform.
- Consumes `SiteValue`, which is `{ page: string, token?: string, value: Value, note: string, line: number }`. Task 11's linter produces it in `knowledge/site-values.json`. Until Task 11 exists, `report.mjs` reads that file if present and otherwise uses `[]`.
- Produces `merge(bySource: Record<SourceId, TokenRecord[]>, siteValues: SiteValue[]) → MergeResult`.
  - `MergeResult` is `{ merged: MergedToken[], conflicts: Conflict[], notFound: Record<Platform, NotFoundEntry[]>, unparsed: TokenRecord[], unmapped: TokenRecord[] }`.
  - `MergedToken` is `{ id, mode?, canonical: Value|'NOT FOUND', perPlatform: Record<Platform, Value|'NOT FOUND'>, crossCheck: { 'android-views': Value|'NOT FOUND' }, provenance: Record<Platform|'canonical'|'android-views', {source,file,line}|null> }`.
  - `canonical` is the material-web value. `perPlatform[p]` is the value from p's own source.
  - `Conflict` is `{ id, mode?, kind: 'repo-vs-repo'|'site-vs-repo', values: Array<{ where, value }>, winner: string }`.
    - For repo-vs-repo, the platform's own value wins on that platform and the canonical value is material-web.
    - For site-vs-repo, the repo wins.
  - `NotFoundEntry` is `{ id, mode?, component: string, availableIn: SourceId[] }`.
    - It covers every comp/sys id present in any source but absent in this platform's source.
    - Components absent entirely are collapsed to one entry with `id: '<set>.*'`.
- Values are compared by deep equality of the normalized `Value`. There is no tolerance: `{dp:40}` ≠ `{dp:40.5}`.
- `report.mjs` writes all generated files deterministically: sorted keys, `\n` line endings. With `--check`, it exits 1 if any committed file differs from what it would write.
- `summary.json` holds counts:
  - per source: records, mapped, unmapped, unparsed;
  - per kind;
  - per platform: NOT FOUND count and conflicts count;
  - totals.
- `not-found.md` has one section per platform (web, flutter, compose), then "unparsed values" and "unmapped native names".
- `conflicts.md` has sections "repo vs repo" (per platform pair) and "site vs repo".

- [ ] **Step 1: Write failing tests.**
  - Precedence:
    - web `{dp:40}` and compose `{dp:48}` for the same id give `perPlatform.compose = {dp:48}` and `canonical = {dp:40}`;
    - one `repo-vs-repo` conflict, listing both values.
  - NOT FOUND: an id present in web and compose but not in material_ui appears in `notFound.flutter` with `availableIn: ['compose-material3','material-web']`. `perPlatform.flutter === 'NOT FOUND'`; the string is exact.
  - Site: a `siteValues` entry `{ page:'/components/buttons/specs', token:'md.comp.filled-button.container-height', value:{dp:42} }` against repo `{dp:40}` gives a `site-vs-repo` conflict with `winner: 'material-web'`.
  - Determinism: running `report` twice produces byte-identical files; `--check` passes on fresh output and fails after a one-character edit.
- [ ] **Step 2: Run and confirm they fail.**
- [ ] **Step 3: Implement `merge.mjs` and `report.mjs`.**
- [ ] **Step 4: Run, generate, and check.**
  - Run `npm run extract:tokens`, then `node tools/extract/tokens/report.mjs --check`; it must exit 0.
  - Run `node --test`; it must be all green.
- [ ] **Step 5: Commit, PR and merge.** Commit message: `feat(knowledge): extracted tokens, conflicts and NOT FOUND lists`.

---

### Task 11: Knowledge note linter

**Files:**
- Create: `tools/extract/knowledge/lint.mjs`, `tools/extract/knowledge/test/lint.test.mjs`, `knowledge/README.md`
- Modify: `package.json` (`"knowledge:lint": "node tools/extract/knowledge/lint.mjs"`); `.github/workflows/ci.yml` (step `node tools/extract/knowledge/lint.mjs --check`)

**Interfaces:**
- A note is `knowledge/guidance/**/*.md` with this front matter:

```yaml
---
title: Buttons
kind: component        # style | foundation | component | expressive
pages: [/components/buttons/overview, /components/buttons/specs]
tokenSets: [filled-button, outlined-button]
expressive: true
fetched: 2026-11-14   # raw run date
---
```

- Required `##` sections:
  - for `component`: `Summary`, `Use it when`, `Anatomy`, `Variants`, `Expressive`, `States and behavior`, `Measurements`, `Accessibility`, `Platform mapping`, `Pitfalls`;
  - for `style` and `foundation`: `Summary`, `Rules`, `Measurements`, `Accessibility`, `Platform mapping`, `Pitfalls`.
  - A section may say "Not covered by the sources." but may not be empty.
- **Provenance markers.** Every number with a unit (`/\b\d+(\.\d+)?\s?(dp|px|sp|ms|%)\b/`), and every hex color, must carry on the same line one of:
  - `[token:<id>]`: the id must exist in `merged.json`, and the number must equal that token's canonical or a per-platform value;
  - `[site:<path>]`: the path must be a `done` row in `knowledge/coverage.json`. If a token exists for the same property, the line must also carry `[token:<id>]`, and a mismatch becomes a site-vs-repo conflict, not an error;
  - `[NOT FOUND]`.
- Produces `lintNotes(notesDir, { merged, coverage }) → { errors: string[], siteValues: SiteValue[] }`.
  - `SiteValue` is `{ page, token?, value: Value, note, line }`.
  - The CLI writes `knowledge/site-values.json`. With `--check`, it exits 1 on errors or when the file is stale.
- Coverage rule: every in-scope `done` page path appears in at least one note's `pages`. Exceptions go in `knowledge/coverage-exceptions.json` with `kind: 'owner-excluded'`.

- [ ] **Step 1: Write failing tests.**
  - A line `Height is 40dp.` with no marker gives the error `<file>:<line>: number without provenance marker`.
  - `Height is 40dp [token:md.comp.filled-button.container-height].`, with merged value `{dp:40}`, is ok.
  - The same line with `48dp` gives the error `value 48dp does not match token md.comp.filled-button.container-height`. This is the anti-guessing check.
  - `Height is 42dp [site:/components/buttons/specs] [token:md.comp.filled-button.container-height].` is ok, and `siteValues` contains `{token, value:{dp:42}}`.
  - Missing `## Measurements` in a component note gives an error.
  - An in-scope page cited by no note gives the error `page not covered by any note: <path>`.
- [ ] **Step 2: Run and confirm they fail.**
- [ ] **Step 3: Implement.**
  - Also write `knowledge/README.md`, covering:
    - layout;
    - the markers;
    - px↔dp equivalence;
    - precedence;
    - the attribution line (CC BY 4.0, paraphrased and changed);
    - "numbers are never guessed".
- [ ] **Step 4: Run and confirm they pass.**
- [ ] **Step 5: Commit, PR and merge.** Commit message: `feat(knowledge): note linter with provenance markers`.

---

### Task 12: Pilot note group (buttons family) — then STOP

**Files:**
- Create: `knowledge/guidance/components/*.md`, one note per member of the buttons family in coverage (e.g. buttons, icon buttons, FAB, extended FAB, button groups, split button, FAB menu: whatever the site groups there); `tools/extract/scrape/capture-specs.mjs`; `tools/extract/scrape/test/capture-specs.test.mjs`
- Private: `private/reference-screenshots/<YYYY-MM-DD>/<slug>.png` (only if needed)

**Interfaces:**
- Produces `capture-specs.mjs --pages <path…>`. It uses the same robots check, pacer and user agent, and allows images, but analytics stay blocked.
  - It writes full-page PNGs only under `private/reference-screenshots/<date>/`, and refuses any other directory.
- Policy: a number may be read from a screenshot only if it is printed as a label in the image. It is then recorded as `[site:<path>]` and listed in `site-values.json`. Pixel measuring is never used.
- This group fixes the template that Tasks 13–14 copy: section depth, length, marker density, platform-mapping format.

- [ ] **Step 1: Write failing tests for `capture-specs.mjs`.**
  - It refuses `--out docs/images`.
  - With the fixture server, it writes `<slug>.png` under the private screenshot dir.
  - A robots-disallowed path is skipped.
- [ ] **Step 2: Run, fail, implement, then pass.**
- [ ] **Step 3: Write the buttons-family notes myself (no subagents).**
  - Read the private raw text for each page (all tabs, including expanded content), close it, and write from understanding in the Task 11 sections.
  - Every number gets a marker.
- [ ] **Step 4: Gate.**
  - Run `node tools/extract/knowledge/lint.mjs`; it must exit 0.
  - Run `npm run extract:tokens`, which picks up new site values.
  - Stage the notes and run `node tools/guard/check-public-diff.mjs --staged`; it must show no `raw-overlap`.
- [ ] **Step 5: Commit, PR and merge.** Commit message: `docs(knowledge): buttons family guidance (pilot)`.
- [ ] **Step 6: STOP.**
  - Show the owner one note in full, plus the list of the group's notes with line counts, marker counts and new conflicts or NOT FOUND entries.
  - Wait for approval of format and depth. Apply the owner's corrections to the pilot notes and to `knowledge/README.md` (template section) before Task 13.

---

### Task 13: Distill styles, foundations and the Expressive overview (parallel subagents)

**Files:**
- Create: `knowledge/guidance/styles/*.md` (color, typography, shape, elevation, motion, icons, plus any other Styles section in coverage), `knowledge/guidance/foundations/*.md` (one per Foundations topic in coverage), `knowledge/guidance/expressive.md`
- Regenerate: `knowledge/site-values.json`, `knowledge/conflicts.md`

**Interfaces:** The note schema and markers from Task 11. Site numbers flow into conflicts through Task 10's `merge(…, siteValues)`.

- [ ] **Step 1: Default color variant per style (spec §8).**
  - In `styles/color.md`, add a `Default variant per style` table: style (M3, M3 Expressive) → variant, with a provenance marker per row. Sources: `color-system.json` `defaultVariantEvidence`, the Compose/Flutter theme code, and the site pages.
  - If the sources disagree, add an entry to `conflicts.md`. If none states it, write `[NOT FOUND]` and add a NOT FOUND entry. Never assume.
- [ ] **Step 2: Write the notes for one topic group at a time, with parallel writer subagents.**
  - Each subagent gets:
    - one topic group;
    - the approved pilot template (`knowledge/README.md` plus one pilot note as the example);
    - the private raw paths for its pages;
    - the token ids for its sets;
    - the rules: own words, markers, never guess.
  - Each writes only its own files and does not commit.
  - I review every returned note before the gate.
  - Expressive-specific guidance goes in the topic's note and is summarized in `expressive.md`.
- [ ] **Step 3: Gate after each group.**
  - Run `node tools/extract/knowledge/lint.mjs`; it must exit 0.
  - Run `npm run extract:tokens`, which picks up new site values.
  - Stage the files, then run `node tools/guard/check-public-diff.mjs --staged`. It must show no `raw-overlap`. On a hit, rewrite the sentence; never allowlist guidance text.
- [ ] **Step 4: Commit per group, then PR and merge.** Commit message: `docs(knowledge): <group> guidance`.

---

### Task 14: Distill the remaining components (parallel subagents)

**Files:**
- Create: `knowledge/guidance/components/<component>.md`, one per remaining component page group in coverage
- Private: `private/reference-screenshots/<YYYY-MM-DD>/<slug>.png` (via Task 12's `capture-specs.mjs`)

- [ ] **Step 1: Dispatch writer subagents in batches of about 6 components.** Use the same briefing and per-batch gates as Task 13 (lint, `extract:tokens`, guard).
  - `Platform mapping` names the official API per platform: Compose 1.5.0-rc01 composable, `material_ui` widget, web (our CSS component, Phase 3). Where a platform lacks the component, the note says so and refers to the NOT FOUND entry.
- [ ] **Step 2: Review every note, then gate the batch.**
- [ ] **Step 3: Commit any screenshots to the private repo.** Use the commit message "screenshots: <date>" and the noreply email.
- [ ] **Step 4: Public commits per batch, then PR and merge.**

---

### Task 15: Phase 1 verification and evidence — then STOP

- [ ] **Step 1: Run the full checks on `main`.**
  - `node --test`;
  - `node tools/ci/validate-plugin.mjs`;
  - `node tools/guard/check-public-diff.mjs --all-tracked`, with the corpus;
  - `node tools/guard/check-public-diff.mjs --commits <phase-1 start>..main`, with the corpus. This is the per-commit 12-word check over every Phase 1 commit;
  - `node tools/extract/scrape/run.mjs coverage --check`;
  - `node tools/extract/tokens/report.mjs --check`;
  - `node tools/extract/knowledge/lint.mjs --check`;
  - a noreply-email check over `origin/main` and the private repo;
  - the snapshot comparison.
  - Every one must exit 0.
- [ ] **Step 2: Negative proof.**
  - Stage a scratch file holding a 12-word run copied from `private/raw/<date>/pages/*.txt`, and show the guard blocks it with `raw-overlap`.
  - Stage a copy of a private screenshot under `docs/images/`, and show the guard blocks it with `private-copy`.
  - Unstage and delete both.
- [ ] **Step 3: Write the evidence summary for the owner, in Turkish.** It covers:
  - page counts: sitemap total, in scope per section, Expressive (URL / content), done, redirects, robots-skipped, failed, missing = 0 or each justified, JSON-none list;
  - the per-component tab coverage table from `coverage.md` (Overview / Specs / Guidelines / Accessibility / other, plus expanded-element counts);
  - token counts from `summary.json`, per source and per kind;
  - per-platform NOT FOUND counts, with links to `not-found.md`;
  - conflict counts by kind, with links to `conflicts.md`;
  - `sources.lock.json` contents: every source with its commit or version;
  - every `aliases.json` entry, with its reason;
  - the default color variant finding;
  - three component notes **in full**: buttons, split button (Expressive-only), and text fields;
  - CI links and the corpus size;
  - deviations and rulings.
- [ ] **Step 4: STOP and wait for owner approval.** After approval, write the Phase 2 plan.
