// Politeness: at least 3 s between page navigations (longer if robots.txt sets a crawl delay), and
// exponential backoff on HTTP 429/503.
export const MIN_DELAY_MS = 3000;

export function createPacer({
  minDelayMs = MIN_DELAY_MS,
  crawlDelaySec = null,
  now = Date.now,
  sleep = ms => new Promise(r => setTimeout(r, ms)),
} = {}) {
  if (minDelayMs < MIN_DELAY_MS) throw new Error(`minimum delay is ${MIN_DELAY_MS} ms`);
  const gap = Math.max(minDelayMs, crawlDelaySec ? crawlDelaySec * 1000 : 0);
  let last = null;
  return {
    async wait() {
      if (last !== null) {
        const left = last + gap - now();
        if (left > 0) await sleep(left);
      }
      last = now();
    },
    async backoff(attempt, retryAfterSec) {
      await sleep(Math.max(retryAfterSec ? retryAfterSec * 1000 : 0, 30000 * 2 ** attempt));
      last = now();
    },
  };
}
