import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { mkdtemp, mkdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { planRun, scrape, refreshPlan } from '../run.mjs';
import { computeCoverage, renderCoverageMd, validateExceptions } from '../coverage.mjs';
import { createPacer } from '../pacer.mjs';
import { openRun } from '../state.mjs';

const ORIGIN = 'https://example.test';
const ROBOTS = 'User-agent: *\nSitemap: https://example.test/sitemap.xml\nDisallow: /archive\n';
const sitemap = paths => `<urlset>${paths.map(p => `<url><loc>${ORIGIN}${p}</loc></url>`).join('')}</urlset>`;

function fakeFetch(files) {
  const calls = [];
  const fn = async url => {
    calls.push(url);
    if (!(url in files)) return { status: 404, text: '' };
    return { status: 200, text: files[url] };
  };
  fn.calls = calls;
  return fn;
}

function fastPacer() {
  let t = 0;
  return createPacer({ now: () => t, sleep: async ms => { t += ms; } });
}

function page(path, over = {}) {
  return {
    finalUrl: ORIGIN + path, httpStatus: 200, text: `Body of ${path} `.repeat(30), json: [{ url: `${ORIGIN}/_dsm/x.json`, status: 200, body: '{}' }],
    images: [], thirdPartyHosts: [], thirdParty: { allowed: ['apis.example'], blocked: ['ga.example'] }, tabLinks: [], expanded: 1, notFound: false,
    ...over,
  };
}

async function setup(paths, robots = ROBOTS) {
  const d = await mkdtemp(join(tmpdir(), 'run test '));
  const privateDir = join(d, 'private');
  await mkdir(privateDir);
  const fetchText = fakeFetch({ [`${ORIGIN}/robots.txt`]: robots, [`${ORIGIN}/sitemap.xml`]: sitemap(paths) });
  const run = await openRun({ privateDir, date: '2026-11-14', resume: false });
  const plan = await planRun({ run, origin: ORIGIN, fetchText });
  return { privateDir, run, plan, fetchText };
}

function captureFrom(map) {
  const calls = [];
  const fn = async url => {
    const path = new URL(url).pathname;
    calls.push(path);
    const v = map[path];
    if (v instanceof Error) throw v;
    return typeof v === 'function' ? v() : v ?? page(path);
  };
  fn.calls = calls;
  return fn;
}

test('plan: sitemap paths classified, robots-disallowed in-scope pages skipped, hashes recorded', async () => {
  const { run, plan } = await setup(['/components/chips/overview', '/archive/components', '/develop/web', '/styles/color/roles']);
  assert.equal(plan.sitemapTotal, 4);
  assert.deepEqual(Object.keys(run.state.pages).sort(), ['/components/chips/overview', '/develop/web', '/styles/color/roles']);
  assert.match(run.state.robotsSha256, /^[0-9a-f]{64}$/);
  assert.match(run.state.sitemapSha256, /^[0-9a-f]{64}$/);
  assert.ok(existsSync(join(run.dir, 'meta', 'plan.json')));
  const robotsSaved = await readFile(join(run.dir, 'meta', 'robots.txt'), 'utf8');
  assert.equal(createHash('sha256').update(robotsSaved).digest('hex'), run.state.robotsSha256);
});

test('plan: robots-disallowed page inside a scoped section is skipped and justified', async () => {
  const robots = `${ROBOTS}Disallow: /components/secret\n`;
  const { run } = await setup(['/components/secret/overview', '/components/chips/overview'], robots);
  assert.equal(run.state.pages['/components/secret/overview'].status, 'skipped');
  assert.equal(run.state.pages['/components/secret/overview'].reason, 'robots');
  const cov = computeCoverage(run.state, { sitemapTotal: 2 }, {});
  assert.ok(!cov.unjustified.includes('/components/secret/overview'));
  assert.equal(cov.skippedRobots, 1);
});

test('plan: no sitemap -> stop and ask the owner', async () => {
  const d = await mkdtemp(join(tmpdir(), 'run test '));
  await mkdir(join(d, 'private'));
  const run = await openRun({ privateDir: join(d, 'private'), date: '2026-11-14', resume: false });
  const fetchText = fakeFetch({ [`${ORIGIN}/robots.txt`]: 'User-agent: *\nDisallow: /x\n' });
  await assert.rejects(planRun({ run, origin: ORIGIN, fetchText }), e => e.exitCode === 3 && /no sitemap found: stop and ask the owner/.test(e.message));
});

test('scrape: interrupted run resumes without re-fetching finished pages; failures retried', async () => {
  const paths = ['/styles/a/overview', '/styles/b/overview', '/styles/c/overview', '/styles/d/overview'];
  const { run, fetchText } = await setup(paths);
  const first = captureFrom({ '/styles/c/overview': new Error('browser crashed') });
  await assert.rejects(scrape({ run, origin: ORIGIN, fetchText, capture: first, pacer: fastPacer(), stopOnError: true }), /browser crashed/);
  assert.deepEqual(first.calls, ['/styles/a/overview', '/styles/b/overview', '/styles/c/overview']);
  assert.equal(run.state.pages['/styles/c/overview'].status, 'pending');

  const resumed = await openRun({ privateDir: join(run.dir, '..', '..'), date: '2026-11-14', resume: true });
  const second = captureFrom({});
  await scrape({ run: resumed, origin: ORIGIN, fetchText, capture: second, pacer: fastPacer() });
  assert.deepEqual(second.calls, ['/styles/c/overview', '/styles/d/overview']);
  assert.ok(Object.values(resumed.state.pages).every(p => p.status === 'done'));
  assert.ok(existsSync(join(resumed.dir, 'pages', resumed.state.pages['/styles/a/overview'].slug, 'page.txt')));
});

test('scrape: failed pages are retried up to 3 attempts, then stay failed', async () => {
  const { run, fetchText } = await setup(['/styles/x/overview']);
  const cap = captureFrom({ '/styles/x/overview': () => page('/styles/x/overview', { httpStatus: 500 }) });
  for (let i = 0; i < 4; i++) await scrape({ run, origin: ORIGIN, fetchText, capture: cap, pacer: fastPacer() });
  assert.equal(cap.calls.length, 3);
  assert.equal(run.state.pages['/styles/x/overview'].status, 'failed');
  assert.equal(run.state.pages['/styles/x/overview'].reason, 'http-500');
});

test('scrape: redirect to another planned page is recorded once, not missing', async () => {
  const { run, fetchText } = await setup(['/components/a/overview', '/components/b/overview']);
  const cap = captureFrom({ '/components/a/overview': page('/components/b/overview') });
  await scrape({ run, origin: ORIGIN, fetchText, capture: cap, pacer: fastPacer() });
  assert.deepEqual(run.state.pages['/components/a/overview'], { ...run.state.pages['/components/a/overview'], status: 'redirect', finalPath: '/components/b/overview' });
  assert.equal(run.state.pages['/components/b/overview'].status, 'done');
  assert.deepEqual(cap.calls, ['/components/a/overview'], 'the redirect target is not fetched twice');
  const cov = computeCoverage(run.state, { sitemapTotal: 2 }, {});
  assert.deepEqual(cov.missing, []);
  assert.equal(cov.done, 1);
  assert.equal(cov.redirects, 1);
});

test('scrape: short text and soft 404 fail; JSON-none is done but listed', async () => {
  const { run, fetchText } = await setup(['/styles/s/overview', '/styles/n/overview', '/styles/j/overview']);
  const cap = captureFrom({
    '/styles/s/overview': page('/styles/s/overview', { text: 'tiny' }),
    '/styles/n/overview': page('/styles/n/overview', { notFound: true }),
    '/styles/j/overview': page('/styles/j/overview', { json: [] }),
  });
  await scrape({ run, origin: ORIGIN, fetchText, capture: cap, pacer: fastPacer() });
  assert.equal(run.state.pages['/styles/s/overview'].status, 'failed');
  assert.equal(run.state.pages['/styles/s/overview'].reason, 'text-short');
  assert.equal(run.state.pages['/styles/n/overview'].reason, 'soft-404');
  assert.equal(run.state.pages['/styles/j/overview'].status, 'done');
  const cov = computeCoverage(run.state, { sitemapTotal: 3 }, {});
  assert.deepEqual(cov.jsonNone, ['/styles/j/overview']);
  assert.match(renderCoverageMd(cov), /JSON-none/);
});

test('scrape: robots.txt changed since plan -> stop before any page', async () => {
  const { run } = await setup(['/styles/a/overview']);
  const changed = fakeFetch({ [`${ORIGIN}/robots.txt`]: `${ROBOTS}Disallow: /styles\n` });
  const cap = captureFrom({});
  await assert.rejects(scrape({ run, origin: ORIGIN, fetchText: changed, capture: cap, pacer: fastPacer() }), /robots.txt changed since plan/);
  assert.equal(cap.calls.length, 0);
});

test('scrape: tab found only via tabLinks is scraped in the same run; coverage tab table', async () => {
  const { run, fetchText } = await setup(['/components/chips/overview', '/components/chips/specs']);
  const tabs = ['/components/chips/overview', '/components/chips/specs', '/components/chips/guidelines'];
  const cap = captureFrom({
    '/components/chips/overview': page('/components/chips/overview', { tabLinks: tabs }),
    '/components/chips/specs': page('/components/chips/specs', { tabLinks: tabs }),
  });
  await scrape({ run, origin: ORIGIN, fetchText, capture: cap, pacer: fastPacer() });
  assert.ok(cap.calls.includes('/components/chips/guidelines'));
  const cov = computeCoverage(run.state, { sitemapTotal: 2 }, {});
  const chips = cov.components.find(c => c.component === 'chips');
  assert.deepEqual(chips.tabsOnSite.sort(), tabs.slice().sort());
  assert.deepEqual(chips.missingTabs, []);
  const md = renderCoverageMd(cov);
  assert.match(md, /\| chips \| ✓ \| ✓ \| ✓ \| — \|/);
});

test('coverage: a failed tab is a missing tab until justified; exception details need 10+ chars', async () => {
  const { run, fetchText } = await setup(['/components/chips/overview', '/components/chips/guidelines']);
  const cap = captureFrom({ '/components/chips/guidelines': page('/components/chips/guidelines', { httpStatus: 404 }) });
  await scrape({ run, origin: ORIGIN, fetchText, capture: cap, pacer: fastPacer() });
  let cov = computeCoverage(run.state, { sitemapTotal: 2 }, {});
  assert.deepEqual(cov.components.find(c => c.component === 'chips').missingTabs, ['/components/chips/guidelines']);
  assert.deepEqual(cov.unjustified, ['/components/chips/guidelines']);
  const ex = { '/components/chips/guidelines': { kind: 'http-404', detail: 'HTTP 404 on 2026-11-14 twice' } };
  cov = computeCoverage(run.state, { sitemapTotal: 2 }, ex);
  assert.deepEqual(cov.unjustified, []);
  assert.throws(() => validateExceptions({ '/x': { kind: 'http-404', detail: 'short' } }), /at least 10 characters/);
  assert.throws(() => validateExceptions({ '/x': { kind: 'because', detail: 'long enough detail' } }), /kind/);
});

test('coverage: --only restricts rows to the pilot pages; expressive by URL and by content', async () => {
  const { run, fetchText } = await setup(['/foundations/usability/applying-m3-expressive', '/styles/motion/overview', '/styles/other/overview']);
  const cap = captureFrom({ '/styles/motion/overview': page('/styles/motion/overview', { text: 'Springs in M3 Expressive motion. '.repeat(20) }) });
  await scrape({ run, origin: ORIGIN, fetchText, capture: cap, pacer: fastPacer(), only: ['/foundations/usability/applying-m3-expressive', '/styles/motion/overview'] });
  assert.equal(cap.calls.length, 2);
  const cov = computeCoverage(run.state, { sitemapTotal: 3 }, {}, { only: ['/foundations/usability/applying-m3-expressive', '/styles/motion/overview'] });
  assert.equal(cov.rows.length, 2);
  assert.deepEqual(cov.unjustified, []);
  assert.deepEqual(cov.expressive, { url: 1, content: 1 });
});

test('scrape: meta/run.json records UA, blocked and allowed third-party hosts', async () => {
  const { run, fetchText } = await setup(['/styles/a/overview']);
  await scrape({ run, origin: ORIGIN, fetchText, capture: captureFrom({}), pacer: fastPacer(), userAgent: 'UA x', playwrightVersion: '9.9.9' });
  const meta = JSON.parse(await readFile(join(run.dir, 'meta', 'run.json'), 'utf8'));
  assert.equal(meta.userAgent, 'UA x');
  assert.deepEqual(meta.thirdParty, { allowed: ['apis.example'], blocked: ['ga.example'] });
  assert.equal(meta.counts.done, 1);
});

test('blog candidates: kept only with Expressive or token content; the rest are checked and excluded', async () => {
  const { run, fetchText } = await setup(['/blog/new-motion', '/blog/surface-tokens', '/blog/photo-interview', '/blog', '/']);
  assert.deepEqual(Object.keys(run.state.pages).sort(), ['/blog/new-motion', '/blog/photo-interview', '/blog/surface-tokens']);
  assert.ok(Object.values(run.state.pages).every(p => p.candidate === true));
  const cap = captureFrom({
    '/blog/new-motion': page('/blog/new-motion', { text: 'Meet the M3 Expressive motion system. '.repeat(10) }),
    '/blog/surface-tokens': page('/blog/surface-tokens', { text: 'Surface roles now map to md.sys.color.surface-container tokens. '.repeat(5) }),
    '/blog/photo-interview': page('/blog/photo-interview', { text: 'An interview about photography and light. '.repeat(10) }),
  });
  await scrape({ run, origin: ORIGIN, fetchText, capture: cap, pacer: fastPacer() });
  assert.equal(run.state.pages['/blog/new-motion'].status, 'done');
  assert.deepEqual(run.state.pages['/blog/new-motion'].relevance, ['expressive']);
  assert.deepEqual(run.state.pages['/blog/surface-tokens'].relevance, ['tokens']);
  assert.equal(run.state.pages['/blog/photo-interview'].status, 'excluded');
  assert.equal(run.state.pages['/blog/photo-interview'].reason, 'no Expressive or token content');
  const cov = computeCoverage(run.state, { sitemapTotal: 5 }, {});
  assert.equal(cov.inScope, 2);
  assert.deepEqual(cov.checkedExcluded, [{ path: '/blog/photo-interview', reason: 'no Expressive or token content' }]);
  assert.deepEqual(cov.missing, []);
  const md = renderCoverageMd(cov);
  assert.match(md, /## Checked and excluded/);
  assert.match(md, /\| \/blog\/new-motion \| blog \| content \| done \| 1 \| included: expressive \|/);
});

test('refreshPlan adds newly scoped pages from the saved sitemap without network or touching existing pages', async () => {
  const { run } = await setup(['/components/chips/overview', '/develop/flutter', '/blog/x']);
  run.state.pages['/components/chips/overview'].status = 'done';
  delete run.state.pages['/develop/flutter'];
  delete run.state.pages['/blog/x'];
  const added = await refreshPlan(run);
  assert.deepEqual(added.sort(), ['/blog/x', '/develop/flutter']);
  assert.equal(run.state.pages['/components/chips/overview'].status, 'done');
  assert.equal(run.state.pages['/blog/x'].candidate, true);
  assert.equal(run.state.pages['/develop/flutter'].status, 'pending');
});
