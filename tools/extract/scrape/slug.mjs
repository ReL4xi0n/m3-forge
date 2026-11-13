// URL path -> file-system-safe name. The SHA-1 suffix keeps paths that differ only in case (or in
// characters that sanitize to the same thing) apart on case-insensitive file systems.
import { createHash } from 'node:crypto';

export function slugFor(path) {
  const base = String(path)
    .split('/')
    .filter(Boolean)
    .map(seg => seg.toLowerCase().replace(/[^a-z0-9-]+/g, '-'))
    .join('__') || 'root';
  return `${base}~${createHash('sha1').update(String(path)).digest('hex').slice(0, 8)}`;
}
