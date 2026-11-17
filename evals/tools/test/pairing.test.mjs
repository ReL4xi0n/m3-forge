import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cellTarget, pairAnchors } from '../pairing.mjs';

const anchors = ['android-m3-dashboard-dark-1.png', 'android-m3-detail-light-1.png', 'android-m3-empty-light-1.png',
  'android-m3-form-light-1.png', 'android-m3-settings-light-1.png', 'web-google-app-dark-1.png',
  'web-google-empty-light-1.png', 'web-google-signup-light-1.png', 'webmobile-google-landing-light-1.png']
  .map((name, i) => ({ name, file: `anchors/a${i}.png` }));
const byFile = Object.fromEntries(anchors.map(a => [a.file, a.name]));
const names = target => pairAnchors(target, anchors).map(f => byFile[f]);

test('pairAnchors: same family, closest screen first, then the other theme', () => {
  assert.deepEqual(names(cellTarget({ platform: 'compose', request: 'settings' })), ['android-m3-settings-light-1.png', 'android-m3-dashboard-dark-1.png']);
  assert.deepEqual(names(cellTarget({ platform: 'flutter', request: 'dashboard' })), ['android-m3-dashboard-dark-1.png', 'android-m3-detail-light-1.png']);
  assert.deepEqual(names(cellTarget({ platform: 'web', request: 'onboarding' })), ['web-google-signup-light-1.png', 'web-google-app-dark-1.png']);
  assert.deepEqual(names(cellTarget({ platform: 'web', request: 'landing' })), ['webmobile-google-landing-light-1.png', 'web-google-app-dark-1.png']);
});

test('pairAnchors: never pairs across platform families', () => {
  for (const request of ['landing', 'settings', 'dashboard', 'product-detail', 'onboarding', 'empty-error']) {
    assert.ok(names(cellTarget({ platform: 'flutter', request })).every(n => n.startsWith('android-')));
    assert.ok(names(cellTarget({ platform: 'web', request })).every(n => n.startsWith('web')));
  }
});
