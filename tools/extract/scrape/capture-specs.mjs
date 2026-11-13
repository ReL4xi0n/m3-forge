#!/usr/bin/env node
// Private measurement screenshots (Task 12). Full-page PNGs of chosen pages, images and fonts loaded so
// spec labels are readable; analytics and third-party data stay blocked. Output goes only to
// private/reference-screenshots/<YYYY-MM-DD>/. A number may be taken from a screenshot only when it is
// printed as a label in the image; pixel measuring is never used.
//   node tools/extract/scrape/capture-specs.mjs --pages /components/buttons/specs,/components/split-button/specs
import { join, resolve, relative, isAbsolute } from 'node:path';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { isAllowed, parseRobots } from './robots.mjs';
import { slugFor } from './slug.mjs';

export function screenshotDir(privateDir, date, out = null) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date))) throw new Error('date must be YYYY-MM-DD');
  const base = join(privateDir, 'reference-screenshots');
  const dir = out ?? join(base, String(date));
  const rel = relative(resolve(base), resolve(dir));
  if (!rel || rel.startsWith('..') || isAbsolute(rel)) throw new Error('screenshots go only to private/reference-screenshots/<date>');
  return dir;
}

export async function captureSpecs({ browser, origin, pages, robots, pacer, outDir, userAgent }) {
  const { newContext } = await import('./capture.mjs');
  const isAllowedUrl = u => isAllowed(robots, u.pathname + u.search);
  const ctx = await newContext(browser, { userAgent, isAllowedUrl, origin, blockedTypes: new Set(['media']) });
  await mkdir(outDir, { recursive: true });
  const saved = [];
  const skipped = [];
  try {
    for (const path of pages) {
      if (!isAllowed(robots, path)) { skipped.push(path); continue; }
      await pacer.wait();
      const page = await ctx.newPage();
      try {
        await page.goto(origin + path, { waitUntil: 'networkidle', timeout: 45000 });
        const file = join(outDir, `${slugFor(path)}.png`);
        await page.screenshot({ path: file, fullPage: true });
        saved.push(file);
      } finally {
        await page.close();
      }
    }
  } finally {
    await ctx.close();
  }
  return { saved, skipped };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const i = process.argv.indexOf('--pages');
  const pages = i === -1 ? [] : process.argv[i + 1].split(',').map(s => s.trim()).filter(Boolean);
  const { openRepo } = await import('../../guard/repo.mjs');
  const { createPacer } = await import('./pacer.mjs');
  const { userAgentFor } = await import('./capture.mjs');
  const { ORIGIN } = await import('./run.mjs');
  const { chromium } = await import('playwright');
  const repo = openRepo();
  const browser = await chromium.launch();
  try {
    const userAgent = await userAgentFor(browser);
    const robots = parseRobots(await (await fetch(`${ORIGIN}/robots.txt`, { headers: { 'user-agent': userAgent } })).text());
    const outDir = screenshotDir(repo.privateDir, new Date().toLocaleDateString('sv-SE'));
    const r = await captureSpecs({ browser, origin: ORIGIN, pages, robots, pacer: createPacer(), outDir, userAgent });
    console.log(JSON.stringify(r, null, 2));
  } finally {
    await browser.close();
  }
}
