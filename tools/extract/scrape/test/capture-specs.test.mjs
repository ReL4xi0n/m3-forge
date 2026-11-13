import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { existsSync } from 'node:fs';
import { mkdtemp, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { screenshotDir, captureSpecs } from '../capture-specs.mjs';
import { parseRobots } from '../robots.mjs';
import { createPacer } from '../pacer.mjs';

test('screenshotDir: only private/reference-screenshots/<date>', () => {
  const priv = join('x', 'private');
  assert.equal(screenshotDir(priv, '2026-11-13'), join(priv, 'reference-screenshots', '2026-11-13'));
  assert.throws(() => screenshotDir(priv, '2026-11-13', join('docs', 'images')), /screenshots go only to private\/reference-screenshots/);
  assert.throws(() => screenshotDir(priv, '../x'), /YYYY-MM-DD/);
});

let pw;
try {
  const { chromium } = await import('playwright');
  pw = existsSync(chromium.executablePath()) ? { chromium } : { reason: 'chromium not installed (run in the toolchain env)' };
} catch {
  pw = { reason: 'playwright not installed (run in the toolchain env)' };
}

test('captureSpecs: full-page PNG per allowed page, robots-disallowed pages skipped', { skip: pw.reason }, async () => {
  const log = [];
  const server = createServer((req, res) => {
    log.push(req.url);
    res.writeHead(200, { 'content-type': 'text/html' });
    res.end('<!doctype html><main><h1>Spec</h1><p>Container 40dp</p></main>');
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await pw.chromium.launch();
  try {
    const priv = join(await mkdtemp(join(tmpdir(), 'specs test ')), 'private');
    await mkdir(priv);
    const outDir = screenshotDir(priv, '2026-11-13');
    let t = 0;
    const result = await captureSpecs({
      browser, origin, outDir, userAgent: 'test-agent',
      pages: ['/components/demo/specs', '/archive/old'],
      robots: parseRobots('User-agent: *\nDisallow: /archive\n'),
      pacer: createPacer({ now: () => t, sleep: async ms => { t += ms; } }),
    });
    assert.deepEqual(result.skipped, ['/archive/old']);
    assert.equal(result.saved.length, 1);
    assert.match(result.saved[0], /components__demo__specs~[0-9a-f]{8}\.png$/);
    assert.ok(existsSync(result.saved[0]));
    assert.ok(!log.includes('/archive/old'));
  } finally {
    await browser.close();
    server.close();
  }
});
