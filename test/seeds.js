// First year of each major event across seeds (all levers at 50).
// Usage: node test/seeds.js [seed,seed,...]
const E = require('../src/engine.js');
const keys = ['openingB', 'rebellionB', 'imperialism', 'war', 'revolutionA', 'depression', 'fascism', 'compromise', 'revolutionB',
  'restorationA', 'nixonShock', 'profitSqueeze', 'restorationB', 'neoliberal', 'debtCrisis', 'collapseA', 'rivalJoins',
  'financialCrisis', 'nationalist', 'monofin', 'radical'];
const seeds = (process.argv[2] || '1917,1,2,3,42,1848,7,99').split(',').map(Number);
console.log('seed  ' + keys.map((k) => k.slice(0, 7).padStart(10)).join(''));
for (const sd of seeds) {
  const m = E.createModel({ seed: sd }); m.runTo(E.END);
  const ev = m.state.events;
  const row = keys.map((k) => { const es = ev.filter((e) => e.type === k); return (es.length ? es.map((e) => e.t).join('/') : '-').padStart(10); }).join('');
  console.log(String(sd).padEnd(6) + row);
}
