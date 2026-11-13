// robots.txt parsing with Google's matching rules, applied to the `User-agent: *` group.
// Longest matching pattern wins; Allow wins a tie; `*` matches any run of characters; a trailing
// `$` anchors the end of the URL path + query.

export function parseRobots(text) {
  const groups = [];
  const sitemaps = [];
  let current = null;
  let lastWasAgent = false;
  for (const rawLine of String(text).split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, '').trim();
    const m = /^([A-Za-z-]+)\s*:\s*(.*)$/.exec(line);
    if (!m) continue;
    const field = m[1].toLowerCase();
    const value = m[2].trim();
    if (field === 'sitemap') {
      sitemaps.push(value);
      continue;
    }
    if (field === 'user-agent') {
      if (!lastWasAgent) {
        current = { agents: [], rules: [], crawlDelay: null };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
      continue;
    }
    lastWasAgent = false;
    if (!current) continue;
    if ((field === 'allow' || field === 'disallow') && value) {
      current.rules.push({ allow: field === 'allow', pattern: value, re: toRegExp(value) });
    } else if (field === 'crawl-delay' && /^\d+(\.\d+)?$/.test(value)) {
      current.crawlDelay = Number(value);
    }
  }
  const star = groups.find(g => g.agents.includes('*')) || { rules: [], crawlDelay: null };
  return { rules: star.rules, crawlDelay: star.crawlDelay, sitemaps };
}

function toRegExp(pattern) {
  const anchored = pattern.endsWith('$');
  const body = (anchored ? pattern.slice(0, -1) : pattern)
    .split('*')
    .map(s => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&'))
    .join('.*');
  return new RegExp(`^${body}${anchored ? '$' : ''}`);
}

export function isAllowed(robots, pathAndQuery) {
  let best = null;
  for (const r of robots.rules) {
    if (!r.re.test(pathAndQuery)) continue;
    if (!best || r.pattern.length > best.pattern.length || (r.pattern.length === best.pattern.length && r.allow)) best = r;
  }
  return best ? best.allow : true;
}

export function crawlDelaySeconds(robots) {
  return robots.crawlDelay;
}
