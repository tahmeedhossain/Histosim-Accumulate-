# Accumulate! 1800–2026

A year-by-year simulation of the capitalist world-system from 1800 to 2026. No stage is scheduled. Monopoly, finance capital, imperialism, the dollar system and the nationalist turn begin when the model's own variables cross thresholds, and ten levers change the forces behind those variables, so events can move, change order or not happen at all. The model is stylised and calibrated to historical anchors; it shows mechanisms and is not a forecast.

Play online: https://tahmeedhossain.github.io/Histosim-Accumulate-/ (also at https://claude.ai/artifact/PWZ1RpY1SrDHkj3g2Z3VXf)

## Play it

Open `index.html` in a browser. It is one self-contained file. It needs a network connection only for its Google Fonts and falls back to system fonts without one.

- **Play, +1 year, Run to 2026, Restart.** At each turning point the run pauses and explains what in the model caused it, with its historical counterpart and sources. Untick "Pause at turning points" to run straight through.
- **Levers.** Ten forces, each scaled from ×0 to ×2; 50 is the calibrated value. Changes act from the next simulated year, and grey lines then show the calibrated run for comparison.
- **Timeline.** Drag back to inspect any year. "Branch from" reruns history from that year with the current levers.
- **Seed.** Fixes the random draws (harvest failures, small shocks). The same seed and levers always give the same history.

## What the model contains

- **Zones.** A core of three capitalist powers (an old power, a challenger and a rising power) and three outer zones: zone A is modelled on Russia and the USSR, zone B on China, zone C on the colonised and later formally independent world. Each zone is one aggregate.
- **Core economy.** Capacity `Y* = min(K/κ, A·N)`. Utilisation depends on spending relative to capacity: mass consumption, capitalists' consumption, investment, state spending, exports and household credit. The wage share responds to labour organisation, the reserve army, the labour aristocracy and global labour arbitrage. The profit rate includes income from abroad.
- **Imperialism.** Drain from the outer zones (tribute, repatriated profit, unequal exchange, debt service), colonial spheres and rivalry among the powers, and Lenin's five features as indices with thresholds.
- **Money.** Gold standard, war finance, the restored gold-exchange standard, the dollar–gold standard, the fiat dollar, the dollar overhang and sanctions.
- **Politics.** Organisation, militancy, capitalists' political power, legitimacy, nationalism, repression and fascism; revolutions and, following the MLM thesis, capitalist restoration in socialist zones.
- **Ledger of lives.** Deaths the model attributes to its mechanisms (war; famine and chronic poverty under a counterfactual in which 40% of the retainable drain stays at home; repression and genocide; work; despair; transition; sanctions), set against total excess deaths, which add chronic-poverty mortality measured against a benchmark. Mortality inside socialist or restored zones is not computed.

The notes at the bottom of the page list every equation, threshold, exogenous input and calendar switch, with sources.

## How the defaults relate to history

- The defaults are the ten levers at 50, seed 1917, and about a hundred fixed coefficients and thresholds in `src/engine.js`. These were tuned by hand so that turning points land near their historical dates; nothing was estimated statistically. The match with history is therefore built in and is not evidence that the mechanisms are right.
- Events fire on thresholds, so changing a lever or the seed moves them. Across eight seeds the depression fell between 1923 and 1932 and the neoliberal turn between 1964 and 1983, and in two seeds the order of some stages changed. `node test/levers.js` shows what each lever does to the dates.
- Some history is fixed. The exogenous inputs follow the calendar (technical progress, population growth, proletarianisation, the uneven growth of the powers, health technology), famines fall in the drought years identified by Davis, and about twenty mechanisms switch on or off by calendar year; for example, the nationalist turn cannot come before 1996, and coups end after 1991. These rules pull every run toward the historical clock.

## Calibration (seed 1917, all levers at 50)

| Anchor | Data | Model |
|---|---|---|
| Developed countries' share of world manufacturing, 1913 (Bairoch) | 92.5% | 93.7% (core + zone A) |
| China's share of world manufacturing, 1830 / 1900 (Bairoch) | 29.8% / 6.2% | 26.3% / 4.8% (zone B) |
| GDP per head, Western Europe, 1913 / 1998 (Maddison, 1990 int. $) | 3,473 / 17,921 | 2,873 / 21,290 (core) |
| GDP per head, Africa, 1913 / 1998 (Maddison) | 585 / 1,368 | 556 / 1,538 (zone C) |
| Famine deaths, 1876–79 and 1896–1902 (Davis) | 31.7–61.3 M | 49.6 M |
| First World War deaths | 8.5–10 M soldiers; civilians up to about 13 M | 17.5 M |
| Second World War deaths | 40–50 M; 60–75 M with famine and disease | 56.9 M, plus 14.2 M fascist terror |
| US labour share, 1960 / 2026 (BLS) | 66.2% / 52.8% | 68.0% / 50.9% (core wage share) |
| US top 1% income share, 1928 / 1975 / 2024 (Piketty–Saez) | 23.9% / 8.9% / 22.4% | 14.7% / 8.0% / 24.5% |
| Dollar share of allocated reserves, 1999 / 2026 (IMF COFER) | 71.0% / 56.7% | 71.7% / 58.0% |
| US federal funds rate, monthly peak (June 1981) | 19.1% | 17.2% |
| Financial corporations' share of US profits, 1950 / 2002 (from BEA data) | 8.8% / 38.1% | 15.8% / 30.3% |

Dates in the model (history in brackets): first world war 1915 (1914), October Revolution 1916 (1917), depression 1931 (1929), second world war 1940 (1939), Bretton Woods 1945 (1944), Chinese revolution 1948 (1949), dollar leaves gold 1970 (1971), neoliberal turn 1981 (1979–81), Mexican debt crisis 1982 (1982), collapse of the USSR 1993 (1991), China joins the WTO 2002 (2001), financial crisis 2009 (2008), nationalist turn 2014 (2016).

Known misses: nineteenth-century slumps are too deep, because the reserve army includes underemployment; unemployment runs at 12–16% after 2009 and around 2021; the finance share of profits is too high in 1950; core output per head is low in 1913.

## Repository layout

```
index.html           standalone page, built from src/ (open this)
src/engine.js        simulation engine; runs in the browser (window.AccEngine) and in Node (require)
src/ui.js            interface: map, instruments, levers, chronicle, ledger
src/head.html        title, fonts and styles
src/body.html        page markup and the model notes
scripts/build.mjs    rebuilds index.html from src/
test/                calibration report, seed and lever sensitivity, stress test
docs/model-notes.md  calibration, data anchors and sources in one file
```

## Development

Requires Node 18 or later. There are no dependencies.

```
node scripts/build.mjs     # rebuild index.html after editing src/
node test/calibration.js   # calibrated run: decades, events, deaths, anchors
node test/seeds.js         # event years across seeds
node test/levers.js        # event years with each lever at 20 and at 80
node test/robust.js        # stress test with extreme and random levers
```

Using the engine from Node:

```js
const E = require('./src/engine.js');
const model = E.createModel({ seed: 1917, levers: { labour: 80 } });
const history = model.runTo(2026);   // one record per year, 1801–2026
console.log(history.at(-1).phase, model.state.events.length);
```

## Sources

Every figure shown for comparison in the page was checked against a source in October 2026. The full list, with links, is in the page's notes and in `docs/model-notes.md`. Nine classic works behind model mechanisms (Kalecki 1943, Fisher 1933, Minsky 1986, Triffin 1960, Goodwin 1967, Steindl 1952, Cynamon & Fazzari 2016, Allen 2001 and 2017, Edward 2006) are cited from memory and marked as such.
