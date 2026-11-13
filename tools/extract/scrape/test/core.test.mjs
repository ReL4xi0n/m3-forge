import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { mkdtemp, mkdir } from 'node:fs/promises';
import { parseRobots, isAllowed, crawlDelaySeconds } from '../robots.mjs';
import { parseSitemap, classify } from '../sitemap.mjs';
import { slugFor } from '../slug.mjs';
import { createPacer } from '../pacer.mjs';
import { openRun } from '../state.mjs';

const fx = name => readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'fixtures', name), 'utf8');

test('robots: live m3 rules (wildcards, Allow beats Disallow on a tie-or-longer match)', () => {
  const r = parseRobots(fx('robots.txt'));
  assert.equal(isAllowed(r, '/components/buttons/overview'), true);
  assert.equal(isAllowed(r, '/archive/x'), false);
  assert.equal(isAllowed(r, '/archive/ok'), true);
  assert.equal(isAllowed(r, '/search.html'), false);
  assert.equal(isAllowed(r, '/components?q=a'), false);
  assert.equal(isAllowed(r, '/components?x=1&faq=2'), false);
  assert.equal(isAllowed(r, '/components?utm_source=x'), false);
  assert.equal(isAllowed(r, '/components/q=1'), true, 'q= outside the query string is allowed');
  assert.deepEqual(r.sitemaps, ['https://example.test/sitemap.xml']);
  assert.equal(crawlDelaySeconds(r), null, 'only the * group applies');
});

test('robots: $ anchors the end and Crawl-delay is read from the * group', () => {
  const r = parseRobots('User-agent: *\nDisallow: /*.pdf$\nCrawl-delay: 10\n');
  assert.equal(isAllowed(r, '/a.pdf'), false);
  assert.equal(isAllowed(r, '/a.pdf?x=1'), true);
  assert.equal(crawlDelaySeconds(r), 10);
});

test('sitemap: index and urlset, entities decoded, whitespace trimmed', () => {
  assert.deepEqual(parseSitemap(fx('sitemap-index.xml')), {
    urls: [], sitemaps: ['https://example.test/sitemap-a.xml', 'https://example.test/sitemap-b.xml?x=1&y=2'],
  });
  const u = parseSitemap(fx('sitemap-urls.xml'));
  assert.equal(u.urls.length, 5);
  assert.equal(u.urls[4], 'https://example.test/develop/web?a=1&b=2');
  assert.deepEqual(u.sitemaps, []);
});

test('classify: sections in scope, Expressive by URL, others out', () => {
  assert.deepEqual(classify('/components/split-button/overview'), { inScope: true, section: 'components', expressiveUrl: false, candidate: false });
  assert.deepEqual(classify('/m3-expressive-launch'), { inScope: true, section: 'expressive', expressiveUrl: true, candidate: false });
  assert.deepEqual(classify('/styles/motion/Expressive'), { inScope: true, section: 'styles', expressiveUrl: true, candidate: false });
  assert.deepEqual(classify('/blog/m3-expressive-launch'), { inScope: false, section: 'blog', expressiveUrl: true, candidate: true });
  assert.deepEqual(classify('/blog/tone-based-surface-color-m3'), { inScope: false, section: 'blog', expressiveUrl: false, candidate: true });
  for (const p of ['/', '/blog', '/blog/search.html']) assert.equal(classify(p).candidate, false, p);
  for (const p of ['/', '/blog', '/blog/search.html']) assert.equal(classify(p).inScope, false, p);
  assert.deepEqual(classify('/develop/flutter'), { inScope: true, section: 'develop', expressiveUrl: false, candidate: false });
  assert.equal(classify('/develop').section, 'develop');
  assert.deepEqual(classify('/whats-new-at-io26'), { inScope: true, section: 'news', expressiveUrl: false, candidate: false });
  assert.equal(classify('/material-is-compose-first').section, 'news');
  assert.deepEqual(classify('/legal/x'), { inScope: false, section: null, expressiveUrl: false, candidate: false });
});

test('slug: collision-free on case-insensitive file systems', () => {
  const a = slugFor('/Components/Buttons');
  const b = slugFor('/components/buttons');
  assert.notEqual(a, b);
  for (const s of [a, b, slugFor('/'), slugFor('/styles/color/roles?x=1')]) assert.match(s, /^[a-z0-9_-]+~[0-9a-f]{8}$/);
  assert.match(b, /^components__buttons~/);
});

function fakeClock() {
  let t = 1_000_000;
  return { now: () => t, sleep: async ms => { t += ms; }, get t() { return t; } };
}

test('pacer: at least 3 s between pages, crawl-delay honored, minimum enforced', async () => {
  const c = fakeClock();
  const p = createPacer({ now: c.now, sleep: c.sleep });
  await p.wait();
  const t1 = c.t;
  await p.wait();
  assert.ok(c.t - t1 >= 3000, `gap ${c.t - t1}`);
  const c2 = fakeClock();
  const p2 = createPacer({ crawlDelaySec: 10, now: c2.now, sleep: c2.sleep });
  await p2.wait();
  const s = c2.t;
  await p2.wait();
  assert.equal(c2.t - s, 10000);
  assert.throws(() => createPacer({ minDelayMs: 1000 }), /minimum delay is 3000 ms/);
});

test('pacer: backoff waits max(Retry-After, 30 s x 2^attempt)', async () => {
  const c = fakeClock();
  const p = createPacer({ now: c.now, sleep: c.sleep });
  let s = c.t;
  await p.backoff(0);
  assert.equal(c.t - s, 30000);
  s = c.t;
  await p.backoff(2);
  assert.equal(c.t - s, 120000);
  s = c.t;
  await p.backoff(0, 90);
  assert.equal(c.t - s, 90000);
});

async function privateDir() {
  const d = await mkdtemp(join(tmpdir(), 'scrape test '));
  const p = join(d, 'private');
  await mkdir(p);
  return p;
}

test('state: page files appear only as a whole; a failed write leaves nothing and resume cleans temp dirs', async () => {
  const priv = await privateDir();
  const run = await openRun({ privateDir: priv, date: '2026-11-14', resume: false });
  run.state.pages['/a'] = { status: 'pending', attempts: 0 };
  await run.save();
  await assert.rejects(run.writePageAtomic('a~00000000', { 'page.txt': 'ok', 'page.json': Symbol('not a string') }));
  assert.equal(existsSync(join(run.dir, 'pages', 'a~00000000')), false);
  await run.writePageAtomic('b~00000000', { 'page.txt': 'text', 'page.json': '[]', 'images.json': '[]' });
  assert.deepEqual(readdirSync(join(run.dir, 'pages', 'b~00000000')).sort(), ['images.json', 'page.json', 'page.txt']);

  const resumed = await openRun({ privateDir: priv, date: '2026-11-14', resume: true });
  assert.equal(resumed.state.pages['/a'].status, 'pending');
  assert.deepEqual(readdirSync(join(resumed.dir, 'pages')).filter(n => n.startsWith('.tmp-')), []);
});

test('state: refuses paths outside private/, bad dates, and fresh runs over existing ones', async () => {
  const priv = await privateDir();
  await assert.rejects(openRun({ privateDir: priv, date: '../../evil', resume: false }), /scraper writes only to private\//);
  await assert.rejects(openRun({ privateDir: priv, date: '2026-11-14/../../x', resume: false }), /scraper writes only to private\//);
  await assert.rejects(openRun({ privateDir: priv, date: '2026-11-14', resume: true }), /no run to resume/);
  await openRun({ privateDir: priv, date: '2026-11-14', resume: false });
  await assert.rejects(openRun({ privateDir: priv, date: '2026-11-14', resume: false }), /run exists; use --resume/);
});
