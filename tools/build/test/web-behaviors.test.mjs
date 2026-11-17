// assets/web/behaviors.js: static checks (marker, no foreign dependency, tokens only, install part,
// size) and Chromium behavior on the navigation gallery (M3_TOOLCHAIN_TESTS=1): dialog focus in and
// back, Escape closes a menu, the ripple does nothing under reduced motion, one global (M3).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createReadStream, existsSync, mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildGallerySite } from '../gallery/web/site.mjs';
import { MANIFEST } from '../../../plugin/skills/material3/scripts/install-assets/manifest.mjs';
import { withToolchain } from '../../../evals/tools/toolchain-env.mjs';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const src = readFileSync(join(root, 'plugin/skills/material3/assets/web/behaviors.js'), 'utf8');
const toolchain = process.env.M3_TOOLCHAIN_TESTS !== '1' && 'needs the local toolchain (M3_TOOLCHAIN_TESTS=1)';

test('behaviors.js is a marked, small, dependency-free install part', () => {
  assert.match(src.split('\n', 3).join('\n'), /material3 skill asset: assets\/web\/behaviors\.js/);
  assert.ok(Buffer.byteLength(src) < 12 * 1024, `${Buffer.byteLength(src)} bytes`);
  assert.deepEqual(MANIFEST.web.behaviors, [{ src: 'web/behaviors.js', group: 'main' }]);
  assert.doesNotMatch(src, /\b(?:import|require)\b\s*[("'{]|\bfetch\(|XMLHttpRequest|https?:\/\//);
});

test('behaviors.js takes durations and easings from the motion tokens only', () => {
  assert.match(src, /--md-sys-motion-/);
  assert.doesNotMatch(src, /cubic-bezier|\bduration:\s*\d|\b\d+\s*ms\b/);
  assert.match(src, /prefers-reduced-motion: reduce/);
});

const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2' };
function serve(dir) {
  const base = resolve(dir);
  const server = createServer((req, res) => {
    let f = resolve(base, '.' + decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (f !== base && !f.startsWith(base + sep)) { res.writeHead(403).end(); return; }
    if (existsSync(f) && statSync(f).isDirectory()) f = join(f, 'index.html');
    if (!existsSync(f)) { res.writeHead(404).end(); return; }
    res.writeHead(200, { 'content-type': MIME[extname(f)] ?? 'application/octet-stream' });
    createReadStream(f).pipe(res);
  });
  return new Promise(ok => server.listen(0, '127.0.0.1', () => ok({
    origin: `http://127.0.0.1:${server.address().port}`,
    close: () => new Promise(r => { server.close(() => r()); server.closeAllConnections(); }),
  })));
}

const inDialog = () => document.getElementById('modal-dialog').contains(document.activeElement);

test('in Chromium: dialog focus, menu Escape, ripple under reduced motion, one global', { skip: toolchain, timeout: 300_000 }, async () => {
  const dir = mkdtempSync(join(tmpdir(), 'm3 behaviors '));
  buildGallerySite('navigation', dir);
  assert.ok(existsSync(join(dir, 'assets/m3/behaviors.js')));
  process.env.PLAYWRIGHT_BROWSERS_PATH = withToolchain(process.env).PLAYWRIGHT_BROWSERS_PATH;
  const { chromium } = await import('playwright');
  const server = await serve(dir);
  const browser = await chromium.launch();
  try {
    for (const reducedMotion of ['no-preference', 'reduce']) {
      const page = await browser.newPage({ viewport: { width: 412, height: 915 }, reducedMotion });
      const errors = [];
      page.on('pageerror', e => errors.push(String(e)));
      await page.goto(server.origin + '/');
      await page.evaluate(() => document.fonts.ready.then(() => undefined));

      // No global name other than M3: the window's own names after load, minus a blank page's.
      const added = await page.evaluate(() => {
        const probe = document.createElement('iframe');
        document.body.append(probe);
        const base = new Set(Object.getOwnPropertyNames(probe.contentWindow));
        probe.remove();
        return Object.getOwnPropertyNames(window).filter(n => !base.has(n) && !/^(?:on|webkit)/.test(n));
      });
      assert.deepEqual(added, ['M3'], 'globals');

      // Dialog: focus moves in, Tab stays inside, Escape closes it and focus returns to the opener.
      const opener = page.locator('#live-dialog-button');
      await opener.focus();
      await opener.click();
      assert.equal(await page.evaluate(() => document.getElementById('modal-dialog').open), true);
      assert.equal(await page.evaluate(inDialog), true, 'focus moves into the dialog');
      for (let i = 0; i < 4; i++) {
        await page.keyboard.press('Tab');
        assert.equal(await page.evaluate(inDialog), true, 'Tab leaves the dialog');
      }
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => !document.getElementById('modal-dialog').open);
      assert.equal(await page.evaluate(() => document.activeElement.id), 'live-dialog-button');

      // Menu: opens under the button with focus on the first item; Escape closes it, focus returns.
      const button = page.locator('#live-menu-button');
      await button.click();
      assert.equal(await page.evaluate(() => document.getElementById('live-menu').hasAttribute('data-open')), true);
      assert.equal(await button.getAttribute('aria-expanded'), 'true');
      await page.evaluate(() => Promise.all(document.getElementById('live-menu').getAnimations().map(a => a.finished)));
      const geo = await page.evaluate(() => {
        const b = document.getElementById('live-menu-button').getBoundingClientRect();
        const m = document.getElementById('live-menu').getBoundingClientRect();
        return { below: m.top - b.bottom, above: b.top - m.bottom, active: document.activeElement.textContent };
      });
      assert.ok(Math.abs(geo.below) < 1 || Math.abs(geo.above) < 1, `menu touches the button: ${JSON.stringify(geo)}`);
      assert.match(geo.active, /Newest first/);
      await page.keyboard.press('ArrowDown');
      assert.match(await page.evaluate(() => document.activeElement.textContent), /Oldest first/);
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => !document.getElementById('live-menu').hasAttribute('data-open'));
      assert.equal(await button.getAttribute('aria-expanded'), 'false');
      assert.equal(await page.evaluate(() => document.activeElement.id), 'live-menu-button');

      // Native close (not through M3): the trap and focus restore still run.
      await opener.focus();
      await opener.click();
      await page.evaluate(() => document.getElementById('modal-dialog').close());
      await page.waitForFunction(() => document.activeElement.id === 'live-dialog-button');

      // Rapid toggle: reopen during the exit motion ends open and consistent.
      await button.click();
      await page.evaluate(async () => {
        const b = document.getElementById('live-menu-button');
        b.click(); // close, exit motion starts
        b.click(); // open again before it ends
        await new Promise(r => setTimeout(r, 800));
      });
      assert.equal(await page.evaluate(() => document.getElementById('live-menu').hasAttribute('data-open')), true, 'menu open after rapid toggle');
      assert.equal(await button.getAttribute('aria-expanded'), 'true');
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => !document.getElementById('live-menu').hasAttribute('data-open'));
      assert.equal(await button.getAttribute('aria-expanded'), 'false');

      // Snackbar: the live region exists (and is rendered) before it is shown, then carries the text.
      const live = await page.evaluate(() => {
        const sb = document.getElementById('live-snackbar');
        const r = sb.previousElementSibling;
        return { role: r.getAttribute('role'), shown: getComputedStyle(r).display !== 'none', text: r.textContent, open: sb.hasAttribute('data-open') };
      });
      assert.deepEqual(live, { role: 'status', shown: true, text: '', open: false });
      await page.locator('#live-snackbar-button').click();
      await page.waitForFunction(() => document.getElementById('live-snackbar').previousElementSibling.textContent === 'Photo archived');
      assert.equal(await page.evaluate(() => document.getElementById('live-snackbar').hasAttribute('data-open')), true);

      // Ripple: one is drawn on press normally, none under reduced motion.
      const target = page.locator('#live-dialog-button');
      const box = await target.boundingBox();
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      const drawn = await target.evaluate(el => el.querySelectorAll(':scope > span[aria-hidden="true"]').length);
      await page.mouse.up();
      assert.equal(drawn, reducedMotion === 'reduce' ? 0 : 1, `ripple spans (${reducedMotion})`);
      await page.keyboard.press('Escape');

      // M3.motion: a real Animation from the tokens, none under reduced motion.
      const animated = await page.evaluate(() => {
        const a = M3.motion(document.body, [{ opacity: 1 }, { opacity: 1 }], 'spatial-fast');
        const isAnimation = a instanceof Animation;
        if (isAnimation) a.cancel();
        return isAnimation;
      });
      assert.equal(animated, reducedMotion !== 'reduce');
      assert.deepEqual(errors, []);
      await page.close();
    }
  } finally {
    await browser.close();
    await server.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
