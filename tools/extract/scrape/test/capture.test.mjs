import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { validateCapture, UA_SUFFIX } from '../capture.mjs';

const site = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'site');

// ---- pure (always run) ----

test('validateCapture: short text fails, missing JSON is only flagged, HTTP errors fail', () => {
  const base = { httpStatus: 200, text: 'x'.repeat(250), json: [{ url: 'u', status: 200, body: '{}' }] };
  assert.deepEqual(validateCapture({ ...base, text: 'x'.repeat(50) }), { ok: false, flags: ['text-short'] });
  assert.deepEqual(validateCapture({ ...base, json: [] }), { ok: true, flags: ['json-none'] });
  assert.deepEqual(validateCapture({ ...base, httpStatus: 404 }), { ok: false, flags: ['http-404'] });
  assert.deepEqual(validateCapture(base), { ok: true, flags: [] });
  assert.equal(UA_SUFFIX, ' m3-forge (+https://github.com/ReL4xi0n/m3-forge)');
});

// ---- browser (runs where Playwright + Chromium are installed, i.e. in the toolchain env) ----

async function browserOrSkipReason() {
  try {
    const { chromium } = await import('playwright');
    if (!existsSync(chromium.executablePath())) return { reason: 'chromium not installed (run in the toolchain env)' };
    return { chromium };
  } catch {
    return { reason: 'playwright not installed (run in the toolchain env)' };
  }
}
const pw = await browserOrSkipReason();

function startServer() {
  const log = [];
  const server = createServer(async (req, res) => {
    log.push({ url: req.url, ua: req.headers['user-agent'] });
    const path = req.url.split('?')[0];
    if (path === '/img.png') {
      res.writeHead(200, { 'content-type': 'image/png' });
      return res.end(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
    }
    const file = path.startsWith('/components/') ? 'index.html' : path.slice(1);
    try {
      const body = await readFile(join(site, file));
      const type = file.endsWith('.json') ? 'application/json' : file.endsWith('.js') ? 'text/javascript' : 'text/html';
      res.writeHead(200, { 'content-type': type });
      res.end(body);
    } catch {
      res.writeHead(404);
      res.end('not found');
    }
  });
  return new Promise(r => server.listen(0, '127.0.0.1', () => r({ server, log, origin: `http://127.0.0.1:${server.address().port}` })));
}

test('capturePage: JSON, expanded content, image metadata, tab links, blocking and user agent', { skip: pw.reason }, async () => {
  const { capturePage, newContext, userAgentFor } = await import('../capture.mjs');
  const { server, log, origin } = await startServer();
  const browser = await pw.chromium.launch();
  try {
    const isAllowedUrl = u => !(u.pathname === '/search.html' || /[?&][^&]*q=/.test(u.search));
    const userAgent = await userAgentFor(browser);
    const ctx = await newContext(browser, { userAgent, isAllowedUrl, origin });
    const r = await capturePage(ctx, `${origin}/components/demo/overview`, { isAllowedUrl, origin });

    assert.equal(r.httpStatus, 200);
    assert.ok(r.json.some(j => j.url.endsWith('/_dsm/page.json')), JSON.stringify(r.json.map(j => j.url)));
    assert.match(r.text, /Rendered from JSON alpha/);
    assert.match(r.text, /Hidden detail text/);
    assert.match(r.text, /Revealed by button/);
    assert.match(r.text, /Panel one text/);
    assert.match(r.text, /Panel two loaded/);
    assert.ok(r.json.some(j => j.url.endsWith('/_dsm/tab2.json')));
    assert.ok(r.expanded >= 3, `expanded ${r.expanded}`);
    assert.deepEqual(r.images, [{ src: `${origin}/img.png`, alt: 'diagram' }]);
    assert.deepEqual(r.tabLinks, ['/components/demo/overview', '/components/demo/specs', '/components/demo/guidelines']);

    const paths = log.map(l => l.url);
    assert.ok(!paths.includes('/img.png'), 'image must not be requested');
    assert.ok(!paths.some(p => p.startsWith('/search.html')), 'robots-disallowed request must be blocked');
    assert.ok(!paths.includes('/elsewhere'), 'links are never followed');
    assert.ok(!paths.some(p => p.startsWith('/submit')), 'forms are never submitted');

    const ua = log[0].ua;
    assert.ok(ua.endsWith(' m3-forge (+https://github.com/ReL4xi0n/m3-forge)'), ua);
    assert.match(ua, /^Mozilla\/5\.0 .*Chrome/);
    assert.equal(ua.split(' m3-forge (+https://github.com/ReL4xi0n/m3-forge)').length, 2, 'suffix appended exactly once');
  } finally {
    await browser.close();
    server.close();
  }
});
