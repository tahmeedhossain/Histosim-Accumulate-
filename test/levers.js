// Event years for each lever set low and high (seed 1917, other levers at 50).
// Usage: node test/levers.js [low] [high]     defaults: 20 80
const E = require('../src/engine.js');
const lo = +(process.argv[2] || 20), hi = +(process.argv[3] || 80);
const keys = ['imperialism', 'war', 'revolutionA', 'fascism', 'compromise', 'newDeal', 'revolutionB', 'restorationA', 'restorationB',
  'neoliberal', 'radical', 'debtCrisis', 'collapseA', 'rivalJoins', 'financialCrisis', 'nationalist'];
const runs = [['calibrated', {}]];
for (const k of Object.keys(E.DEFAULT_LEVERS)) for (const v of [lo, hi]) runs.push([k + '=' + v, { [k]: v }]);
for (const [name, lv] of runs) {
  const m = E.createModel({ seed: 1917, levers: lv }); const h = m.runTo(E.END);
  const ev = m.state.events;
  const row = keys.map((k) => { const es = ev.filter((e) => e.type === k); return k.slice(0, 7) + ':' + (es.length ? es.map((e) => e.t).join('/') : '-'); }).join(' ');
  const L = h[h.length - 1]; const att = E.CAT.reduce((a, k) => a + L.cum[k].attr, 0);
  console.log(name.padEnd(16), row, '| attributable deaths', att.toFixed(0), 'M');
}
