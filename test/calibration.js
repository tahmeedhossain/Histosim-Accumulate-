// Prints the calibrated run (seed 1917, all levers at 50): decade table, events,
// deaths by category and the calibration anchors shown in the page's notes.
// Usage: node test/calibration.js [lever=value ...]   e.g. node test/calibration.js labour=80
const E = require('../src/engine.js');

const levers = {};
process.argv.slice(2).forEach((a) => { const m = a.match(/^(\w+)=(\d+)$/); if (m) levers[m[1]] = +m[2]; });
const model = E.createModel({ seed: 1917, levers });
const h = model.runTo(E.END);
const at = (y) => h[y - h[0].t];
const f = (x, d = 2) => (x === undefined || x === null || !isFinite(x)) ? '  na' : x.toFixed(d);
const p = (x, d = 1) => (x * 100).toFixed(d) + '%';

console.log('Levers:', Object.keys(levers).length ? JSON.stringify(levers) : 'all at 50 (calibrated)');
console.log('\nyear  stage                                 ypcCore    u     U  omega     r     M     F   top1    DS');
for (const r of h) {
  if (r.t % 10 !== 0 && ![1913, 1929, 1973, 2008, 2026].includes(r.t)) continue;
  console.log(String(r.t).padEnd(6) + r.phase.slice(0, 36).padEnd(37) + f(r.ypcCore, 0).padStart(8) + ' ' +
    [r.u, r.U, r.omega, r.r, r.M, r.F, r.top1, r.DS].map((x) => f(x).padStart(5)).join(' '));
}

console.log('\nEvents (* = major):');
for (const e of model.state.events) console.log(e.t, e.type, e.major ? '*' : '');

const last = h[h.length - 1];
let A = 0, T = 0;
console.log('\nDeaths to 2026, millions (attributable / total excess):');
for (const k of E.CAT) { console.log(k.padEnd(14), f(last.cum[k].attr, 1).padStart(8), f(last.cum[k].total, 1).padStart(8)); A += last.cum[k].attr; T += last.cum[k].total; }
console.log('all'.padEnd(14), f(A, 1).padStart(8), f(T, 1).padStart(8));

const sumK = (a, b, k) => h.filter((r) => r.t >= a && r.t <= b).reduce((s, r) => s + r.dy[k].total, 0);
const ev = model.state.events;
const wars = ev.filter((e) => e.type === 'war');
const warToll = (w) => { const end = (ev.find((e) => e.type === 'warEnd' && e.n === w.n) || { t: w.t + 6 }).t; return sumK(w.t, end, 'war'); };
console.log('\nCalibration anchors (data | model):');
console.log('Developed share of world manufacturing 1913 | 92.5% |', p(at(1913).mfg.core + at(1913).mfg.A));
console.log('China share of world manufacturing 1830, 1900 | 29.8%, 6.2% |', p(at(1830).mfg.B) + ', ' + p(at(1900).mfg.B));
console.log('GDP per head W. Europe 1913, 1998 | $3,473, $17,921 |', f(at(1913).ypcCore, 0) + ', ' + f(at(1998).ypcCore, 0));
console.log('GDP per head Africa 1913, 1998 | $585, $1,368 |', f(at(1913).seg.C.ypc, 0) + ', ' + f(at(1998).seg.C.ypc, 0));
console.log('Famine deaths 1876-79 + 1896-1902 (Davis) | 31.7-61.3 M |', f(sumK(1876, 1879, 'famine') + sumK(1896, 1902, 'famine'), 1) + ' M');
if (wars[0]) console.log('First World War deaths | 8.5-10 M soldiers + civilians |', f(warToll(wars[0]), 1) + ' M');
if (wars[1]) console.log('Second World War deaths | 40-50 M; 60-75 M with famine and disease |', f(warToll(wars[1]), 1) + ' M');
console.log('US labour share 1960, 2026 | 66.2%, 52.8% |', p(at(1960).omega) + ', ' + p(at(2026).omega));
console.log('US top 1% 1928, 1975, 2024 | 23.9%, 8.9%, 22.4% |', [1928, 1975, 2024].map((y) => p(at(y).top1)).join(', '));
console.log('Dollar share of reserves 1999, 2026 | 71.0%, 56.7% |', p(at(1999).DS) + ', ' + p(at(2026).DS));
console.log('Finance share of profits 1950, 2002 | 8.8%, 38.1% |', p(at(1950).finShare) + ', ' + p(at(2002).finShare));
