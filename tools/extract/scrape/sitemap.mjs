// Sitemap parsing (urlset or sitemapindex) and scope classification for m3.material.io paths.

const ENTITIES = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'" };

function locs(xml, tag) {
  const out = [];
  const re = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, 'g');
  for (const m of xml.matchAll(re)) {
    const loc = /<loc>([\s\S]*?)<\/loc>/.exec(m[1]);
    if (loc) out.push(loc[1].trim().replace(/&(amp|lt|gt|quot|apos);/g, e => ENTITIES[e]));
  }
  return out;
}

export function parseSitemap(xml) {
  return { urls: locs(String(xml), 'url'), sitemaps: locs(String(xml), 'sitemap') };
}

const SECTIONS = new Set(['styles', 'foundations', 'components', 'develop']);
// Top-level articles kept in scope by owner decision (2026-11-13): Expressive / platform news.
const NEWS = new Set(['/whats-new-at-io26', '/material-is-compose-first']);

// candidate: a blog post. It is scraped, then kept only if its text has Expressive or token content
// (see relevance() in run.mjs); otherwise it is recorded as checked and excluded.
export function classify(path) {
  const segs = String(path).split(/[/?]/).filter(Boolean).map(s => s.toLowerCase());
  const first = segs[0] ?? '';
  const expressiveUrl = /expressive/i.test(path);
  if (SECTIONS.has(first)) return { inScope: true, section: first, expressiveUrl, candidate: false };
  if (first === 'blog') {
    const candidate = segs.length > 1 && !/^search\.html$/.test(segs[1]);
    return { inScope: false, section: 'blog', expressiveUrl, candidate };
  }
  if (NEWS.has(String(path))) return { inScope: true, section: 'news', expressiveUrl, candidate: false };
  if (expressiveUrl) return { inScope: true, section: 'expressive', expressiveUrl, candidate: false };
  return { inScope: false, section: null, expressiveUrl, candidate: false };
}
