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

const SECTIONS = new Set(['styles', 'foundations', 'components']);

export function classify(path) {
  const first = String(path).split('/').filter(Boolean)[0]?.toLowerCase() ?? '';
  const expressiveUrl = /expressive/i.test(path);
  if (SECTIONS.has(first)) return { inScope: true, section: first, expressiveUrl };
  if (expressiveUrl) return { inScope: true, section: 'expressive', expressiveUrl };
  return { inScope: false, section: null, expressiveUrl };
}
