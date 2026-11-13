#!/usr/bin/env node
// One-page license check (owner decision 2026-11-13): before any scraping, render only /get-started
// with the scraper's rules, save it privately, and print the license sentence(s) verbatim with a
// timestamp. The owner reviews the output before the full scrape may start.
//   node tools/extract/scrape/license-check.mjs     (in the toolchain env)
import { createHash } from 'node:crypto';
import { mkdir, writeFile, rename, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseRobots, isAllowed } from './robots.mjs';
import { createPacer } from './pacer.mjs';

export const ORIGIN = 'https://m3.material.io';
export const PAGE = '/get-started';
// SHA-256 of robots.txt as recorded in docs/sources-and-licensing.md §2 (2026-11-13).
export const REPORT_ROBOTS_SHA256 = 'f2277178e0afd0938b7ba3610d8005d2c14101c1615684f23db96f9da08ccdc1';

export function findLicenseSentences(text) {
  const out = [];
  for (const line of String(text).split('\n')) {
    for (const s of line.split(/(?<=[.!?])\s+/)) {
      if (/CC BY|Creative Commons|Apache/i.test(s) && !out.includes(s.trim())) out.push(s.trim());
    }
  }
  return out;
}

export function licenseDir(privateDir, date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date))) throw new Error('date must be YYYY-MM-DD');
  return join(privateDir, 'raw', 'license-check', String(date));
}

async function main() {
  const { openRepo } = await import('../../guard/repo.mjs');
  const { chromium } = await import('playwright');
  const { capturePage, newContext, userAgentFor, validateCapture } = await import('./capture.mjs');
  const repo = openRepo();
  const startedAt = new Date();
  const date = startedAt.toISOString().slice(0, 10);
  const pacer = createPacer();
  const browser = await chromium.launch();
  try {
    const userAgent = await userAgentFor(browser);
    await pacer.wait();
    const res = await fetch(`${ORIGIN}/robots.txt`, { headers: { 'user-agent': userAgent } });
    const robotsText = await res.text();
    const robotsSha = createHash('sha256').update(robotsText).digest('hex');
    if (robotsSha !== REPORT_ROBOTS_SHA256) {
      console.error(`STOP: robots.txt changed since the terms report (${robotsSha}); review it before continuing.`);
      process.exitCode = 3;
      return;
    }
    const robots = parseRobots(robotsText);
    if (!isAllowed(robots, PAGE)) {
      console.error(`STOP: robots.txt disallows ${PAGE}.`);
      process.exitCode = 3;
      return;
    }
    const isAllowedUrl = u => isAllowed(robots, u.pathname + u.search);
    const ctx = await newContext(browser, { userAgent, isAllowedUrl, origin: ORIGIN });
    await pacer.wait();
    const capturedAt = new Date();
    const r = await capturePage(ctx, ORIGIN + PAGE, { isAllowedUrl, origin: ORIGIN });
    const check = validateCapture(r);
    const sentences = findLicenseSentences(r.text);

    const dir = licenseDir(repo.privateDir, date);
    const tmp = `${dir}.tmp`;
    await rm(tmp, { recursive: true, force: true });
    await mkdir(tmp, { recursive: true });
    await writeFile(join(tmp, 'page.txt'), r.text);
    await writeFile(join(tmp, 'page.json'), JSON.stringify(r.json, null, 2));
    await writeFile(join(tmp, 'images.json'), JSON.stringify(r.images, null, 2));
    await writeFile(join(tmp, 'robots.txt'), robotsText);
    await writeFile(join(tmp, 'meta.json'), JSON.stringify({
      page: PAGE, finalUrl: r.finalUrl, httpStatus: r.httpStatus, capturedAt: capturedAt.toISOString(),
      userAgent, robotsSha256: robotsSha, flags: check.flags, textChars: r.text.length, jsonCount: r.json.length,
      expanded: r.expanded, thirdPartyHosts: r.thirdPartyHosts, licenseSentences: sentences,
    }, null, 2));
    await rm(dir, { recursive: true, force: true });
    await mkdir(join(dir, '..'), { recursive: true });
    await rename(tmp, dir);

    console.log(`captured:   ${capturedAt.toISOString()} (UTC)`);
    console.log(`page:       ${r.finalUrl} HTTP ${r.httpStatus}, ${r.text.length} chars, ${r.json.length} JSON responses, ${r.expanded} expanded`);
    console.log(`flags:      ${check.flags.join(', ') || '(none)'}`);
    console.log(`user agent: ${userAgent}`);
    console.log(`third-party hosts contacted: ${r.thirdPartyHosts.join(', ') || '(none)'}`);
    console.log(`saved:      private/raw/license-check/${date}/`);
    console.log(sentences.length ? 'license sentences (verbatim):' : 'license sentences: NONE FOUND');
    for (const s of sentences) console.log(`  > ${s}`);
    if (!sentences.length || !check.ok) process.exitCode = 4;
  } finally {
    await browser.close();
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();
