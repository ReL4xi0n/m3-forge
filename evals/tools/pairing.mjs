// Judge v2 side-by-side references (owner decision, 2026-11-17, option a). Every judged output is
// paired with up to two anchor screenshots (real first-party screens, the frozen anchor set) of the
// same platform family: the closest screen type and form factor first, then one in the other theme,
// so the judge sees the first-party bar for light and dark.
import { parseRefName } from './refs.mjs';

// Request (evals/prompts/<name>.md) or reference screen -> screen types an anchor can match.
export const SCREENS = {
  landing: ['landing'], settings: ['settings'], dashboard: ['dashboard', 'app', 'list'],
  'product-detail': ['detail', 'product-detail'], onboarding: ['form', 'signup', 'onboarding'],
  'empty-error': ['empty', 'error'], empty: ['empty', 'error'], error: ['error', 'empty'],
  detail: ['detail'], form: ['form', 'signup'], signup: ['signup', 'form'], app: ['app', 'dashboard'], list: ['list', 'app'],
};

export const familyOf = platform => (platform === 'web' || platform === 'webmobile' ? 'web' : 'android');

// target: { family: 'android' | 'web', screen, formFactors: ['phone' | 'desktop', ...] }.
// anchors: [{ file, name }] with name = the reference file name. Returns up to two anchor files.
export function pairAnchors(target, anchors) {
  const want = SCREENS[target.screen] ?? [target.screen];
  const scored = anchors.map(a => {
    const r = parseRefName(a.name);
    const ff = r.platform === 'web' ? 'desktop' : 'phone';
    const fam = familyOf(r.platform);
    const screen = want.indexOf(r.screen);
    const score = (fam === target.family ? 100 : 0) + (screen >= 0 ? 20 - screen : 0) + ((target.formFactors ?? []).includes(ff) ? 2 : 0);
    return { ...a, ref: r, score };
  }).filter(a => familyOf(a.ref.platform) === target.family)
    .sort((x, y) => y.score - x.score || x.name.localeCompare(y.name));
  if (!scored.length) return [];
  const first = scored[0];
  const second = scored.find(a => a !== first && a.ref.theme !== first.ref.theme) ?? scored.find(a => a !== first);
  return [first, second].filter(Boolean).map(a => a.file);
}

// A cell (evals/cells.json entry) -> pairing target.
export const cellTarget = cell => ({
  family: cell.platform === 'web' ? 'web' : 'android',
  screen: cell.request,
  formFactors: cell.platform === 'web' ? ['phone', 'desktop'] : ['phone'],
});
