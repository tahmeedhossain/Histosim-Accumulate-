// Stress test: every lever at 0 and 100, then random lever settings and seeds.
// Fails (exit code 1) if any run produces a non-finite value, a non-positive population or negative deaths.
const E = require('../src/engine.js');
const keys = Object.keys(E.DEFAULT_LEVERS);
let bad = 0, n = 0;
const t0 = Date.now();
function check(lv, seed) {
  const m = E.createModel({ seed, levers: lv }); const h = m.runTo(E.END); n++;
  for (const r of h) {
    for (const k of ['Y', 'U', 'omega', 'r', 'M', 'F', 'top1', 'H', 'DS', 'u', 'i', 'pi', 'massCons', 'Ck', 'I', 'G']) {
      if (!isFinite(r[k])) { bad++; console.log('non-finite', k, JSON.stringify(lv), seed, r.t); return; }
    }
    for (const s of ['A', 'B', 'C']) if (!isFinite(r.seg[s].pop) || r.seg[s].pop <= 0 || !isFinite(r.seg[s].c)) { bad++; console.log('zone', s, JSON.stringify(lv), seed, r.t); return; }
    if (r.P <= 0) { bad++; console.log('core population <= 0', JSON.stringify(lv), seed, r.t); return; }
    if (r.totDeaths < 0) { bad++; console.log('negative deaths', JSON.stringify(lv), seed, r.t); return; }
  }
}
for (const k of keys) for (const v of [0, 100]) check({ [k]: v }, 1917);
let rs = 7; const rnd = () => { rs = (rs * 1103515245 + 12345) % 2147483648; return rs / 2147483648; };
for (let j = 0; j < 120; j++) { const lv = {}; for (const k of keys) lv[k] = Math.round(rnd() * 100); check(lv, Math.floor(rnd() * 10000)); }
console.log(`runs ${n}, failures ${bad}, ${((Date.now() - t0) / n).toFixed(1)} ms per run`);
process.exit(bad ? 1 : 0);
