// Owner reference screenshot names: <platform>-<style>-<screen>-<theme>-<n>.png; platform android |
// web | webmobile; style is a free label (the owner used "m3" and "google"). A module of its own so
// pairing.mjs and calibrate.mjs can both import it without a cycle.
const REF = /^(android|webmobile|web)-([a-z0-9]+)-(.+)-(light|dark)-(\d+)\.png$/;

export function parseRefName(name) {
  const m = name.match(REF);
  return m ? { platform: m[1], style: m[2], screen: m[3], theme: m[4], n: Number(m[5]) } : null;
}
