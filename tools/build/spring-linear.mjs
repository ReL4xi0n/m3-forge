// Spring -> CSS linear() easing. The analytic solution of a damped spring (unit mass, target 1,
// start at rest): stiffness k [N/m] and damping ratio z give w0 = sqrt(k) and the response below.
// Nothing is tuned by hand: the duration is the time after which the motion stays within `epsilon`
// of the target, and the samples are uniform in time plus every extremum of the response.

// Position of the spring at time t (seconds), 0 at t = 0 and 1 at rest.
export function springPosition({ damping, stiffness }, t) {
  const w0 = Math.sqrt(stiffness);
  const z = damping;
  if (z < 1) {
    const a = z * w0;
    const wd = w0 * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-a * t) * (Math.cos(wd * t) + (a / wd) * Math.sin(wd * t));
  }
  if (z === 1) return 1 - Math.exp(-w0 * t) * (1 + w0 * t);
  const s = w0 * Math.sqrt(z * z - 1);
  const r1 = -w0 * z + s;
  const r2 = -w0 * z - s;
  return 1 - (r2 * Math.exp(r1 * t) - r1 * Math.exp(r2 * t)) / (r2 - r1);
}

// Times (seconds, ascending) of the local extrema of an underdamped spring: n * pi / wd.
export function extremaTimes({ damping, stiffness }, until) {
  if (damping >= 1) return [];
  const wd = Math.sqrt(stiffness) * Math.sqrt(1 - damping * damping);
  const out = [];
  for (let n = 1; (n * Math.PI) / wd < until; n++) out.push((n * Math.PI) / wd);
  return out;
}

const STEP_S = 0.0005;
const LIMIT_S = 30;

// Smallest whole millisecond after which |1 - position| stays <= epsilon.
function settleMs(spring, epsilon) {
  let last = 0;
  for (let t = 0; t <= LIMIT_S; t += STEP_S) if (Math.abs(1 - springPosition(spring, t)) > epsilon) last = t;
  return Math.ceil(last * 1000) + 1;
}

const fmt = (x, d) => String(Number(x.toFixed(d)));

export function springToLinear({ damping, stiffness }, { samples = 64, epsilon = 0.001 } = {}) {
  if (!(damping > 0) || !(stiffness > 0)) throw new Error(`spring needs positive damping and stiffness (got ${damping}, ${stiffness})`);
  const spring = { damping, stiffness };
  const durationMs = settleMs(spring, epsilon);
  const T = durationMs / 1000;
  const times = new Set();
  for (let i = 0; i < samples; i++) times.add((T * i) / (samples - 1));
  for (const t of extremaTimes(spring, T)) times.add(t);
  const pts = [...times].sort((a, b) => a - b).map(t => {
    const pct = (t / T) * 100;
    return { pct, v: t === 0 ? 0 : t >= T ? 1 : springPosition(spring, t) };
  });
  const parts = pts.map(({ pct, v }, i) => {
    if (i === 0) return '0';
    if (i === pts.length - 1) return '1';
    return `${fmt(v, 4)} ${pct.toFixed(2)}0%`; // 3 decimals, the last always 0: whole-percent text never appears inside a longer number
  });
  return { easing: `linear(${parts.join(', ')})`, durationMs };
}
