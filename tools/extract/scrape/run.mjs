#!/usr/bin/env node
// Site scrape CLI (run in the toolchain env). Writes only under private/raw/<YYYY-MM-DD>/.
//   run.mjs plan                         robots + sitemap -> meta/, state.json (new dated run)
//   run.mjs scrape [--date D] [--only p1,p2]   capture pending/failed pages (resumes the run)
//   run.mjs coverage [--date D] [--only p1,p2] [--check]
//        full run: writes knowledge/coverage.{md,json}; --only: writes meta/coverage-pilot.md
//        exit 1 if any missing page is unjustified (see knowledge/coverage-exceptions.json)
import { createHash } from 'node:crypto';
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseRobots, isAllowed } from './robots.mjs';
import { parseSitemap, classify } from './sitemap.mjs';
import { slugFor } from './slug.mjs';
import { writeJsonAtomic } from './state.mjs';
import { validateCapture } from './capture.mjs';
import { computeCoverage, renderCoverageMd } from './coverage.mjs';

export const ORIGIN = 'https://m3.material.io';
const sha256 = s => createHash('sha256').update(s).digest('hex');
const keyOf = u => { const x = new URL(u); return x.pathname + x.search; };

export async function planRun({ run, origin, fetchText, pacer = null }) {
  await pacer?.wait();
  const robotsRes = await fetchText(`${origin}/robots.txt`);
  const robotsText = robotsRes.status === 200 ? robotsRes.text : '';
  const robots = parseRobots(robotsText);
  await writeFile(join(run.dir, 'meta', 'robots.txt'), robotsText);

  const queue = robots.sitemaps.length ? [...robots.sitemaps] : [`${origin}/sitemap.xml`];
  const texts = [];
  const urls = [];
  while (queue.length) {
    const url = queue.shift();
    await pacer?.wait();
    const res = await fetchText(url);
    if (res.status !== 200) continue;
    texts.push(res.text);
    await writeFile(join(run.dir, 'meta', `sitemap-${texts.length}.xml`), res.text);
    const s = parseSitemap(res.text);
    urls.push(...s.urls);
    queue.push(...s.sitemaps);
  }
  if (!urls.length) {
    const e = new Error('no sitemap found: stop and ask the owner');
    e.exitCode = 3;
    throw e;
  }

  const entries = [...new Set(urls.map(keyOf))].map(path => ({ path, ...classify(path) }));
  run.state.robotsSha256 = sha256(robotsText);
  run.state.sitemapSha256 = sha256(texts.join('\n'));
  for (const e of entries.filter(x => x.inScope)) {
    const base = { attempts: 0, section: e.section, expressiveUrl: e.expressiveUrl };
    run.state.pages[e.path] = isAllowed(robots, e.path) ? { status: 'pending', ...base } : { status: 'skipped', reason: 'robots', ...base };
  }
  const plan = { origin, plannedAt: new Date().toISOString(), sitemapTotal: entries.length, urls: entries };
  await writeJsonAtomic(join(run.dir, 'meta', 'plan.json'), plan);
  await run.save();
  const bySection = {};
  for (const e of entries) bySection[e.inScope ? e.section : 'out'] = (bySection[e.inScope ? e.section : 'out'] || 0) + 1;
  return { sitemapTotal: entries.length, inScope: entries.filter(e => e.inScope).length, bySection, expressiveUrl: entries.filter(e => e.expressiveUrl).length };
}

function counts(pages) {
  const c = { done: 0, failed: 0, pending: 0, redirect: 0, skipped: 0 };
  for (const p of Object.values(pages)) c[p.status] = (c[p.status] || 0) + 1;
  return c;
}

export async function scrape({
  run, origin, fetchText, capture, pacer, only = null, stopOnError = false, maxAttempts = 3, userAgent = null, playwrightVersion = null,
}) {
  const robotsText = (await fetchText(`${origin}/robots.txt`)).text ?? '';
  if (sha256(robotsText) !== run.state.robotsSha256) throw new Error('robots.txt changed since plan: review and re-plan');
  const robots = parseRobots(robotsText);
  const pages = run.state.pages;
  const onlySet = only ? new Set(only) : null;
  const runMetaFile = join(run.dir, 'meta', 'run.json');
  let meta = { thirdParty: { allowed: [], blocked: [] } };
  try { meta = JSON.parse(await readFile(runMetaFile, 'utf8')); } catch { /* first scrape of this run */ }
  const allowed = new Set(meta.thirdParty.allowed);
  const blocked = new Set(meta.thirdParty.blocked);
  const startedAt = new Date().toISOString();

  const eligible = p => {
    const s = pages[p];
    if (onlySet && !onlySet.has(p)) return false;
    return s.status === 'pending' || (s.status === 'failed' && s.attempts < maxAttempts);
  };
  const queue = Object.keys(pages).filter(eligible);
  while (queue.length) {
    const path = queue.shift();
    if (!eligible(path)) continue;
    await pacer.wait();
    let r;
    try {
      r = await capture(origin + path);
    } catch (e) {
      if (stopOnError) throw e;
      pages[path] = { ...pages[path], status: 'failed', attempts: pages[path].attempts + 1, reason: `error: ${String(e.message).slice(0, 120)}` };
      await run.save();
      continue;
    }
    const attempts = pages[path].attempts + 1;
    for (const h of r.thirdParty?.allowed || []) allowed.add(h);
    for (const h of r.thirdParty?.blocked || []) blocked.add(h);
    if (r.httpStatus === 429 || r.httpStatus === 503) {
      pages[path] = { ...pages[path], status: 'failed', attempts, reason: `http-${r.httpStatus}` };
      await run.save();
      await pacer.backoff(attempts - 1);
      continue;
    }

    const finalPath = keyOf(r.finalUrl);
    let target = path;
    if (finalPath !== path) {
      if (!pages[finalPath] && classify(finalPath).inScope) {
        pages[finalPath] = { status: 'pending', attempts: 0, ...pickClass(finalPath), discoveredFrom: path };
      }
      pages[path] = { ...pages[path], status: 'redirect', attempts, finalPath, ...(pages[finalPath] ? {} : { reason: 'redirect-out-of-scope' }) };
      if (!pages[finalPath] || pages[finalPath].status === 'done') {
        await run.save();
        continue;
      }
      target = finalPath;
    }

    const check = validateCapture(r);
    const prev = pages[target];
    const common = {
      ...prev, attempts: target === path ? attempts : prev.attempts + 1, httpStatus: r.httpStatus, flags: check.flags,
      textChars: r.text.length, jsonCount: r.json.length, expanded: r.expanded, tabLinks: r.tabLinks,
      expressiveMention: /expressive/i.test(r.text),
    };
    if (check.ok) {
      const slug = slugFor(target);
      await run.writePageAtomic(slug, {
        'page.txt': r.text,
        'page.json': JSON.stringify(r.json, null, 2),
        'images.json': JSON.stringify(r.images, null, 2),
        'meta.json': JSON.stringify({ path: target, finalUrl: r.finalUrl, httpStatus: r.httpStatus, capturedAt: new Date().toISOString(), flags: check.flags, expanded: r.expanded, tabLinks: r.tabLinks, thirdParty: r.thirdParty }, null, 2),
      });
      pages[target] = { ...common, status: 'done', slug };
      delete pages[target].reason;
      for (const t of r.tabLinks || []) {
        if (pages[t] || !classify(t).inScope) continue;
        pages[t] = isAllowed(robots, t)
          ? { status: 'pending', attempts: 0, ...pickClass(t), discoveredFrom: target }
          : { status: 'skipped', reason: 'robots', attempts: 0, ...pickClass(t), discoveredFrom: target };
        if (onlySet) onlySet.add(t);
        if (pages[t].status === 'pending') queue.push(t);
      }
    } else {
      pages[target] = { ...common, status: 'failed', reason: check.flags.filter(f => f !== 'json-none').join(',') };
    }
    await run.save();
  }

  meta = {
    userAgent: userAgent ?? meta.userAgent ?? null, playwrightVersion: playwrightVersion ?? meta.playwrightVersion ?? null,
    firstStartedAt: meta.firstStartedAt ?? startedAt, lastStartedAt: startedAt, lastFinishedAt: new Date().toISOString(),
    counts: counts(pages), thirdParty: { allowed: [...allowed].sort(), blocked: [...blocked].sort() },
  };
  await writeJsonAtomic(runMetaFile, meta);
  return meta.counts;
}

function pickClass(path) {
  const c = classify(path);
  return { section: c.section, expressiveUrl: c.expressiveUrl };
}

// ---- CLI ----

function arg(name) {
  const i = process.argv.indexOf(name);
  return i === -1 ? null : process.argv[i + 1] ?? '';
}

async function latestRunDate(privateDir) {
  const names = (await readdir(join(privateDir, 'raw'))).filter(n => /^\d{4}-\d{2}-\d{2}$/.test(n)).sort();
  if (!names.length) throw new Error('no run found: run `plan` first');
  return names.at(-1);
}

async function main() {
  const cmd = process.argv[2];
  const { openRepo } = await import('../../guard/repo.mjs');
  const { openRun } = await import('./state.mjs');
  const { createPacer } = await import('./pacer.mjs');
  const repo = openRepo();
  const only = arg('--only') ? arg('--only').split(',').map(s => s.trim()).filter(Boolean) : null;

  const withBrowser = async fn => {
    const pw = await import('playwright');
    const { userAgentFor } = await import('./capture.mjs');
    const browser = await pw.chromium.launch();
    try {
      const userAgent = await userAgentFor(browser);
      const fetchText = async url => {
        const res = await fetch(url, { headers: { 'user-agent': userAgent } });
        return { status: res.status, text: await res.text() };
      };
      const version = JSON.parse(await readFile(join(repo.root, 'node_modules', 'playwright', 'package.json'), 'utf8')).version;
      return await fn({ browser, userAgent, fetchText, playwrightVersion: version });
    } finally {
      await browser.close();
    }
  };

  if (cmd === 'plan') {
    const date = arg('--date') || new Date().toLocaleDateString('sv-SE');
    const run = await openRun({ privateDir: repo.privateDir, date, resume: false });
    const summary = await withBrowser(({ fetchText }) => planRun({ run, origin: ORIGIN, fetchText, pacer: createPacer() }));
    console.log(JSON.stringify({ run: `raw/${date}`, ...summary }, null, 2));
    return;
  }
  const date = arg('--date') || await latestRunDate(repo.privateDir);
  const run = await openRun({ privateDir: repo.privateDir, date, resume: true });

  if (cmd === 'scrape') {
    const { capturePage, newContext } = await import('./capture.mjs');
    const c = await withBrowser(async ({ browser, userAgent, fetchText, playwrightVersion }) => {
      const robots = parseRobots((await fetchText(`${ORIGIN}/robots.txt`)).text);
      const isAllowedUrl = u => isAllowed(robots, u.pathname + u.search);
      const ctx = await newContext(browser, { userAgent, isAllowedUrl, origin: ORIGIN });
      const capture = url => capturePage(ctx, url, { isAllowedUrl, origin: ORIGIN });
      return scrape({ run, origin: ORIGIN, fetchText, capture, pacer: createPacer(), only, userAgent, playwrightVersion });
    });
    console.log(JSON.stringify({ run: `raw/${date}`, counts: c }, null, 2));
    return;
  }

  if (cmd === 'coverage') {
    const plan = JSON.parse(await readFile(join(run.dir, 'meta', 'plan.json'), 'utf8'));
    const exceptions = JSON.parse(await readFile(join(repo.root, 'knowledge', 'coverage-exceptions.json'), 'utf8'));
    const cov = computeCoverage(run.state, plan, exceptions, { only });
    const md = renderCoverageMd(cov);
    if (only) {
      await writeFile(join(run.dir, 'meta', 'coverage-pilot.md'), md);
      console.log(md);
    } else {
      const mdFile = join(repo.root, 'knowledge', 'coverage.md');
      const jsonFile = join(repo.root, 'knowledge', 'coverage.json');
      const json = JSON.stringify({ runDate: run.state.runDate, ...cov }, null, 2) + '\n';
      if (process.argv.includes('--check')) {
        const same = async (f, s) => (await readFile(f, 'utf8').catch(() => null)) === s;
        if (!(await same(mdFile, md + '\n')) || !(await same(jsonFile, json))) {
          console.error('coverage: knowledge/coverage.* is stale; run `run.mjs coverage`');
          process.exitCode = 1;
          return;
        }
      } else {
        await writeFile(mdFile, md + '\n');
        await writeFile(jsonFile, json);
      }
      console.log(md.split('\n').slice(0, 9).join('\n'));
    }
    if (cov.unjustified.length) {
      console.error(`coverage: ${cov.unjustified.length} unjustified missing page(s)`);
      process.exitCode = 1;
    }
    return;
  }
  console.error('usage: run.mjs (plan | scrape | coverage) [--date YYYY-MM-DD] [--only p1,p2] [--check]');
  process.exitCode = 64;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    await main();
  } catch (e) {
    console.error(e.message);
    process.exitCode = e.exitCode || 1;
  }
}
