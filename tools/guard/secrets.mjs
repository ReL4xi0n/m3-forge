// Secret scanner shared by the public guard (rule `secret`) and the eval runner, which scans every
// transcript and output before it enters the private repo. Hits never contain the secret itself.
const RULES = [
  { rule: 'anthropic-key', re: /sk-ant-[A-Za-z0-9]{2,8}-[A-Za-z0-9_-]{20,}/g },
  { rule: 'github-token', re: /\bgh[pousr]_[A-Za-z0-9]{30,}\b/g },
  { rule: 'github-token', re: /\bgithub_pat_[A-Za-z0-9_]{40,}\b/g },
  { rule: 'private-key', re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/g },
  { rule: 'token-field', re: /"(?:access|refresh)_?[Tt]oken"\s*:\s*"[^"\s]{16,}"/g },
  { rule: 'bearer', re: /\bBearer\s+[A-Za-z0-9._~+/-]{20,}=*/g },
  { rule: 'aws-key', re: /\bAKIA[0-9A-Z]{16}\b/g },
];

const escapeRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function rulesFor(literals) {
  const extra = (literals || []).filter(l => typeof l === 'string' && l.length >= 12)
    .map(l => ({ rule: 'known-secret', re: new RegExp(escapeRe(l), 'g') }));
  return [...extra, ...RULES];
}

// → [{ rule, line, column }]; overlapping matches of later rules are dropped.
export function scanSecrets(text, { literals = [] } = {}) {
  const hits = [];
  const taken = [];
  for (const { rule, re } of rulesFor(literals)) {
    re.lastIndex = 0;
    for (let m; (m = re.exec(text));) {
      const [s, e] = [m.index, m.index + m[0].length];
      if (taken.some(([a, b]) => s < b && e > a)) continue;
      taken.push([s, e]);
      const before = text.slice(0, s);
      const line = before.split('\n').length;
      hits.push({ rule, line, column: s - before.lastIndexOf('\n') });
    }
  }
  return hits.sort((a, b) => a.line - b.line || a.column - b.column);
}

export function redactSecrets(text, { literals = [] } = {}) {
  let out = text;
  let count = 0;
  for (const { rule, re } of rulesFor(literals)) {
    out = out.replace(re, () => { count++; return `[REDACTED:${rule}]`; });
  }
  return { text: out, count };
}
