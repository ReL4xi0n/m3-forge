// Page capture with Playwright. This is the only module that imports playwright, and only when a
// browser is used, so the pure helpers (and `npm test` in CI) work without it installed.
//
// Rules (docs/sources-and-licensing.md §7):
// - images, media and fonts are never downloaded; analytics hosts and robots-disallowed same-site
//   requests are aborted;
// - inside <main> only, closed <details> are opened and non-link tabs / aria-expanded buttons are
//   clicked so hidden text is captured; links, forms and submit buttons are never touched;
// - the user agent is Playwright's default plus UA_SUFFIX (owner decision 2026-11-13).

export const UA_SUFFIX = ' m3-forge (+https://github.com/ReL4xi0n/m3-forge)';
const BLOCKED_TYPES = new Set(['image', 'media', 'font']);
const ANALYTICS = /(^|\.)(google-analytics|googletagmanager|doubleclick)\.(com|net)$/;
const MARK = 'data-m3forge-clicked';
// m3.material.io answers unknown paths with HTTP 200 and renders this component instead (soft 404).
const NOT_FOUND_SELECTOR = 'mio-not-found-page';

export function validateCapture(r, { minTextChars = 200 } = {}) {
  const flags = [];
  let ok = true;
  if (r.httpStatus >= 400) {
    flags.push(`http-${r.httpStatus}`);
    ok = false;
  }
  if ((r.text || '').trim().length < minTextChars) {
    flags.push('text-short');
    ok = false;
  }
  if (r.notFound) {
    flags.length = 0;
    flags.push('soft-404');
    return { ok: false, flags };
  }
  if (!r.json || r.json.length === 0) flags.push('json-none');
  return { ok, flags };
}

export async function userAgentFor(browser) {
  const ctx = await browser.newContext();
  try {
    const page = await ctx.newPage();
    return (await page.evaluate(() => navigator.userAgent)) + UA_SUFFIX;
  } finally {
    await ctx.close();
  }
}

// Per-page record of third-party hosts the routing allowed or blocked.
const hostStats = new WeakMap();

function pageOf(req) {
  try {
    return req.frame().page();
  } catch {
    return null;
  }
}

// blockThirdPartyData (owner decision 2026-11-13, option b): other origins may serve only scripts and
// stylesheets, which rendering needs; their fetch/XHR, frames and everything else are aborted.
export async function newContext(browser, { userAgent, isAllowedUrl, origin, blockThirdPartyData = true, blockedTypes = BLOCKED_TYPES }) {
  const host = new URL(origin).host;
  const ctx = await browser.newContext({ userAgent, serviceWorkers: 'block' });
  await ctx.route('**/*', route => {
    const req = route.request();
    const u = new URL(req.url());
    const type = req.resourceType();
    const third = u.host !== host;
    const block = blockedTypes.has(type) || ANALYTICS.test(u.hostname)
      || (!third && !isAllowedUrl(u))
      || (third && blockThirdPartyData && type !== 'script' && type !== 'stylesheet');
    if (third) {
      const st = hostStats.get(pageOf(req));
      if (st) (block ? st.blocked : st.allowed).add(u.host);
    }
    return block ? route.abort() : route.continue();
  });
  return ctx;
}

// Resolves once no request has been in flight for `idleMs`, or after `timeoutMs`.
function quietWatcher(page) {
  let inflight = 0;
  let lastChange = Date.now();
  const up = () => { inflight++; lastChange = Date.now(); };
  const down = () => { inflight = Math.max(0, inflight - 1); lastChange = Date.now(); };
  page.on('request', up);
  page.on('requestfinished', down);
  page.on('requestfailed', down);
  return async ({ idleMs = 500, timeoutMs = 5000 } = {}) => {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (inflight === 0 && Date.now() - lastChange >= idleMs) return;
      await new Promise(r => setTimeout(r, 100));
    }
  };
}

function mergeLines(seen, order, text) {
  for (const line of String(text).split('\n').map(s => s.trim()).filter(Boolean)) {
    if (!seen.has(line)) {
      seen.add(line);
      order.push(line);
    }
  }
}

async function mainText(page) {
  return page.evaluate(() => (document.querySelector('main') || document.body).innerText);
}

export async function capturePage(ctx, url, { origin }) {
  const host = new URL(origin).host;
  const page = await ctx.newPage();
  const stats = { allowed: new Set(), blocked: new Set() };
  hostStats.set(page, stats);
  const json = [];
  const bodies = [];
  const thirdParty = new Set();
  page.on('request', req => {
    const h = new URL(req.url()).host;
    if (h && h !== host) thirdParty.add(h);
  });
  page.on('response', resp => {
    const u = new URL(resp.url());
    if (u.host !== host || !/json/i.test(resp.headers()['content-type'] || '')) return;
    bodies.push(resp.text().then(body => json.push({ url: resp.url(), status: resp.status(), body }), () => {}));
  });
  const quiet = quietWatcher(page);
  try {
    const resp = await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
    const startUrl = page.url();
    const seen = new Set();
    const lines = [];
    mergeLines(seen, lines, await mainText(page));

    let expanded = await page.evaluate(mark => {
      const root = document.querySelector('main') || document.body;
      let n = 0;
      for (const d of root.querySelectorAll('details:not([open])')) {
        d.open = true;
        d.setAttribute(mark, '1');
        n++;
      }
      return n;
    }, MARK);
    mergeLines(seen, lines, await mainText(page));

    const selector = [
      'main [role="tab"]:not(a):not([aria-selected="true"])',
      'main button[aria-expanded="false"]',
    ].map(s => `${s}:not([${MARK}]):not([type="submit"])`).join(', ');
    for (let pass = 0; pass < 3; pass++) {
      const targets = await page.$$(selector);
      let clicked = 0;
      for (const el of targets) {
        const usable = await el.evaluate((e, mark) => {
          if (e.closest('form') || e.closest('a[href]')) return false;
          e.setAttribute(mark, '1');
          return true;
        }, MARK).catch(() => false);
        if (!usable) continue;
        await el.click({ timeout: 3000 }).catch(() => {});
        clicked++;
        await quiet();
        if (page.url() !== startUrl) throw new Error(`a click navigated away from ${startUrl}`);
        mergeLines(seen, lines, await mainText(page));
      }
      expanded += clicked;
      if (!clicked) break;
    }

    await Promise.all(bodies);
    const finalUrl = page.url();
    const finalPath = new URL(finalUrl).pathname;
    const m = /^\/components\/[^/]+\//.exec(finalPath);
    const notFound = await page.evaluate(sel => document.querySelector(sel) !== null, NOT_FOUND_SELECTOR);
    const { images, tabLinks } = await page.evaluate(prefix => {
      const imgs = Array.from(document.images).map(i => ({ src: i.src, alt: i.getAttribute('alt') || '' }));
      const tabs = [];
      if (prefix) {
        for (const a of document.querySelectorAll('a[href]')) {
          const u = new URL(a.href, location.href);
          if (u.origin === location.origin && u.pathname.startsWith(prefix) && !tabs.includes(u.pathname)) tabs.push(u.pathname);
        }
      }
      return { images: imgs, tabLinks: tabs };
    }, m ? m[0] : null);

    return {
      finalUrl,
      httpStatus: resp ? resp.status() : 0,
      text: lines.join('\n'),
      json,
      images,
      thirdPartyHosts: [...thirdParty].sort(),
      thirdParty: { allowed: [...stats.allowed].sort(), blocked: [...stats.blocked].sort() },
      tabLinks,
      expanded,
      notFound,
    };
  } finally {
    await page.close();
  }
}
