// System-browser engine of the web screenshot step, used when no Playwright resolves: finds an
// installed Chrome, Edge or Chromium, starts it headless on a temporary profile with
// --remote-debugging-port=0, and drives it over the Chrome DevTools Protocol with Node's built-in
// WebSocket (no dependency). Each capture gets its own browser context (like a Playwright context).
// The browser and its profile are removed when the run ends; every wait has a hard timeout.
import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, posix, win32 } from 'node:path';

const LAUNCH_TIMEOUT_MS = 30_000;
const COMMAND_TIMEOUT_MS = 30_000;
const CLOSE_TIMEOUT_MS = 5_000;
const IDLE_QUIET_MS = 500;

// ---- Finding a browser ------------------------------------------------------------------------

// Executable paths to try, in order: Chrome, Edge, Chromium.
export function browserCandidates(env = process.env, platform = process.platform) {
  if (platform === 'win32') {
    const get = (k) => env[k] ?? env[k.toUpperCase()] ?? Object.entries(env).find(([n]) => n.toUpperCase() === k.toUpperCase())?.[1];
    const roots = [get('PROGRAMFILES') ?? 'C:\\Program Files', get('PROGRAMFILES(X86)') ?? 'C:\\Program Files (x86)', get('LOCALAPPDATA')].filter(Boolean);
    const rels = [
      ['Google', 'Chrome', 'Application', 'chrome.exe'],
      ['Microsoft', 'Edge', 'Application', 'msedge.exe'],
      ['Chromium', 'Application', 'chrome.exe'],
    ];
    return [...new Set(rels.flatMap((r) => roots.map((root) => win32.join(root, ...r))))];
  }
  if (platform === 'darwin') {
    const apps = [
      ['Google Chrome.app', 'Google Chrome'],
      ['Microsoft Edge.app', 'Microsoft Edge'],
      ['Chromium.app', 'Chromium'],
    ];
    const roots = ['/Applications', ...(env.HOME ? [posix.join(env.HOME, 'Applications')] : [])];
    return apps.flatMap(([app, bin]) => roots.map((root) => posix.join(root, app, 'Contents', 'MacOS', bin)));
  }
  const names = ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'microsoft-edge', 'microsoft-edge-stable'];
  const dirs = String(env.PATH ?? '').split(':').filter(Boolean);
  return names.flatMap((n) => dirs.map((d) => posix.join(d, n)));
}

const isFile = (p) => { try { return statSync(p).isFile(); } catch { return false; } };

// The first candidate that exists, or null.
export function findBrowser(candidates = browserCandidates()) {
  return candidates.find(isFile) ?? null;
}

// ---- Timeouts ---------------------------------------------------------------------------------

export function withTimeout(promise, ms, what) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, fail) => { timer = setTimeout(() => fail(new Error(`${what}: timed out after ${ms} ms`)), ms); }),
  ]).finally(() => clearTimeout(timer));
}

// ---- Starting and stopping the browser --------------------------------------------------------

const ARGS = [
  '--headless=new', '--remote-debugging-port=0', '--no-first-run', '--no-default-browser-check',
  '--disable-extensions', '--disable-sync', '--disable-background-networking', '--disable-component-update',
  '--disable-default-apps', '--disable-popup-blocking', '--disable-background-timer-throttling',
  '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--metrics-recording-only',
  '--password-store=basic', '--use-mock-keychain', '--hide-scrollbars', '--mute-audio',
  '--force-color-profile=srgb', '--font-render-hinting=none',
];

// { child, profile, endpoint } once the browser prints its DevTools address.
function start(exe, profile) {
  const child = spawn(exe, [...ARGS, `--user-data-dir=${profile}`, 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'], windowsHide: true });
  return new Promise((ok, fail) => {
    let log = '';
    const done = (err, endpoint) => {
      clearTimeout(timer);
      child.off('exit', onExit);
      child.off('error', onError);
      if (err) fail(err); else ok({ child, endpoint });
    };
    const onData = (d) => {
      if (log === null) return; // keep draining stderr after the address was read
      log += d;
      const m = /DevTools listening on (ws:\/\/\S+)/.exec(log);
      if (m) { log = null; done(null, m[1]); }
      else if (log.length > 65_536) log = log.slice(-16_384);
    };
    const onExit = (code, signal) => done(new Error(`the browser exited (${signal ?? `code ${code}`}): ${String(log ?? '').trim().split(/\r?\n/).slice(-3).join(' ') || 'no output'}`));
    const onError = (e) => done(e);
    const timer = setTimeout(() => done(new Error(`no DevTools address after ${LAUNCH_TIMEOUT_MS} ms`)), LAUNCH_TIMEOUT_MS);
    child.stderr.setEncoding('utf8');
    child.stderr.on('data', onData);
    child.once('exit', onExit);
    child.once('error', onError);
  });
}

const exited = (child) => child.exitCode !== null || child.signalCode !== null;

function kill(child) {
  if (exited(child)) return;
  if (process.platform === 'win32' && child.pid) {
    spawnSync('taskkill', ['/pid', String(child.pid), '/t', '/f'], { windowsHide: true, timeout: 10_000, stdio: 'ignore' });
  }
  try { child.kill('SIGKILL'); } catch { /* gone */ }
}

const waitExit = (child, ms) => (exited(child)
  ? Promise.resolve(true)
  : new Promise((r) => { const t = setTimeout(() => r(false), ms); child.once('exit', () => { clearTimeout(t); r(true); }); }));

// ---- CDP client -------------------------------------------------------------------------------

class Connection {
  constructor(ws) {
    this.ws = ws;
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Set();
    this.closed = null;
    ws.addEventListener('message', (ev) => {
      let msg;
      try { msg = JSON.parse(typeof ev.data === 'string' ? ev.data : Buffer.from(ev.data).toString('utf8')); } catch { return; }
      if (msg.id !== undefined) {
        const p = this.pending.get(msg.id);
        if (!p) return;
        this.pending.delete(msg.id);
        if (msg.error) p.fail(new Error(`${p.method}: ${msg.error.message}${msg.error.data ? ` (${msg.error.data})` : ''}`));
        else p.ok(msg.result ?? {});
      } else {
        for (const l of this.listeners) l(msg);
      }
    });
    ws.addEventListener('close', () => {
      this.closed = new Error('the DevTools connection closed');
      for (const p of this.pending.values()) p.fail(this.closed);
      this.pending.clear();
    });
  }

  static open(endpoint) {
    const ws = new WebSocket(endpoint);
    return withTimeout(new Promise((ok, fail) => {
      ws.addEventListener('open', () => ok(new Connection(ws)), { once: true });
      ws.addEventListener('error', (e) => fail(new Error(`DevTools connection failed: ${e?.message ?? 'error'}`)), { once: true });
    }), LAUNCH_TIMEOUT_MS, 'DevTools connection');
  }

  send(method, params = {}, sessionId, timeout = COMMAND_TIMEOUT_MS) {
    if (this.closed) return Promise.reject(this.closed);
    const id = this.nextId++;
    const reply = new Promise((ok, fail) => this.pending.set(id, { ok, fail, method }));
    this.ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
    return withTimeout(reply, timeout, method).finally(() => this.pending.delete(id));
  }

  on(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }

  close() { try { this.ws.close(); } catch { /* closed */ } }
}

// Keys `press` knows by name (a single character is typed as itself).
const KEYS = {
  Enter: { code: 'Enter', vk: 13, text: '\r' }, Escape: { code: 'Escape', vk: 27 }, Tab: { code: 'Tab', vk: 9 },
  Backspace: { code: 'Backspace', vk: 8 }, Delete: { code: 'Delete', vk: 46 }, Space: { code: 'Space', vk: 32, text: ' ' },
  ArrowUp: { code: 'ArrowUp', vk: 38 }, ArrowDown: { code: 'ArrowDown', vk: 40 }, ArrowLeft: { code: 'ArrowLeft', vk: 37 },
  ArrowRight: { code: 'ArrowRight', vk: 39 }, Home: { code: 'Home', vk: 36 }, End: { code: 'End', vk: 35 },
};

// ---- A page in its own browser context ---------------------------------------------------------

// The page adapter the capture loop drives (same shape as the Playwright one in web.mjs).
async function openPage(conn, { width, height, theme, initScript }) {
  const { browserContextId } = await conn.send('Target.createBrowserContext', { disposeOnDetach: true });
  const dispose = () => conn.send('Target.disposeBrowserContext', { browserContextId }).catch(() => {});
  try {
    const { targetId } = await conn.send('Target.createTarget', { url: 'about:blank', browserContextId });
    const { sessionId } = await conn.send('Target.attachToTarget', { targetId, flatten: true });
    const send = (method, params, timeout) => conn.send(method, params, sessionId, timeout);

    const errors = [];
    const inflight = new Set();
    const documents = new Map();
    let lastActivity = Date.now();
    let loadWaiters = [];
    const off = conn.on((msg) => {
      if (msg.sessionId !== sessionId) return;
      const p = msg.params ?? {};
      switch (msg.method) {
        case 'Runtime.exceptionThrown': {
          const d = p.exceptionDetails ?? {};
          errors.push(String(d.exception?.description ?? d.text ?? 'exception').split('\n')[0]);
          break;
        }
        case 'Runtime.consoleAPICalled':
          if (p.type === 'error') errors.push(`console: ${(p.args ?? []).map((a) => (a.value !== undefined ? String(a.value) : a.description ?? '')).join(' ')}`);
          break;
        case 'Log.entryAdded':
          // The browser's own /favicon.ico request is not the page's.
          if (p.entry?.level === 'error' && !/\/favicon\.ico(?:$|\?)/.test(p.entry.url ?? '')) {
            errors.push(`console: ${p.entry.text}${p.entry.url ? ` (${p.entry.url})` : ''}`);
          }
          break;
        case 'Network.requestWillBeSent': inflight.add(p.requestId); lastActivity = Date.now(); break;
        case 'Network.loadingFinished':
        case 'Network.loadingFailed': inflight.delete(p.requestId); lastActivity = Date.now(); break;
        case 'Network.responseReceived':
          if (p.type === 'Document') documents.set(p.loaderId, p.response?.status);
          break;
        case 'Page.loadEventFired': for (const w of loadWaiters) w(); loadWaiters = []; break;
        default:
      }
    });

    await Promise.all([send('Page.enable'), send('Runtime.enable'), send('Network.enable'), send('Log.enable')]);
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false, screenWidth: width, screenHeight: height });
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: theme }, { name: 'prefers-reduced-motion', value: 'reduce' }] });
    if (initScript) await send('Page.addScriptToEvaluateOnNewDocument', { source: initScript });

    const evaluate = async (fn, arg) => {
      const expression = `(${fn})(${arg === undefined ? '' : JSON.stringify(arg)})`;
      const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, userGesture: false });
      if (r.exceptionDetails) {
        const d = r.exceptionDetails;
        throw new Error(`in page: ${String(d.exception?.description ?? d.text).split('\n')[0]}`);
      }
      return r.result?.value;
    };

    return {
      errors,
      async goto(url, timeout) {
        const loaded = new Promise((r) => loadWaiters.push(r));
        const nav = await send('Page.navigate', { url }, timeout);
        if (nav.errorText) throw new Error(`${nav.errorText} for ${url}`);
        await withTimeout(loaded, timeout, `load of ${url}`);
        const status = documents.get(nav.loaderId);
        if (status && (status < 200 || status > 299)) throw new Error(`HTTP ${status} for ${url}`);
      },
      async idle(timeout) {
        const end = Date.now() + timeout;
        while (Date.now() < end) {
          if (inflight.size === 0 && Date.now() - lastActivity >= IDLE_QUIET_MS) return true;
          await new Promise((r) => setTimeout(r, 50));
        }
        return false;
      },
      evaluate,
      async click(x, y) {
        const m = { x, y, button: 'left', clickCount: 1 };
        await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
        await send('Input.dispatchMouseEvent', { type: 'mousePressed', buttons: 1, ...m });
        await send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...m });
      },
      insertText: (text) => send('Input.insertText', { text }),
      async press(name) {
        const k = KEYS[name] ?? (name.length === 1 ? { code: /[a-z]/i.test(name) ? `Key${name.toUpperCase()}` : '', vk: name.toUpperCase().charCodeAt(0), text: name } : null);
        if (!k) throw new Error(`unknown key "${name}"`);
        const e = { key: name, code: k.code, windowsVirtualKeyCode: k.vk, nativeVirtualKeyCode: k.vk };
        await send('Input.dispatchKeyEvent', { type: k.text ? 'keyDown' : 'rawKeyDown', ...e, ...(k.text ? { text: k.text } : {}) });
        await send('Input.dispatchKeyEvent', { type: 'keyUp', ...e });
      },
      async screenshot(path) {
        const m = await send('Page.getLayoutMetrics');
        const size = m.cssContentSize ?? m.contentSize;
        const clip = { x: 0, y: 0, width: Math.max(width, Math.ceil(size.width)), height: Math.max(height, Math.ceil(size.height)), scale: 1 };
        const shot = await send('Page.captureScreenshot', { format: 'png', clip, captureBeyondViewport: true, fromSurface: true }, 120_000);
        writeFileSync(path, Buffer.from(shot.data, 'base64'));
      },
      async close() {
        off();
        await conn.send('Target.closeTarget', { targetId }).catch(() => {});
        await dispose();
      },
    };
  } catch (e) {
    await dispose();
    throw e;
  }
}

// ---- A run ------------------------------------------------------------------------------------

// launchCdp(exe) -> { version, profile, openPage(opts), close() }. On failure the error carries
// .profile (already removed).
export async function launchCdp(exe) {
  const profile = mkdtempSync(join(tmpdir(), 'm3-browser-'));
  let child;
  let conn;
  const close = async () => {
    if (conn) {
      await conn.send('Browser.close', {}, undefined, CLOSE_TIMEOUT_MS).catch(() => {});
      conn.close();
    }
    if (child && !(await waitExit(child, CLOSE_TIMEOUT_MS))) {
      kill(child);
      await waitExit(child, CLOSE_TIMEOUT_MS);
    }
    // The profile can stay locked for a moment after the browser exits (Windows).
    rmSync(profile, { recursive: true, force: true, maxRetries: 20, retryDelay: 250 });
  };
  try {
    const s = await start(exe, profile);
    child = s.child;
    conn = await Connection.open(s.endpoint);
    const v = await conn.send('Browser.getVersion');
    return {
      version: String(v.product ?? '').replace(/^[^/]*\//, '') || null,
      product: v.product ?? null,
      profile,
      openPage: (opts) => openPage(conn, opts),
      close,
    };
  } catch (e) {
    await close().catch(() => {});
    e.profile = profile;
    throw e;
  }
}
