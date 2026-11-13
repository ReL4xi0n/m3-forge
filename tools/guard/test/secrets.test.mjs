import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scanSecrets, redactSecrets } from '../secrets.mjs';
import { checkFiles } from '../lib.mjs';

// Fake values are assembled at runtime so this file never contains a secret-shaped literal.
const fake = {
  oauth: 'sk-ant-' + 'oat01-' + 'A1b2C3d4'.repeat(6),
  api: 'sk-ant-' + 'api03-' + 'Z9y8X7w6'.repeat(6),
  gh: 'gh' + 'p_' + 'a1B2c3D4e5'.repeat(4),
  pat: 'github' + '_pat_' + 'x1Y2z3'.repeat(10),
  pem: '-----BEGIN ' + 'OPENSSH PRIVATE KEY-----',
  json: '"access' + 'Token": "' + 'q'.repeat(30) + '"',
  bearer: 'Authorization: Bear' + 'er ' + 'eyJ'.padEnd(40, 'k'),
};

test('scanSecrets: finds each kind and never echoes the secret', () => {
  for (const [kind, s] of Object.entries(fake)) {
    const hits = scanSecrets(`line one\nprefix ${s} suffix\n`);
    assert.equal(hits.length, 1, kind);
    assert.equal(hits[0].line, 2, kind);
    assert.ok(!JSON.stringify(hits).includes(s.slice(12)), `${kind}: hit must not contain the secret`);
  }
  assert.deepEqual(scanSecrets('sk-ant is mentioned in prose; tokens are rotated yearly.'), []);
});

test('scanSecrets: a literal value passed in is found even without a known shape', () => {
  const literal = 'plainvalue-' + '7'.repeat(20);
  assert.equal(scanSecrets(`x ${literal} y`, { literals: [literal] }).length, 1);
  assert.equal(scanSecrets('nothing here', { literals: [literal] }).length, 0);
});

test('redactSecrets: replaces every hit with a rule tag', () => {
  const r = redactSecrets(`a ${fake.oauth} b ${fake.gh} c`);
  assert.equal(r.count, 2);
  assert.ok(!r.text.includes(fake.oauth) && !r.text.includes(fake.gh));
  assert.match(r.text, /\[REDACTED:anthropic-key\]/);
});

test('guard: a staged file holding a token is blocked by the secret rule (not allowlistable)', () => {
  const v = checkFiles({
    files: [{ path: 'docs/notes.md', content: Buffer.from(`token: ${fake.oauth}\n`) }],
    forbiddenTerms: [], corpus: null, allowlist: [{ rule: 'secret', path: 'docs/notes.md', key: '*' }],
  });
  assert.equal(v.filter(x => x.rule === 'secret').length, 1);
  assert.ok(!JSON.stringify(v).includes(fake.oauth.slice(12)));
});
