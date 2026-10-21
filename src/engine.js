/* Accumulate! — world-system simulation engine.
   A stylised stock-flow model of capitalist development, 1800–2026.
   Units: money in "model $" (scaled loosely to Maddison's 1990 international $),
   population in millions, deaths in millions. Annual steps. Deterministic for a given seed. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.AccEngine = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const START = 1800, END = 2026;
  const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
  const pos = (x) => (x > 0 ? x : 0);

  function pw(pts, t) {
    if (t <= pts[0][0]) return pts[0][1];
    for (let k = 1; k < pts.length; k++) {
      if (t <= pts[k][0]) {
        const a = pts[k - 1], b = pts[k];
        return a[1] + (b[1] - a[1]) * (t - a[0]) / (b[0] - a[0]);
      }
    }
    return pts[pts.length - 1][1];
  }
  function mulberry(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function makeNoise(seed) {
    const r = mulberry(seed);
    const out = {};
    for (let y = START; y <= END; y++) { const a = []; for (let k = 0; k < 16; k++) a.push(r()); out[y] = a; }
    return out;
  }

  /* ---------------- Exogenous drivers (all disclosed in the notes) ---------------- */
  const EXO = {
    // technical potential: productivity growth available to the core when investment is normal
    gT: [[1800, .0080], [1830, .0095], [1870, .0120], [1900, .0140], [1914, .0130], [1940, .0170], [1950, .0270], [1968, .0250], [1975, .0140], [1995, .0175], [2005, .0120], [2026, .0100]],
    // capital-saving innovation (cheapening of means of production), lowers the capital-output ratio
    capSave: [[1800, .0020], [1880, .0022], [1920, .0030], [1960, .0030], [1990, .0060], [2026, .0060]],
    // transport and communication cost index (1800 = 1)
    tc: [[1800, 1], [1850, .7], [1880, .45], [1914, .35], [1950, .3], [1965, .22], [1980, .13], [1995, .07], [2010, .04], [2026, .03]],
    // baseline mortality in the periphery when consumption is adequate (health technology)
    dfloor: [[1800, .026], [1880, .025], [1920, .022], [1945, .019], [1960, .012], [1980, .0085], [2000, .0072], [2026, .0068]],
    // agricultural technique in the periphery (Green Revolution after mid-1960s)
    agT: [[1800, .0012], [1900, .0014], [1945, .0025], [1965, .011], [1995, .010], [2026, .008]],
    // structural share of manufacturing in core employment before offshoring
    baseManu: [[1800, .12], [1850, .20], [1900, .29], [1950, .32], [1970, .31], [2000, .23], [2026, .19]],
    // uneven development: growth differentials of the three groups of core powers
    dOld: [[1800, -.006], [1900, -.007], [1945, -.006], [1950, .009], [1973, .001], [2026, -.002]],
    dChal: [[1800, .003], [1870, .008], [1913, .006], [1945, 0], [1950, .016], [1973, .004], [1990, -.006], [2026, -.004]],
    dNew: [[1800, .012], [1913, .010], [1945, .004], [1950, -.012], [1973, -.004], [1990, .004], [2026, .003]],
    // proletarianisation: share of the core labour force working for wages in the capitalist sector
    prolet: [[1800, .50], [1850, .58], [1900, .70], [1950, .86], [2000, .95], [2026, .96]],
    // manufacturing share of capitalist-sector output in the core (industrialisation, then services)
    mfgY: [[1800, .30], [1850, .36], [1900, .40], [1950, .38], [1980, .30], [2026, .22]],
    // natural population growth if there were no excess deaths (demographic transition)
    nat: {
      core: [[1800, .0098], [1850, .0090], [1900, .0080], [1930, .0062], [1950, .0095], [1970, .0072], [2000, .0060], [2026, .0040]],
      A: [[1800, .0170], [1900, .0180], [1913, .0180], [1950, .0135], [1970, .0080], [1990, .0015], [2000, -.0025], [2026, -.0025]],
      B: [[1800, .0135], [1900, .0135], [1945, .0150], [1950, .0215], [1970, .0215], [1980, .0150], [2000, .0085], [2020, .0030], [2026, -.0005]],
      C: [[1800, .0150], [1900, .0160], [1920, .0185], [1950, .0268], [1975, .0270], [1990, .0230], [2010, .0193], [2026, .0167]]
    }
  };
  // Drought clusters identified by Davis (2001): 1876–79, 1889–91, 1896–1902. Severities are model assumptions.
  // Each entry: [share of the segment's population in the stricken region, local harvest loss]
  const DROUGHT = {
    C: { 1876: [.15, .35], 1877: [.20, .45], 1878: [.10, .30], 1889: [.06, .30], 1890: [.05, .28], 1896: [.15, .35], 1897: [.15, .38], 1899: [.20, .42], 1900: [.15, .38] },
    B: { 1876: [.10, .40], 1877: [.15, .60], 1878: [.10, .50], 1879: [.05, .35], 1889: [.05, .30], 1890: [.04, .28], 1891: [.04, .26], 1896: [.05, .35], 1897: [.06, .40], 1899: [.08, .40], 1900: [.15, .55], 1901: [.10, .45], 1902: [.05, .35] }
  };

  /* ---------------- Core political regimes ---------------- */
  // gciv: civil state spending share; gmil: military; tr: transfers; tw/tp: tax on wages/profits;
  // prog: tax progressivity; dereg: financial deregulation; legal: legal space for unions;
  // antiUnion: active union-busting rate; ck: capitalists' consumption propensity; comp: class-compromise wage premium;
  // capCtl: capital controls (0–1)
  const REG = {
    laissez: { gciv: .040, gmil: .030, tr: .004, tw: .06, tp: .08, prog: .05, dereg: .60, legal: .22, antiUnion: 0, ck: .33, comp: 0, capCtl: 0 },
    imperial: { gciv: .050, gmil: .040, tr: .012, tw: .06, tp: .08, prog: .15, dereg: .70, legal: .55, antiUnion: 0, ck: .33, comp: 0, capCtl: 0 },
    war: { gciv: .060, gmil: .300, tr: .020, tw: .15, tp: .22, prog: .60, dereg: .20, legal: .55, antiUnion: 0, ck: .45, comp: .015, capCtl: .8 },
    interwar: { gciv: .080, gmil: .030, tr: .030, tw: .08, tp: .12, prog: .25, dereg: .85, legal: .60, antiUnion: 0, ck: .33, comp: 0, capCtl: .2 },
    crisis: { gciv: .100, gmil: .050, tr: .045, tw: .09, tp: .18, prog: .45, dereg: .30, legal: .80, antiUnion: 0, ck: .36, comp: .010, capCtl: .5 },
    compromise: { gciv: .150, gmil: .080, tr: .080, tw: .25, tp: .40, prog: .85, dereg: .15, legal: 1.0, antiUnion: 0, ck: .52, comp: .030, capCtl: .70 },
    stagflation: { gciv: .160, gmil: .060, tr: .095, tw: .24, tp: .36, prog: .75, dereg: .30, legal: 1.0, antiUnion: 0, ck: .53, comp: .025, capCtl: .45 },
    neoliberal: { gciv: .150, gmil: .055, tr: .090, tw: .24, tp: .28, prog: .35, dereg: 1.00, legal: .70, antiUnion: .045, ck: .55, comp: -.020, capCtl: 0 },
    neocrisis: { gciv: .165, gmil: .050, tr: .110, tw: .24, tp: .25, prog: .35, dereg: .85, legal: .70, antiUnion: .035, ck: .55, comp: -.020, capCtl: 0 },
    nationalist: { gciv: .155, gmil: .055, tr: .100, tw: .24, tp: .21, prog: .25, dereg: 1.00, legal: .60, antiUnion: .045, ck: .56, comp: -.020, capCtl: .10 },
    radical: { gciv: .220, gmil: .040, tr: .120, tw: .22, tp: .45, prog: .95, dereg: .05, legal: 1.0, antiUnion: 0, ck: .48, comp: .050, capCtl: .90 }
  };

  const DEFAULT_LEVERS = { labour: 50, periOrg: 50, supervision: 50, extraction: 50, aristocracy: 50, repression: 50, intervention: 50, antitrust: 50, finreg: 50, mobility: 50 };
  const lf = (v) => v / 50; // 0..2, 1 = calibrated history

  function initState() {
    return {
      t: START,
      core: {
        P: 175, N: 36.75, Ntot: 73.5, A: 4.0, kappa: 2.6, K: 364, Ync: 44.8, GDP: 180,  omega: .56, omegaT: .56, M: .05, F: .06,
        O: .03, Mil: .10, Leg: .55, Nat: .10, Rep: .35, Pk: .45, LA: 0,
        Kx: 15, FA: 120, HD: 0, GD: 95, bub: 1, AP: 100, i: .045, pi: 0, r: .15, rMaxPost: 0,
        uK: .95, u: .95, invRate: .032, empRate: .94, U: .06,
        Y: 135, Ystar: 140, Ycap: 140, Ylab: 147, W: 75.6, Wprev: 75.6, Lprev: 33.8, TrPrev: 0.8, FI: 4, FIprev: 4, Ix: 2, IxPrev: 2, I: 16,
        Cn: 2.15, manu: .12, manuPeak: .12, OFF: 0, tariff: .10, Sx: 0, top1: .17, gmil: .03,
        regime: 'laissez', regimeSince: START, money: 'gold', hegemon: 'old', H: .45, DS: 0, Ov: 0, oil: 1,
        crash: 0, depression: 0, delever: 0, postCrisis: 0, crashCount: 0, lastCrash: -99, iPrev: .045, rPrev: .15, stagYears: 0, war: null, lastWarEnd: -99, wars: 0,
        fascist: 0, tension: 0, volcker: 0, zirp: 0, nationalistSince: 0, natWave: 0, HHc: 0, ds: 0, finShare: .1,
        s: { old: .62, chal: .30, new: .08 }, d: { old: .94, chal: .03, new: .03 },
        massCons: 0, Ck: 0, G: 0, X: 0, Tr: 0
      },
      seg: {
        A: mkSeg('A', 'Eurasian semi-periphery', 92, 680, .12, .38, .14, 'semi', 0, .10, .20, 1880),
        B: mkSeg('B', 'Agrarian empire', 330, 570, .21, .36, .07, 'empire', 0, 0, .05, 1919),
        C: mkSeg('C', 'Colonies & dependencies', 385, 520, .18, .26, .10, 'colonial', .45, .55, .45, 1925)
      },
      deaths: {},
      feat: {},
      events: [],
      flags: {}
    };
  }
  function mkSeg(id, name, pop, ypc, hc, rho, tau, status, col, sphere, open, marxYear) {
    const Ytrad = ypc * pop / 1000; // billions of model $
    const q = Ytrad / Math.pow(pop, .82);
    return {
      id, name, pop, status, statusSince: START, q, aF: 1, hc, hc0: hc, rho, tau, col, sphere, open, marxYear,
      Kd: ypc * pop / 1000 * .02, Kx: 0, Kr: 0, kappa: 2.8, debt: 0, Y: Ytrad, Ytrad, Ymod: 0, ypc,
      c: 1.2, cCF: 1.2, Imm: .2, O: 0, Nat: id === 'C' ? .05 : .02, Rep: id === 'C' ? .40 : .30, Lib: 0, Rv: 0,
      nd: 0, sap: 0, drain: 0, drainShare: 0, exports: 0, wmod: .6, Lmod: 0, invest: 0, Leg: .5,
      milShare: .02, collapseY: 0, transition: 0, liberated: 0, sanctioned: 0, rivalExp: 0, reserves: 0, inspired: 0,
      exportCrop: id === 'C' ? .06 : .02, theta: id === 'C' ? .35 : 0, aidCut: 0, mfg: 0, Amod: 1.6, capUtil: 1
    };
  }

  const DEC = [-1.645, -1.036, -.674, -.385, -.126, .126, .385, .674, 1.036, 1.645];   // decile mid-points of a standard normal
  const C_ETH = 3.9;
  const CAT = ['war', 'famine', 'poverty', 'repression', 'occupational', 'despair', 'transition', 'sanctions'];

  function createModel(cfg) {
    cfg = cfg || {};
    const seed = (cfg.seed >>> 0) || 1917;
    const noise = makeNoise(seed);
    let lev = Object.assign({}, DEFAULT_LEVERS, cfg.levers || {});
    let S = initState();
    CAT.forEach((k) => { S.deaths[k] = { total: 0, attr: 0 }; });
    let hist = [];
    let snaps = {};
    snaps[START] = JSON.stringify(S);

    function addEvent(t, type, data) { S.events.push(Object.assign({ t, type }, data || {})); }
    function feature(key, t) { if (!S.feat[key]) { S.feat[key] = t; return true; } return false; }

    function step() {
      if (S.t >= END) return null;
      const t = S.t + 1;
      const nz = noise[t];
      const L = {}; for (const k in lev) L[k] = lf(lev[k]);
      const c = S.core, A = S.seg.A, B = S.seg.B, C = S.seg.C;
      const segs = [A, B, C];
      const R = REG[c.regime];
      const dy = {}; CAT.forEach((k) => { dy[k] = { total: 0, attr: 0 }; });
      const regionDeaths = { core: 0, A: 0, B: 0, C: 0 };
      const war = c.war;
      const isSoc = (s) => s.status === 'socialist';
      const closed = (s) => s.status === 'socialist' || s.status === 'restored';

      /* ===== 1. Uneven development among core powers ===== */
      if (!war) {
        c.s.new *= Math.exp(pw(EXO.dNew, t));
        c.s.chal *= Math.exp(pw(EXO.dChal, t));
        c.s.old *= Math.exp(pw(EXO.dOld, t));
        const z = c.s.new + c.s.chal + c.s.old; c.s.new /= z; c.s.chal /= z; c.s.old /= z;
      }

      /* ===== 2. Periphery segments (use last year's core variables) ===== */
      const coreMfgAdv = clamp(c.A / 4.0, 1, 10);
      const iWorld = c.i;
      let FI = 0, FAin = 0, Xcore = 0, offAbsorb = 0;
      const socShare = segs.reduce((a, s) => a + (isSoc(s) ? s.pop : 0), 0) / (segs.reduce((a, s) => a + s.pop, 0) + c.P);
      const socMight = segs.reduce((a, s) => a + ((isSoc(s) || s.status === 'restored') ? s.Y : 0), 0) / Math.max(1, c.Y);
      // threat the socialist zone poses to core capital (Cold War compromise pressure)
      const Soc = clamp(socShare * 1.5 + socMight * .6, 0, 1);
      const rivalWeight = B.status === 'rival' || B.status === 'reform' ? B.Y / Math.max(1, c.GDP * c.s[c.hegemon]) : 0;

      for (const s of segs) {
        const status = s.status;
        // --- natural growth (excess deaths subtracted below)
        s.pop *= 1 + pw(EXO.nat[s.id], t);
        // --- harvest
        // regional harvest failure: a share 'ra' of the population loses 'rs' of its harvest
        let ra = 0, rs = 0;
        if (DROUGHT[s.id] && DROUGHT[s.id][t]) { ra = DROUGHT[s.id][t][0]; rs = DROUGHT[s.id][t][1]; }
        else if (nz[s.id === 'A' ? 0 : s.id === 'B' ? 1 : 2] < .08) { ra = .02 + .03 * nz[3]; rs = .25 + .25 * nz[9]; }
        // wartime requisition plus a regional shortfall in a colony (Bengal 1943 type)
        if (war && war.fasc && s.id === 'C' && s.status === 'colonial' && t - war.start === 3) { ra = Math.max(ra, .06); rs = Math.max(rs, .32); }
        const shock = ra * rs;
        // --- agricultural technique
        const agBoost = isSoc(s) ? 1.35 : status === 'colonial' ? .8 : 1;
        s.aF *= 1 + pw(EXO.agT, t) * agBoost;
        // --- deindustrialisation of crafts under forced openness to core manufactures
        const openEff = (status === 'colonial' || status === 'semicolony' || status === 'empire' || status === 'semi') ? s.open : s.open * .5;
        s.hc = Math.max(.015, s.hc * (1 - .042 * openEff * (coreMfgAdv - .8) * (t < 1950 ? 1 : .3)));
        const craftLoss = (s.hc0 - s.hc) / s.hc0;
        const Ytrad0 = s.q * s.aF * Math.pow(s.pop, .82) * (1 - .45 * craftLoss * s.hc0);
        let warDisrupt = 0;
        if (war) {
          if (s.id === 'A') warDisrupt = war.fasc ? .22 : .18;
          if (s.id === 'B' && war.fasc) warDisrupt = .20;
          if (s.id === 'C') warDisrupt = war.fasc ? .05 : .02;
        }
        if (s.rebellion > 0) warDisrupt += .10;
        if (s.civilWar > 0) warDisrupt += .07;
        const Ytrad = Ytrad0 * (1 - shock) * (1 - warDisrupt);
        // --- modern sector
        if (status === 'socialist') s.kappa = clamp(s.kappa * (1 + .002), 2.4, 4.2);
        if (status === 'restored') s.kappa = clamp(s.kappa * (1 + .010), 2.4, 5.5); // stagnation of the restored, closed bloc
        if (status === 'reform' || status === 'rival') s.kappa = clamp(s.kappa * (1 - .004), 2.6, 4.5);
        const Kmod = s.Kd + s.Kx + s.Kr;
        // productivity of modern-sector labour catches up on the core's only as fast as the status allows
        const gap = clamp(1 - s.Amod / c.A, 0, 1);
        let catchUp = .002;
        if (isSoc(s)) catchUp = .005 + .020 * gap;
        else if (status === 'restored') catchUp = .006 + .010 * gap;
        else if (status === 'reform' || status === 'rival') catchUp = .006 + .032 * gap;
        else if (status === 'indep') catchUp = .005 + .012 * gap * (1 + s.nd) + .008 * gap * clamp((t - 1990) / 20, 0, 1);
        else if (status === 'semi') catchUp = .004 + .010 * gap;
        else if (status === 'postsoviet') catchUp = .004 + .012 * gap;
        s.Amod *= 1 + catchUp;
        const Lmax = .45 * s.pop * clamp(.01 + .10 * clamp((t - 1850) / 100, 0, 1) + .50 * clamp((t - 1950) / 70, 0, 1) + (isSoc(s) || status === 'restored' ? .06 : status === 'rival' || status === 'reform' ? .08 : 0), 0, .8);
        const Ymod = Math.min(Kmod / s.kappa, s.Amod * Lmax) * (1 - warDisrupt * .8) * (s.collapse > 0 ? .62 + .07 * (6 - Math.min(6, s.collapse)) : 1);
        s.capUtil = Kmod > 0 ? Ymod / (Kmod / s.kappa) : 1;
        s.Ytrad = Ytrad; s.Ymod = Ymod; s.Y = Ytrad + Ymod; s.ypc = s.Y * 1000 / s.pop;
        // --- distribution
        const rho = (isSoc(s) || status === 'restored' || status === 'reform' || status === 'rival' || status === 'postsoviet') ? 0 : s.rho * (s.landReform ? .4 : 1);
        const extr = L.extraction;
        let theta = 0, tau = s.tau, socialSpend = .05;
        if (status === 'colonial') { theta = .32 * extr * s.col; tau = s.tau * (1 + .3 * (extr - 1)); socialSpend = .04; }
        else if (status === 'semicolony') { theta = .12 * extr; socialSpend = .03; }
        else if (status === 'indep') { theta = 0; tau = .15; socialSpend = .18 + .20 * s.nd - .14 * (s.sap > 0 ? 1 : 0); }
        else if (isSoc(s)) { tau = .30; socialSpend = .45; }
        else if (status === 'restored') { tau = .32; socialSpend = .35; }
        else if (status === 'reform' || status === 'rival') { tau = .22; socialSpend = .22; }
        else if (status === 'postsoviet') { tau = .20; socialSpend = .22; }
        else if (status === 'semi') { tau = s.tau; socialSpend = .04; }
        else if (status === 'empire') { tau = s.tau; socialSpend = .05; }
        // colonial requisition in wartime (e.g. Bengal 1943)
        let warReq = 0;
        if (war && s.id === 'C' && status === 'colonial') warReq = .045 * war.intensity * s.col * extr;
        if (war && s.id === 'A' && status === 'semi') warReq = .06;
        const rent = rho * Ytrad;
        const fixedAssess = status === 'colonial' || status === 'semicolony' || status === 'empire' || status === 'semi';
        const tax = tau * (fixedAssess ? Ytrad0 * (1 - warDisrupt) + Ymod : s.Y);
        // opium and silver drain from the opened semi-colony (paid through the colonial system)
        const opium = status === 'semicolony' && t < 1912 ? .022 * Ytrad * L.extraction : 0;
        const tribute = theta * tax + warReq * Ytrad;
        // modern sector income
        const wshare = clamp((status === 'semi' ? .26 : .30) + .25 * s.O * (status === 'socialist' ? 0 : 1) + (isSoc(s) ? .25 : 0) + (status === 'restored' ? .2 : 0) + (status === 'rival' ? .08 : 0), .22, .62);
        const Wm = wshare * Ymod;
        const Pm = Ymod - Wm;
        const fx = Kmod > 0 ? s.Kx / Kmod : 0;
        const rxRet = .7;
        const repat = fx * Pm * rxRet;
        // unequal exchange on primary and manufactured exports
        const expShare = clamp(s.exportCrop + (status === 'colonial' ? .05 : 0), 0, .4);
        let exportsV = expShare * Ytrad + Ymod * (status === 'rival' || status === 'reform' ? .30 : status === 'indep' ? .25 : .15) * (closed(s) ? .1 : 1);
        const ueRate = closed(s) ? 0 : clamp(.10 + .16 * c.M, 0, .3) * (status === 'rival' ? .55 : 1) * (.6 + .4 * extr);
        const ue = ueRate * exportsV;
        const debtServ = (iWorld + .03) * s.debt;
        // capital flight by compradors and oligarchs (financial drain)
        const flight = (status === 'indep' ? .018 * (1 - s.nd) : status === 'postsoviet' ? .05 : 0) * (rent + (1 - fx) * Pm + .2 * tax);
        let drain = tribute + repat + ue + debtServ + opium;
        if (closed(s)) drain = 0;
        // mass income: peasants, artisans and workers
        let mass = (Ytrad - rent) - tax * (Ytrad / Math.max(1e-9, s.Y)) - opium - .7 * ue * (expShare * Ytrad / Math.max(1e-9, exportsV)) - warReq * Ytrad + Wm * (1 - .5 * tau) + socialSpend * tax;
        // sanctions squeeze (dollar weaponisation) on the sanctioned share
        const sanc = s.sanctioned * c.Sx;
        mass *= 1 - .10 * sanc;
        const SUB = .3; // subsistence: 300 model $ per head per year, in thousands
        s.c = Math.max(.35, mass / (s.pop * SUB));
        // consumption in the stricken region: fixed cash assessments and exports continue (colonial rule), relief otherwise
        const cNoShock = s.c / Math.max(.5, 1 - shock);
        const burden = fixedAssess ? 1.15 : (isSoc(s) ? .6 : .85);
        s.cReg = ra > 0 ? Math.max(.2, cNoShock * (1 - rs * burden) - (warReq > 0 ? .08 : 0)) : s.c;
        s.ra = ra;
        // counterfactual: 40% of the retainable drain (tribute, opium, debt service, half the unequal-exchange loss)
        // would have stayed as mass consumption; repatriated profits are excluded (no foreign capital, no such output)
        s.retain = closed(s) ? 0 : tribute + opium + debtServ + .5 * ue;
        s.cCF = s.c + .4 * s.retain / (s.pop * SUB);
        s.cRegCF = ra > 0 ? s.cReg + .4 * s.retain / (s.pop * SUB) + (fixedAssess ? .15 * rs * cNoShock : 0) + (warReq > 0 ? .08 : 0) : s.cCF;
        s.wmod = Wm / Math.max(1e-6, Ymod / (1.0 + 1.5 * s.ypc / 1000));
        s.drain = drain; s.drainShare = drain / s.Y; s.exports = exportsV; s.flight = flight;
        s.tribute = tribute; s.repat = repat; s.ue = ue; s.debtServ = debtServ; s.rent = rent;
        FI += drain; FAin += flight;
        if (!closed(s)) Xcore += s.Y * (.004 + .016 * s.open);
        else Xcore += s.Y * .002;
        // --- accumulation in the segment
        let sInv;
        if (isSoc(s)) sInv = .25;
        else if (status === 'restored') sInv = .27;
        else if (status === 'reform') sInv = .34;
        else if (status === 'rival') sInv = .40;
        else if (status === 'indep') sInv = .11 + .08 * s.nd - .03 * (s.sap > 0 ? 1 : 0) + .05 * clamp((t - 1990) / 25, 0, 1);
        else if (status === 'postsoviet') sInv = .15;
        else if (status === 'semi') sInv = .045 + .03 * clamp((t - 1880) / 30, 0, 1);
        else sInv = .015;
        const domInv = sInv * s.Y * clamp(s.capUtil, .3, 1);
        s.invest = domInv;
        s.Kd = s.Kd * .975 + domInv;
        s.Kx *= .975; s.Kr *= .975;
        if (s.collapse > 0) s.collapse--;
        // --- debt dynamics
        s.debt *= .965;
        // --- immiseration and organisation
        s.Imm = clamp((1.75 - s.c) / .80, 0, 1);
        const marx = t >= s.marxYear || s.inspired ? 1 : 0;
        const seedO = marx ? .02 + .02 * s.inspired : 0;
        const warBoost = war ? (s.id === 'A' && !war.fasc ? .05 : s.id === 'B' && war.fasc ? .035 : .006) : 0;
        if (!isSoc(s) && status !== 'restored' && status !== 'reform' && status !== 'rival' && status !== 'postsoviet') {
          s.O += (.12 * s.Imm + .03) * marx * (s.O + seedO) * (1 - s.O) * L.periOrg * (s.id === 'C' ? .55 : 1) + warBoost * marx * L.periOrg - .030 * s.Rep * L.repression * s.O;
          s.O = clamp(s.O, 0, 1);
        }
        if (status === 'colonial' || status === 'semicolony') {
          s.Nat += .02 * (s.Imm + .5) * (1 - s.Nat) * (t > 1880 ? 1 : .3) * (s.col + .3) + (war && war.fasc ? .02 : 0) - .015 * s.Rep * s.Nat * L.repression;
          s.Nat = clamp(s.Nat, 0, 1);
        }
        // repression intensity
        let repT = .30;
        if (status === 'colonial') repT = .35 + .4 * s.Nat + .3 * s.O;
        else if (status === 'semicolony' || status === 'empire' || status === 'semi') repT = .30 + .35 * s.O;
        else if (status === 'indep') repT = .22 + .45 * s.O * (1 - .5 * s.nd) + .25 * (s.sap > 0 ? 1 : 0) * s.Imm;
        s.Rep += .3 * (clamp(repT * L.repression, 0, 1) - s.Rep);
      }

      /* ===== 3. Core production and realisation ===== */
      const gPc = pw(EXO.nat.core, t) * (c.regime === 'nationalist' ? .80 : 1);
      c.P *= 1 + gPc;
      const prolet = pw(EXO.prolet, t);
      c.Ntot = .42 * c.P;
      c.N = c.Ntot * prolet;                         // wage-labour force
      const gA = pw(EXO.gT, t) * (.45 + .55 * clamp(c.invRate / .045, 0, 1.6)) * clamp(1 + 2.0 * (c.omega - .60), .7, 1.12) * (war ? .7 : 1);
      c.A *= 1 + gA;
      // non-capitalist producers (peasants, artisans) — shrinking as proletarianisation proceeds
      c.Ync = 1.22 * (c.Ntot - c.N) * Math.pow(c.A / 4.0, .35);
      // mechanisation: the capital-output ratio drifts up when the wage share is high (labour-saving motive)
      const dk = .25 * gA * (1 + 4 * (c.omega - .60)) + .05 * gA * c.M - pw(EXO.capSave, t);
      c.kappa = clamp(c.kappa * Math.exp(dk), 1.8, 5.0);
      c.Ycap = c.K / c.kappa; c.Ylab = c.A * c.N; c.Ystar = Math.min(c.Ycap, c.Ylab);
      // after a crash: a long collapse of confidence under gold (no lender of last resort), a shorter one with bailouts
      let conf = c.crash > 0 ? (c.crashBig ? [1, .85, .78, .70] : [1, .96, .93, .90])[Math.min(3, c.crash)] : 1;
      // depth grows with monopoly: competitive capital adjusts through prices, monopoly capital through output and employment
      const sev = clamp((c.M - .15) / .27, .35, 1);
      if (c.depression > 0) conf = 1 - (1 - [1, .80, .68, .58, .50, .45, .45][Math.min(6, c.depression)]) * sev;
      if (c.volcker > 0) conf *= .78;   // the interest-rate shock: credit crunch and investment strike
      const iReal = c.i - c.pi;
      const dep = .035;
      const i0 = 1.1 * pw(EXO.gT, t);                // innovation-led investment
      const hurdle = .045 + .5 * pos(iReal - .02);  // profit of enterprise must beat the real rate of interest
      let ig = (dep + i0 + .60 * (c.r - hurdle) + .10 * (c.uK - .92)) * (.90 + .20 * nz[8]);
      ig *= (1 - .25 * c.M) * (1 + .20 * c.F) * conf;
      ig = clamp(ig, .012, .13);
      if (war) ig *= .6;
      c.invRate = ig - dep;
      const I = ig * c.K;                            // gross investment
      // military spending: base regime + Cold War + fascist rearmament + war mobilisation
      let gmil = R.gmil + (c.regime === 'compromise' || c.regime === 'stagflation' ? .03 * Soc : 0) + .06 * c.fascist;
      if (war) gmil = .12 + .26 * war.intensity;
      c.gmil = gmil;
      const Gbase = Math.max(c.Ystar, .92 * c.Ylab);         // state spending tracks the labour potential, not capacity
      const G = (R.gciv * (c.depression > 2 ? .75 : 1) + gmil) * Gbase;   // early depression years: budget-balancing austerity
      const Tr = R.tr * Gbase;
      // exports to periphery markets + capital-export-tied orders; sales to non-capitalist strata at home
      const X = (Xcore + .30 * c.IxPrev) * (c.depression > 0 ? .55 : 1);   // world trade collapses in a gold-standard depression
      const Dnc = .06 * c.Ync;
      // competing imports (offshored production and rival exports), cut by tariffs
      const mComp = clamp((.015 + .30 * c.OFF + .10 * clamp(rivalWeight, 0, 1.2)) * (1 - 2.2 * pos(c.tariff - .03)), .005, .38);
      // household credit bridging stagnant wages and the consumption norm
      const ds = (c.i + .025) * c.HD;
      const credAvail = R.dereg * c.F * (c.crash > 0 ? (c.crashBig ? .25 : .7) : 1) * (2 - L.finreg) * (t > 1945 ? 1 : .25) * (c.postCrisis ? .25 : 1);
      // consumption norm: what wage earners consumed when they took ~62% of output, plus emulation of the rich
      const norm = (.70 * (1 - R.tw) * c.Yprev) * (1 + 1.0 * pos(c.top1 - .10));
      const gap = pos(norm - ((1 - R.tw) * c.Wprev - ds));
      let HHc = credAvail * .62 * gap - (c.crash > 0 && c.crashBig ? .015 * c.HD : 0);
      if (c.delever > 0) { HHc = -.02 * c.HD; c.delever--; }   // post-crash deleveraging
      const ckp = R.ck + .10 * c.M;
      // REALISATION: spending that would meet normal-capacity output
      const Wn = c.omega * c.Ystar, Sn = (1 - c.omega) * c.Ystar;
      const massN = ((1 - R.tw) * Wn) * (c.depression > 0 && c.regime === 'crisis' ? .88 : 1) + Tr + HHc - ds;          // consumption capacity of the masses (wage cuts and short time in the great debt-deflation)
      const CkN = (ckp * ((1 - R.tp) * Sn - dep * c.K * .5 + .6 * c.FIprev) + .005 * c.K) * (c.depression > 0 ? .80 : 1);   // + rentier consumption out of wealth
      const spend = (1 - mComp) * (massN + CkN) + I + G + X + Dnc;
      c.Dratio = spend / c.Ystar - (c.oilShock > 0 ? .06 : 0);   // petrodollar leakage during the oil shock
      const uT = clamp(1 - 1.25 * (1 - c.Dratio), .60, 1.03);
      c.u += .7 * (uT - c.u);
      c.Y = c.u * c.Ystar; c.uK = c.Y / c.Ycap;
      c.GDP = c.Y + c.Ync;
      const Lc = Math.min(c.N, c.Y / c.A);
      c.empRate = Lc / c.N; c.U = 1 - c.empRate;
      const W = c.omega * c.Y, Sd = (1 - c.omega) * c.Y;
      const T = R.tw * W + R.tp * Sd;
      c.GD = Math.max(0, c.GD + (G + Tr - T));
      c.FI = FI;
      const Pi = (1 - R.tp) * Sd + FI - dep * c.K - (c.oil > 1.5 ? .012 * (c.oil - 1) * c.Y / 3 : 0);   // profits net of depreciation and the oil rent
      c.r = Pi / (c.K + c.Kx);
      c.e = Sd / W;
      c.supShare = FI / Math.max(1e-9, Pi + dep * c.K);
      c.W = W; c.massCons = (1 - R.tw) * W + Tr + HHc - ds; c.Ck = ckp * Math.max(0, Pi); c.I = I; c.G = G; c.X = X + Dnc; c.Tr = Tr; c.mComp = mComp;
      c.HHc = HHc; c.ds = ds;
      c.Yprev = c.Y;
      // capital export: surplus capital seeks higher returns abroad
      const access = clamp(segs.reduce((a, s) => a + (closed(s) ? 0 : s.open * s.Y), 0) / segs.reduce((a, s) => a + s.Y, 0), 0, 1);
      const rx = .12 + .04 * access;
      let chi = clamp(.008 + .6 * pos(rx - c.r) + .35 * c.F * access, 0, .6) * (1 - .75 * R.capCtl) * L.mobility;
      if (war) chi *= .2;
      const Sk = (1 - ckp) * Math.max(0, Pi);
      const Ix = chi * Sk;
      c.Ix = Ix;
      // accumulation (net of depreciation)
      c.K = c.K * (1 - dep) + I;
      c.Kx = c.Kx * .98 + Ix;
      const ES = Sk - (I - dep * c.K) - Ix;
      c.ES = ES;
      c.FA = Math.max(10, c.FA * 1.0 + pos(ES) + pos(HHc) + FAin + pos(G + Tr - T) * .5);
      c.HD = Math.max(0, c.HD * .965 + HHc);
      // fictitious capital: capitalised profits times a speculative multiplier
      const APf = Pi / Math.max(.035, c.i + .035);
      const zirp = c.zirp > 0 ? .025 : 0;
      // the interwar order (war debts, reparations, gold-exchange standard, US lending) breeds a credit boom
      const interwarBoom = c.regime === 'interwar' ? .015 * (2 - L.finreg) : 0;
      c.bub += 1.6 * (pos(ES) / c.Y) * R.dereg * c.F * (2 - L.finreg) + zirp + interwarBoom + .010 * (c.HD / Math.max(1, W)) * R.dereg - .06 * (c.bub - 1);
      c.bub = clamp(c.bub, .6, 2.2);
      c.AP = APf * c.bub;

      /* ===== 4. Wage share, organisation, politics in the core ===== */
      // superprofit sharing (labour aristocracy): part of foreign income reaches upper strata of core workers
      c.LA = clamp(L.aristocracy * c.supShare * 2.6 * (c.regime === 'laissez' ? .3 : 1), 0, 1);
      const Arb = clamp(1.7 * c.OFF + .25 * clamp(rivalWeight, 0, 1), 0, 1);
      let wt = .552 + .25 * c.O * L.labour + .9 * clamp(c.empRate - .92, -.03, .06) + .06 * c.LA + .03 * Soc - .03 * c.M - .05 * Arb + R.comp * .5 - .06 * c.fascist;
      c.omegaT = clamp(wt, .42, .78);
      c.omega += .20 * (c.omegaT - c.omega);
      // structural manufacturing share and offshoring
      const manuPrev = c.manu;
      c.manu = pw(EXO.baseManu, t) * (1 - 1.1 * c.OFF);
      c.manuPeak = Math.max(c.manuPeak, c.manu);
      const dManu = c.manu - manuPrev;
      // labour organisation
      const legal = R.legal * (1 - c.fascist);
      let dO = .030 * legal * L.labour * (.55 - c.O) * (.3 + 2 * c.manu) * (.5 + .5 * c.M) + .015 * Soc * (.5 - c.O) * legal
        - .03 * c.Rep * L.repression * c.O - R.antiUnion * c.O * (1.4 - .4 * L.labour) - .9 * pos(-dManu / Math.max(.05, c.manu)) * c.O - .12 * c.fascist * c.O;
      if (c.regime === 'crisis' || (war && war.fasc)) dO += .035 * pos(.5 - c.O) * legal * L.labour;
      c.O = clamp(c.O + dO, .01, .9);
      // revolutionary militancy
      let dMil = .07 * pos(c.U - .05) + (c.crash > 0 ? .02 : 0) + .03 * pos(.5 - c.Leg) + (war ? .012 * war.intensity : 0)
        - .07 * c.LA * c.Mil - .04 * c.Rep * c.Mil * L.repression - .035 * c.Mil + .01 * c.O * L.labour;
      c.Mil = clamp(c.Mil + dMil, .01, .95);
      // legitimacy of the ruling order
      const wgrowth = c.Wprev > 0 ? (W / Math.max(1e-9, Lc)) / (c.Wprev / Math.max(1e-9, c.Lprev)) - 1 : 0;
      const legT = .52 + 3.5 * clamp(wgrowth, -.06, .05) - 1.4 * pos(c.U - .05) - .9 * pos(c.top1 - .13) + .5 * R.tr - (c.crash > 0 ? .08 : 0) - .15 * pos(c.manuPeak - c.manu) * 3;
      c.Leg += .25 * (clamp(legT, .05, .95) - c.Leg);
      // nationalism: discontent channelled into nation when organised class politics is weak
      const left = .5 * c.O + .5 * c.Mil;
      const discontent = pos(.55 - c.Leg);
      const deind = pos(c.manuPeak - c.manu) / Math.max(.05, c.manuPeak);
      c.Nat += .10 * discontent * (1 - left) * (.5 + c.Pk) + .015 * deind * (t > 1990 ? 1 : 0) + .02 * clamp(rivalWeight, 0, 1) * (t > 2005 ? 1 : 0)
        + (c.crash > 0 ? .02 * (1 - left) : 0) - .035 * c.Nat + (war ? .02 : 0);
      c.Nat = clamp(c.Nat, .02, .95);
      c.Pk = clamp(.30 + .35 * c.M + .30 * c.F + .5 * pos(c.top1 - .1) - .25 * c.O + (c.regime === 'stagflation' ? .08 : 0), 0, 1);
      // repression in the core
      const repTc = (.18 + .35 * c.Mil + .5 * c.fascist + (c.regime === 'laissez' ? .12 : 0)) * L.repression;
      c.Rep += .3 * (clamp(repTc, 0, 1) - c.Rep);
      // top 1% income share
      c.top1 = clamp(.02 + .45 * (1 - c.omega) * (.6 + .8 * c.F) * (1 - .6 * R.prog) * (c.crash > 0 && (c.money === 'gold' || c.money === 'interwar') ? .9 : 1), .05, .35);
      // financial share of profits
      // rentier income: depressed by financial repression (capital controls, regulated spreads) when deregulation is low
      const finInc = ((c.i + .01 + .03 * c.F * R.dereg) * (c.HD + .35 * c.FA) + .25 * FI * c.F) * (.35 + .65 * R.dereg);
      c.finShare = clamp(finInc / (finInc + Pi), 0, .7);
      // concentration and centralisation of capital
      const crisisCentral = (c.crash > 0 ? .020 : c.depression > 0 || c.u < .90 ? .008 : 0) * (.3 + 1.5 * c.F);   // credit and joint-stock companies speed centralisation
      c.M = clamp(c.M + .0022 * (gA / .012) * Math.pow(c.A / 4, .3) * (1 - c.M) + crisisCentral * (1 - c.M) + .006 * c.F * (1 - c.M) - .012 * L.antitrust * c.M * (c.regime === 'compromise' ? 1.2 : .6) + (c.regime === 'neoliberal' || c.regime === 'neocrisis' || c.regime === 'nationalist' ? .004 * (1 - c.M) : 0), .02, .95);
      // fusion of bank and industrial capital: finance capital
      const credDep = clamp(c.invRate / .05, .3, 1.5);
      c.F = clamp(c.F + .055 * (c.M + .1) * (1 - c.F) * R.dereg * (2 - L.finreg) - .03 * (1 - R.dereg) * c.F * L.finreg, .02, .95);

      /* ===== 5. Offshoring, trade policy, rival integration ===== */
      const wageCore = W / Math.max(1e-9, Lc);
      const wageGap = wageCore / Math.max(.2, C.wmod);
      const openTo = (C.status === 'indep' ? C.open : 0) * .6 + ((B.status === 'reform' || B.status === 'rival') ? B.open : 0) * 1.0;
      if (c.regime === 'neoliberal' || c.regime === 'neocrisis' || c.regime === 'nationalist' || (c.regime === 'stagflation' && t > 1975)) {
        c.OFF += .022 * L.mobility * (1 - pw(EXO.tc, t) * 3) * clamp(Math.log(wageGap) / 3, 0, 1.3) * openTo * (1 - c.OFF) - 1.2 * pos(c.tariff - .05) * c.OFF * .3;
      }
      c.OFF = clamp(c.OFF, 0, .6);
      // tariffs: 19th-century protection, interwar spike, GATT liberalisation, nationalist reversal
      let tarT = .10;
      if (c.regime === 'crisis' || (c.money === 'breakdown')) tarT = .20;
      else if (c.regime === 'compromise') tarT = Math.max(.04, .10 - .004 * (t - 1947));
      else if (c.regime === 'stagflation') tarT = .04;
      else if (c.regime === 'neoliberal' || c.regime === 'neocrisis') tarT = .028;
      else if (c.regime === 'nationalist') tarT = .028 + .14 * pos(c.Nat - .45) + .05 * clamp(rivalWeight - .8, 0, 1);
      c.tariff += .35 * (tarT - c.tariff);

      /* ===== 6. Money, interest, inflation, hegemony ===== */
      const sHeg = c.s[c.hegemon];
      const greatY = c.GDP + A.Y + B.Y;
      c.H = sHeg * c.GDP / greatY;
      // inflation
      if (c.money === 'gold' || c.money === 'interwar') c.pi = clamp(.5 * c.pi + .12 * (c.u - .93) - .003 + (c.crash > 0 ? -.02 : 0), -.05, .06);
      else if (c.money === 'war') c.pi = .5 * c.pi + .07;
      else if (c.money === 'breakdown') c.pi = .5 * c.pi + .15 * (c.u - .9);
      else {
        const wagePush = pos(c.empRate - .935) * 2.0 * c.O * L.labour * (1 + Soc * .5);
        c.pi = .55 * c.pi + .55 * wagePush + .08 * pos(c.u - .95) + (c.oilShock > 0 ? .05 : 0) + (c.money === 'dollar' ? .006 : .002) - (c.volcker > 0 ? .02 : 0) + (c.regime === 'nationalist' ? .25 * pos(c.tariff - .04) : 0);
      }
      c.pi = clamp(c.pi, -.12, .25);
      if (c.oilShock > 0) c.oilShock--;
      // policy interest rate of the hegemon
      let iT;
      if (c.money === 'gold' || c.money === 'interwar') iT = .035 + .6 * pos(c.pi) + (c.crash > 0 ? .02 : 0);
      else if (c.money === 'war') iT = .025;
      else if (c.money === 'breakdown') iT = .02;
      else if (c.money === 'bw') iT = .02 + .5 * c.pi;
      else if (c.volcker > 0) { iT = c.volcker >= 2 ? .19 : .14; c.volcker--; }
      else if (c.zirp > 0) { iT = .002; c.zirp--; }
      else if (c.regime === 'neoliberal' || c.regime === 'neocrisis' || c.regime === 'nationalist') iT = .015 + 1.5 * pos(c.pi) - .25 * clamp(B.reserves / Math.max(1, c.Y), 0, .08) + .06 * pos(c.bub - 1.12) + .03 * pos(c.HD / Math.max(1, c.W) - .55);
      else iT = .03 + .6 * c.pi;
      c.i += .6 * (clamp(iT, .001, .22) - c.i);
      // Bretton Woods dollar overhang (foreign dollar claims / US gold), Triffin dilemma
      if (c.money === 'bw') c.Ov *= 1 + .062 + .5 * (gmil - .06) + .4 * pos(c.pi);
      // dollar's share of reserves
      if (c.money === 'bw' || c.money === 'dollar' || c.money === 'contested') {
        const DST = clamp(.78 - .35 * c.Sx + .8 * pos(c.H - .33), .35, .9);
        c.DS += .3 * (DST - c.DS);
      }

      /* ===== 7. Imperial expansion, rivalry and war ===== */
      // spheres of influence (division of the periphery)
      const exportPressure = clamp(c.Ix / Math.max(1, c.Y) * 20 + c.M * .8 + (c.slump > 0 || c.crash > 0 ? .4 : 0), 0, 2);
      for (const s of segs) {
        if (closed(s) || s.status === 'reform' || s.status === 'rival') continue;
        const vul = s.status === 'colonial' ? 1 : s.status === 'semicolony' ? (t > 1885 ? 1.4 : .8) : s.status === 'semi' ? .25 : s.status === 'empire' ? .0 : .15;
        if (s.status === 'indep') continue;
        const dS = (.006 + .020 * exportPressure) * vul * (1 - s.sphere) * L.extraction;
        s.sphere = clamp(s.sphere + dS, 0, .98);
        if (s.status === 'colonial') { s.col = clamp(s.col + dS * .8, 0, .95); s.open = clamp(s.open + dS * .5, 0, .95); }
        // new acquisitions are shared out roughly by economic weight — impossible once the world is divided
        const acq = dS * s.pop / 1000;
        c.d.old += acq * c.s.old * .9; c.d.chal += acq * c.s.chal * .55; c.d.new += acq * c.s.new * .25;
        if (s.status === 'semicolony') s.open = clamp(s.open + dS * .6, 0, .8);
        if (s.status === 'semi') s.open = clamp(s.open + dS * .4 + .002, 0, .6);
        // colonial conquest violence
        if (s.status === 'colonial' || s.status === 'semicolony') {
          const conq = dS * s.pop * .011 * L.repression;
          dy.war.total += conq; dy.war.attr += conq; regionDeaths[s.id] += conq;
        }
      }
      const objs = [B, C].filter((s) => !closed(s) && s.status !== 'reform' && s.status !== 'rival');
      const perPop = objs.reduce((a, s) => a + s.pop, 0);
      const Div = perPop > 0 ? objs.reduce((a, s) => a + s.pop * s.sphere, 0) / perPop : 0;
      S.Div = Div;
      { const z = c.d.old + c.d.chal + c.d.new; c.d.old /= z; c.d.chal /= z; c.d.new /= z; }
      // opening war against the agrarian empire (forced opening by the core)
      if (B.status === 'empire' && C.sphere > .64 && c.GDP > 340) {
        B.status = 'semicolony'; B.statusSince = t; B.sphere = .18; B.open = .25; B.theta = .12;
        addEvent(t, 'openingB', { major: true });
        const d = .02; dy.war.total += d; dy.war.attr += d; regionDeaths.B += d;
      }
      // great peasant rebellion in the semi-colony (Taiping-type)
      if (B.status === 'semicolony' && !S.flags.rebellionB && B.Imm > .20 && B.O < .05 && t - B.statusSince >= 8) {
        S.flags.rebellionB = t; B.rebellion = 14; addEvent(t, 'rebellionB', { major: true });
      }
      if (B.rebellion > 0) {
        const d = .0045 * B.pop * (B.rebellion > 3 ? 1 : .6) * (.7 + .3 * L.repression);
        dy.war.total += d; dy.war.attr += d; regionDeaths.B += d;
        B.rebellion--; if (B.rebellion === 0) { B.sphere = clamp(B.sphere + .15, 0, .9); B.open = clamp(B.open + .1, 0, .8); }
      }
      // a fully divided semi-colony fragments (warlord rule): weaker state, civil strife
      if (B.status === 'semicolony' && B.sphere > .80 && S.flags.rebellionB && t - S.flags.rebellionB > 40 && !S.flags.fragmentB) {
        S.flags.fragmentB = t; B.civilWar = 99; addEvent(t, 'fragmentB', { major: false });
      }
      if (B.status !== 'semicolony') B.civilWar = 0;
      // inter-imperialist rivalry: economic weight vs. share of the divided world
      const chalGap = pos(c.s.chal - c.d.chal);
      const newGap = pos(c.s.new - c.d.new) * .35;
      const Riv = Math.pow(Div, 7) * (2.2 * chalGap + newGap) * (1 + 1.2 * c.fascist + .4 * c.Nat) * (1 + .6 * pos(.85 - c.u)) * (c.regime === 'laissez' ? .3 : 1) * (c.regime === 'compromise' || c.regime === 'stagflation' || t > 1950 ? .15 : 1);
      S.Riv = Riv;
      // tension accumulates (arms races, diplomatic crises) while rivalry stays high
      c.tension = Math.max(0, (c.tension || 0) + pos(Riv - .38) - .02);
      if (c.fascist > 0 && !war) c.tension += .06;   // fascist regimes arm and expand whether or not the world is already divided
      const warReady = (c.wars === 0 && Div > .87 && c.M > .33) || (c.fascist > 0 && t - (S.flags.fascism || t) >= 6);
      if (!war && warReady && t - c.lastWarEnd > 15 && c.wars < 2 && c.tension > .42 + .10 * nz[4]) {
        c.tension = 0;
        c.wars++;
        const fasc = c.fascist > 0;   // a war launched by fascist powers is a war of extermination and total redivision
        const intensity = fasc ? 1.55 : 1;
        c.war = { n: c.wars, fasc, start: t, left: fasc ? 6 : 4, intensity, regimeBefore: c.regime };
        c.regime = 'war';
        if (c.money === 'gold' || c.money === 'interwar' || c.money === 'breakdown') c.money = 'war';
        addEvent(t, 'war', { n: c.wars, fasc, major: true, Riv: Riv });
      }
      if (c.war) {
        const w = c.war;
        // destructive forces scale with productive forces
        const destr = Math.pow(c.A / 10.0, .55);
        const killK = .0105 * w.intensity * destr;
        let base = c.P * .55 + (A.status === 'semi' || A.status === 'socialist' ? A.pop * (w.fasc ? 1.0 : .55) : 0) + (w.fasc ? B.pop * .26 : 0) + C.pop * (w.fasc ? .025 : .012);
        let dd = killK * base * (w.fasc ? .57 : 1);
        dy.war.total += dd; dy.war.attr += dd;
        regionDeaths.core += dd * .45; regionDeaths.A += dd * .35; regionDeaths.B += dd * (w.fasc ? .15 : 0); regionDeaths.C += dd * (w.fasc ? .05 : .2);
        // fascist mass murder (terror and genocide) during the second war
        if (w.fasc && c.fascist > 0) {
          const gen = .0020 * c.fascist / .3 * (c.P + A.pop) * L.repression;
          dy.repression.total += gen; dy.repression.attr += gen; regionDeaths.core += gen * .5; regionDeaths.A += gen * .5;
        }
        // physical destruction in the war zone (old + challengers)
        const zone = (c.s.old + c.s.chal) * (w.fasc ? 1.2 : .6);
        c.K *= 1 - .035 * w.intensity * zone;
        w.left--;
        if (w.left <= 0) {
          c.war = null; c.lastWarEnd = t; c.bub = 1.0;   // war liquidates the old speculative structures
          // redivision: the losing challengers' colonies pass to the winners; their capital is wrecked
          c.d.old += c.d.chal * .6; c.d.new += c.d.chal * .4; c.d.chal = 0;
          c.s.chal *= w.fasc ? .55 : .70; c.s.old *= w.fasc ? .80 : .92;
          const z = c.s.new + c.s.chal + c.s.old; c.s.new /= z; c.s.chal /= z; c.s.old /= z;
          if (!w.fasc) {
            c.regime = 'interwar'; c.regimeSince = t; c.money = 'interwar'; c.hegemon = c.s.new > c.s.old ? 'new' : 'old';
            addEvent(t, 'warEnd', { n: w.n, major: false });
          } else {
            c.fascist = 0; S.flags.fascWar = t;
            c.hegemon = 'new';
            const Hn = c.s.new * c.Y / (c.Y + A.Y + B.Y);
            c.money = 'bw'; c.Ov = .40; c.DS = .75;
            c.regime = 'compromise'; c.regimeSince = t;
            addEvent(t, 'warEnd', { n: w.n, major: false });
            addEvent(t, 'brettonWoods', { major: true, H: Hn });
            addEvent(t, 'compromise', { major: true });
          }
        }
      }

      /* ===== 8. Revolutions, liberation, restoration ===== */
      // revolution in the weakest link (semi-periphery during an imperialist war)
      if (A.status === 'semi' && (war || t - c.lastWarEnd <= 1) && A.O > .20 && A.Imm > .40 && c.wars >= 1) {
        revolution(A, t, 'revolutionA');
      }
      // protracted people's war in the semi-colony: liberated base areas grow
      if (B.status === 'semicolony' && B.O > .10) {
        const invasion = war && war.fasc ? 1.4 : 1;
        B.Lib = clamp(B.Lib + .22 * B.O * (B.Imm + .2) * (1 - B.Lib) * invasion * L.periOrg - .040 * B.Rep * B.Lib * L.repression * (1 - B.Lib), 0, 1);
        if (!S.flags.baseAreas && B.Lib > .03) { S.flags.baseAreas = t; addEvent(t, 'baseAreas', { major: false }); }
        if (B.Lib > .5 && !c.war && (S.flags.fascWar || B.Lib > .8) && t - c.lastWarEnd >= 3) revolution(B, t, 'revolutionB');   // the old order falls once the imperialist war has exhausted it
      }
      // national liberation: formal independence after the second war weakens the colonial powers
      if (C.status === 'colonial' && !c.war && (S.flags.fascWar || (t > 1950 && C.Nat > .45))) {
        const push = pos(C.Nat - .35) * (1 + .5 * Soc) * (S.flags.fascWar ? 1 : .6);
        C.col = clamp(C.col - .16 * push * C.col - .006, 0, 1);
        if (!S.flags.decol) { S.flags.decol = t; addEvent(t, 'decolonization', { major: true }); }
        if (C.col < .12) {
          C.status = 'indep'; C.statusSince = t; C.nd = clamp(.35 + .45 * Soc, 0, .8); C.theta = 0; C.open = .35;
          addEvent(t, 'independence', { major: false });
        }
      }
      // liberated zones inside the periphery (people's war in parts of C)
      if ((C.status === 'colonial' || C.status === 'indep') && C.O > .10 && t > 1940) {
        const prev = C.liberated;
        C.liberated = clamp(C.liberated + .010 * C.O * C.Imm * L.periOrg * (1 + Soc) - .006 * C.Rep * L.repression * C.liberated, 0, .6);
        // counter-insurgency and proxy wars waged by the hegemon (Korea/Vietnam type)
        if (Soc > .15 && c.hegemon === 'new') {
          const inten = clamp(C.liberated * 4 + C.O, 0, 1.5) * L.intervention;
          const d = .0005 * inten * C.pop * (nz[5] < .45 ? 1 : .35) * (t < 1980 ? 1 : .35);
          dy.war.total += d; dy.war.attr += d; regionDeaths.C += d;
          if (!S.flags.proxy && d > .25) { S.flags.proxy = t; addEvent(t, 'proxyWar', { major: true }); }
        }
        if (C.liberated > .5 && C.status !== 'socialist') revolution(C, t, 'revolutionC');
      }
      // coups against national-developmental governments (with ensuing massacres)
      if (C.status === 'indep' && C.nd > .12 && c.hegemon === 'new' && Soc > .1 && t < 1992) {
        const pCoup = .085 * L.intervention * C.nd * (1 + C.O);
        if (nz[6] < pCoup) {
          C.nd = clamp(C.nd - .07, 0, 1); C.open = clamp(C.open + .03, 0, .9);
          const d = (.12 + .5 * C.O * nz[7]) * L.repression;
          dy.repression.total += d; dy.repression.attr += d; regionDeaths.C += d;
          S.flags.coups = (S.flags.coups || 0) + 1;
          addEvent(t, 'coup', { major: !S.flags.firstCoup, deaths: d });
          S.flags.firstCoup = S.flags.firstCoup || t;
        }
      }
      // revisionism and capitalist restoration in the socialist zones (MLM thesis)
      for (const s of [A, B]) {
        if (s.status === 'socialist') {
          const age = t - s.statusSince;
          const ms = L.supervision;
          s.Rv += (s.id === 'A' ? .010 + .00075 * age : .004 + .0022 * age) - .006 * (ms - 1);
          s.Rv = Math.max(0, s.Rv);
          if (s.Rv >= 1) {
            if (s.id === 'A') { s.status = 'restored'; s.statusSince = t; addEvent(t, 'restorationA', { major: true }); }
            else { s.status = 'reform'; s.statusSince = t; s.open = .05; addEvent(t, 'restorationB', { major: true }); }
          }
        }
      }
      // the restored closed bloc: stagnation, arms race, debts, collapse
      if (A.status === 'restored') {
        A.debt += .006 * A.Y * (c.money === 'dollar' ? 1 : .2);
        const gA_ = A.ypc / Math.max(1, A.ypcPrev || A.ypc) - 1;
        A.Leg = clamp(A.Leg - .0028 - .25 * pos(.025 - gA_) - .004 * pos(2.5 - c.oil) * (c.oil < 4 ? 1 : 0) - .02 * A.debt / Math.max(1, A.Y), 0, 1);
        if (A.Leg < .26 && (c.regime === 'neoliberal' || c.regime === 'neocrisis')) {
          A.status = 'postsoviet'; A.statusSince = t; A.collapse = 6; A.open = .45; A.Kx += .12 * A.Kd; A.Kd *= .80; A.transition = 11;
          addEvent(t, 'collapseA', { major: true });
        }
      }
      if (A.status === 'postsoviet' && A.transition > 0) {
        const d = .00070 * A.pop * (A.transition > 4 ? 1 : .5);
        dy.transition.total += d; dy.transition.attr += d; regionDeaths.A += d; A.transition--;
      }
      // reform and opening of the second restored zone; it becomes the rival
      if (B.status === 'reform') {
        B.open = clamp(B.open + .013 * (c.regime === 'neoliberal' || c.regime === 'neocrisis' ? 1.5 : .8) * L.mobility, 0, .9);
        if (B.open > .52) { B.status = 'rival'; B.statusSince = t; addEvent(t, 'rivalJoins', { major: true }); }
      }
      // capital flows into the opened zones (offshoring) and rival capital export
      if ((B.status === 'reform' || B.status === 'rival') && !war) {
        const fdi = .55 * Ix * B.open * (1 + 2 * c.OFF) / (1 + C.open);
        B.Kx += fdi;
        B.reserves = B.reserves * .97 + .06 * B.Y * (B.status === 'rival' ? 1 : .4);
      }
      if (C.status === 'indep' || C.status === 'colonial') C.Kx += .45 * Ix * (C.status === 'indep' ? C.open : 1) / (1 + (B.status === 'rival' ? B.open : 0));
      if (A.status === 'semi' || A.status === 'postsoviet') A.Kx += .12 * Ix * A.open;
      if (B.status === 'semicolony') B.Kx += .18 * Ix * B.open;
      if (B.status === 'rival' && t > 2010) { const out = .015 * B.Y; C.Kr += out; }
      // periphery debt: development loans and petrodollar recycling
      if (C.status === 'indep') {
        const recycling = c.money === 'dollar' && c.oil > 2 ? .028 : .010;
        C.debt += recycling * C.Y * (c.volcker > 0 || C.sap > 0 ? .3 : 1);
        const dsr = C.debtServ / Math.max(1, C.exports);
        if (!S.flags.debtCrisis && dsr > .15 && c.i > .12) {
          S.flags.debtCrisis = t; C.sap = 18; C.nd = clamp(C.nd - .25, 0, 1); C.open = clamp(C.open + .25, 0, .9);
          C.Kx += .10 * C.Kd; C.Kd *= .9; C.debt *= .85;
          addEvent(t, 'debtCrisis', { major: true, dsr });
        }
      }
      if (C.sap > 0) { C.sap--; C.open = clamp(C.open + .01, 0, .9); C.exportCrop = clamp(C.exportCrop + .003, 0, .18); }
      // oil producers' cartel after the dollar floats (resource nationalism)
      if (c.money === 'dollar' && !S.flags.oil && C.nd > .2 && c.pi > .03) {
        S.flags.oil = t; c.oil = 4; c.oilShock = 3; addEvent(t, 'oilShock', { major: true });
      }
      if (c.oil > 1.5 && t - (S.flags.oil || t) > 12) c.oil = Math.max(1.5, c.oil * .9);

      /* ===== 9. Regime changes in the core ===== */
      if (c.regime === 'laissez' && c.M > .30 && Div > .74) { c.regime = 'imperial'; c.regimeSince = t; addEvent(t, 'imperialPolitics', { major: false }); }
      // financial crash: bubble on fictitious capital or household debt service
      const dsr = ds / Math.max(1, W);
      const tight = c.i > c.iPrev + .002 || c.r < c.rPrev;
      const hdw = c.HD / Math.max(1, W);
      const debtCrash = dsr > .075 || hdw > 1.0;                     // household debt service becomes unpayable
      const bubbleCrash = c.bub > 1.42 && tight;                      // fictitious capital deflates when credit tightens
      if (c.crash === 0 && t - c.lastCrash > 6 && !war && (debtCrash || bubbleCrash)) {
        c.crash = 3; c.lastCrash = t; c.crashCount++;
        const gold = c.money === 'gold' || c.money === 'interwar';
        const big = debtCrash || (gold && c.F > .3);
        c.crashBig = big;
        c.bub = .78; c.FA *= .72;
        const dv = gold ? .12 : .03;   // bankruptcies devalue capital; bailouts limit devaluation
        c.K *= 1 - dv; c.kappa *= 1 - dv;
        if (gold) { c.F *= .82; c.depression = 6; c.HD *= .9; }
        else if (big) { c.GD += .25 * c.Y; c.zirp = 7; c.F *= .93; c.HD *= .9; c.delever = 4; c.postCrisis = 1; }
        else { c.GD += .04 * c.Y; c.zirp = 2; c.F *= .98; }
        addEvent(t, 'crash', { major: big && !S.flags['crash' + c.money], gold, dsr, big });
        if (big) S.flags['crash' + c.money] = true;
        if (c.regime === 'interwar') { c.regime = 'crisis'; c.regimeSince = t; c.money = 'breakdown'; addEvent(t, 'depression', { major: true }); }
        else if (c.regime === 'neoliberal' && big) { c.regime = 'neocrisis'; c.regimeSince = t; addEvent(t, 'financialCrisis', { major: true }); }
      }
      if (c.crash > 0) c.crash--;
      if (c.depression > 0) c.depression--;
      // fascism: finance capital's answer to depression plus a revolutionary threat
      if (c.regime === 'crisis' && c.fascist === 0 && t - c.regimeSince >= 10 && !war) { c.regime = 'compromise'; c.regimeSince = t; c.money = c.money === 'breakdown' ? 'bw' : c.money; c.Ov = .4; c.DS = .7; c.hegemon = c.s.new > c.s.old ? 'new' : 'old'; addEvent(t, 'newDeal', { major: true }); }
      if (c.regime === 'crisis' && c.fascist === 0 && t - c.regimeSince >= 3 && c.Nat > .20 && (c.Mil > .14 || Soc > .1) && c.F > .25) {
        S.flags.fascism = t;
        c.fascist = clamp(c.s.chal * (.8 + .4 * c.Nat), .1, .6);
        c.d.chal = Math.max(.0, c.d.chal);
        addEvent(t, 'fascism', { major: true, share: c.fascist });
      }
      // chronic stagnation or a failed return to the gold standard turns into a general crisis of the regime
      c.stagU = c.U > .10 ? (c.stagU || 0) + 1 : Math.max(0, (c.stagU || 0) - 1);
      if (!war && c.M > .35 && (((c.regime === 'laissez' || c.regime === 'imperial') && t > 1925 && c.stagU >= 5) || (c.regime === 'interwar' && (c.stagU >= 6 || t - c.regimeSince >= 20)))) {
        c.regime = 'crisis'; c.regimeSince = t; if (c.money === 'gold' || c.money === 'interwar') c.money = 'breakdown';
        c.depression = Math.max(c.depression, 4); c.stagU = 0;
        addEvent(t, 'depression', { major: true, stagnation: true });
      }
      // overproduction crises (non-financial)
      if (!war && c.u < .90 && (S.flags.lastSlump || 0) < t - 5) {
        S.flags.lastSlump = t; c.K *= .96; c.kappa *= .96; c.slump = 2;
        addEvent(t, 'slump', { major: !S.flags.firstSlump, u: c.u }); S.flags.firstSlump = S.flags.firstSlump || t;
      }
      if (c.slump > 0) c.slump--;
      // the 1970s: profit squeeze and stagflation
      if (c.regime === 'compromise') {
        if (t - c.regimeSince >= 3 && t - c.regimeSince <= 15) c.rMaxPost = Math.max(c.rMaxPost, c.r);
        if (t - c.regimeSince > 15 && ((c.r < .86 * c.rMaxPost && c.pi > .045) || c.stagU >= 6)) c.stagYears++; else c.stagYears = Math.max(0, c.stagYears - 1);
        if (c.stagYears >= 2) { c.regime = 'stagflation'; c.regimeSince = t; addEvent(t, 'profitSqueeze', { major: true }); }
      }
      if (c.money === 'bw' && c.Ov > 3.8 && (c.regime === 'stagflation' || c.regime === 'compromise')) {
        c.money = 'dollar'; addEvent(t, 'nixonShock', { major: true, Ov: c.Ov });
      }
      if (c.regime === 'stagflation' && t - c.regimeSince >= 9 && (c.money === 'dollar' || t - c.regimeSince >= 12)) {
        const leftPow = .5 * c.O * L.labour + .5 * c.Mil;
        // the crisis is resolved by whichever side is stronger when it comes to a head
        if (leftPow > c.Pk - .02) {
          c.regime = 'radical'; c.regimeSince = t; addEvent(t, 'radical', { major: true, left: leftPow, Pk: c.Pk });
        } else {
          c.regime = 'neoliberal'; c.regimeSince = t; c.volcker = c.pi > .05 ? 3 : 0;
          addEvent(t, 'neoliberal', { major: true, pi: c.pi, left: leftPow, Pk: c.Pk });
        }
      }
      // nationalist-protectionist turn
      if ((c.regime === 'neocrisis' || c.regime === 'neoliberal') && t > 1995) {
        const deindu = pos(c.manuPeak - c.manu) / c.manuPeak;
        if (c.Nat > .48 && c.Leg < .46 && deindu > .30 && rivalWeight > .40) {
          c.regime = 'nationalist'; c.regimeSince = t; c.nationalistSince = t;
          addEvent(t, 'nationalist', { major: true, Nat: c.Nat });
        }
      }
      if (c.regime === 'neocrisis' && t - c.regimeSince > 8) { c.regime = 'neoliberal'; c.regimeSince = t; }
      // dollar weaponisation: sanctions rise as hegemony erodes
      if (c.money === 'dollar' && t > 1990) {
        const SxT = clamp((.05 + .35 * clamp(rivalWeight, 0, 1.2) + (c.regime === 'nationalist' ? .15 : 0) + .6 * pos(.30 - c.H)) * L.intervention, 0, 1);
        c.Sx += .2 * (SxT - c.Sx);
        if (!S.flags.weapon && c.Sx > .30) { S.flags.weapon = t; addEvent(t, 'dollarWeapon', { major: true }); }
        A.sanctioned = t > 2013 ? .55 : .1; C.sanctioned = .045; B.sanctioned = t > 2018 ? .02 : 0;
      }

      /* ===== 10. Deaths ledger ===== */
      // periphery: famine and chronic poverty (total vs drain-attributable counterfactual)
      // chronic poverty: mass consumption is spread lognormally (sigma .6, ~ consumption Gini .33) over ten deciles;
      // excess mortality rises steeply below subsistence and reaches zero at c = 3.9 (about the 'ethical poverty line')
      const kPov = .0092 * (pw(EXO.dfloor, t) / .026);
      const povD = (cc) => {
        let acc = 0;
        for (const z of DEC) { const ci = cc * Math.exp(-.18 + .6 * z); if (ci < C_ETH) acc += Math.exp(-1.2 * (ci - 1)) - Math.exp(-1.2 * (C_ETH - 1)); }
        return kPov * acc / DEC.length;
      };
      const famD = (cc) => cc < 1.0 ? .25 * Math.pow(1.0 - cc, 2) : 0;   // famine mortality in the stricken region
      for (const s of segs) {
        if (isSoc(s) || s.status === 'restored') continue; // internal mortality of socialist zones is not modelled
        const pT = pos(povD(s.c)) * s.pop, pA = pos(povD(s.c) - povD(s.cCF)) * s.pop;
        const fT = s.ra > 0 ? famD(s.cReg) * s.pop * s.ra : 0;
        const fA = s.ra > 0 ? pos(famD(s.cReg) - famD(s.cRegCF)) * s.pop * s.ra : 0;
        dy.poverty.total += pT; dy.poverty.attr += pA;
        dy.famine.total += fT; dy.famine.attr += fA;
        regionDeaths[s.id] += pT + fT;
        s.famine = fT; s.povT = pT; s.povA = pA;
        // repression of organised resistance (colonial and comprador states)
        const rep = .00006 * s.Rep * (s.O + .6 * s.Nat) * s.pop * L.repression * (s.status === 'colonial' || s.status === 'semicolony' ? 1.2 : .8);
        dy.repression.total += rep; dy.repression.attr += rep; regionDeaths[s.id] += rep;
        // sanctions-attributable mortality (contested; calibrated to a single study)
        const sx = s.sanctioned * c.Sx * s.pop * .00028;
        dy.sanctions.total += sx; dy.sanctions.attr += sx; regionDeaths[s.id] += sx;
        // occupational accidents in modern production
        const Lm = s.Ymod / (1.0 + 1.5 * s.ypc / 1000);
        const occ = Lm * (.00017 - .00006 * clamp(s.O, 0, 1));
        dy.occupational.total += occ; dy.occupational.attr += occ * .85;
      }
      // the core: strike repression, occupational deaths, despair
      const repC = .0000035 * c.Rep * c.Mil * c.P * L.repression * (1 + 2 * c.fascist);
      dy.repression.total += repC; dy.repression.attr += repC; regionDeaths.core += repC;
      const occRate = clamp(.00045 * Math.pow(4.0 / c.A, .55) * (1 - .55 * c.O) * (.7 + .3 * R.dereg), .00001, .001);
      const occC = Lc * c.manu * occRate;
      dy.occupational.total += occC; dy.occupational.attr += occC * clamp(1 - .00001 / occRate, 0, 1);
      if (t > 1985) {
        const desp = c.P * .00018 * clamp(deind * 1.7 + 1.2 * pos(c.top1 - .14) + 2 * pos(c.U - .05), 0, 1.2) * (t > 1995 ? 1 : .5);
        dy.despair.total += desp; dy.despair.attr += desp; regionDeaths.core += desp;
      }
      // subtract excess deaths from populations
      c.P -= regionDeaths.core; A.pop -= regionDeaths.A; B.pop -= regionDeaths.B; C.pop -= regionDeaths.C;
      for (const k of CAT) { S.deaths[k].total += dy[k].total; S.deaths[k].attr += dy[k].attr; }

      /* ===== 11. Lenin's five features and later markers ===== */
      const xShare = c.Kx / (c.K + c.Kx);
      const cart = c.M * xShare * 5;
      if (c.M >= .35 && feature('monopoly', t)) addEvent(t, 'feat_monopoly', { major: true, M: c.M });
      if (c.F >= .40 && c.M >= .30 && feature('finance', t)) addEvent(t, 'feat_finance', { major: true, F: c.F });
      if (xShare >= .13 && feature('export', t)) addEvent(t, 'feat_export', { major: true, x: xShare });
      if (cart >= .25 && feature('cartels', t)) addEvent(t, 'feat_cartels', { major: true });
      if (Div >= .88 && feature('division', t)) addEvent(t, 'feat_division', { major: true, Div });
      if (S.feat.monopoly && S.feat.finance && S.feat.export && S.feat.cartels && S.feat.division && feature('imperialism', t)) addEvent(t, 'imperialism', { major: true });
      if (c.OFF > .12 && feature('arbitrage', t)) addEvent(t, 'arbitrage', { major: true });
      if (c.F > .62 && c.finShare > .25 && c.M > .55 && feature('monofin', t)) addEvent(t, 'monofin', { major: true });

      /* ===== 12. Contradictions (model reading) ===== */
      const capLab = clamp(.9 * c.U + .9 * c.Mil + .5 * pos(.62 - c.omega) * 3 + (c.crash > 0 ? .1 : 0), 0, 1);
      const impOpp = clamp((C.drainShare * 2.2 + C.Imm * .35 + C.Rep * .25 + (C.status === 'colonial' ? .15 : 0)) * (C.status === 'socialist' ? 0 : 1), 0, 1);
      const interImp = clamp(Riv * 1.6 + (war ? .6 : 0), 0, 1);
      const campCon = clamp((isSoc(A) || isSoc(B) || A.status === 'restored' ? Soc * 1.2 : 0) + (S.flags.proxy && t < 1990 ? .08 : 0), 0, 1);
      const forcesRel = clamp((1 - c.u) * 2.4 + (c.Ystar - c.massCons) / c.Ystar * .25, 0, 1);
      const hegRiv = clamp(B.status === 'rival' ? rivalWeight * .75 + (c.regime === 'nationalist' ? .2 : 0) : 0, 0, 1);
      const feudal = clamp(B.status === 'semicolony' || B.status === 'empire' ? B.Imm * .8 * (B.rho > 0 ? 1 : 0) + .1 : 0, 0, 1);
      const contra = { capLab, impOpp, interImp, campCon, forcesRel, hegRiv, feudal };
      let principal = 'capLab', pmax = -1;
      for (const k in contra) if (contra[k] > pmax) { pmax = contra[k]; principal = k; }

      /* ===== 13. Bookkeeping ===== */
      const mfgCore = c.Y * pw(EXO.mfgY, t) * (1 - .9 * c.OFF);
      const mfgSeg = {};
      for (const s of segs) {
        const craft = s.Ytrad * s.hc;
        const modern = s.Ymod * (closed(s) ? .45 : s.status === 'rival' || s.status === 'reform' ? .45 : .28);
        mfgSeg[s.id] = craft + modern;
      }
      const offshoredMfg = c.Y * pw(EXO.mfgY, t) * .9 * c.OFF;
      const mfgTot = mfgCore + mfgSeg.A + mfgSeg.B + mfgSeg.C;
      c.rPrev = c.r; c.iPrev = c.i;
      c.Wprev = W; c.Lprev = Lc; c.TrPrev = Tr; c.FIprev = FI; c.IxPrev = Ix;
      for (const s of segs) s.ypcPrev = s.ypc;
      const totDeaths = CAT.reduce((a, k) => a + dy[k].total, 0);
      const attrDeaths = CAT.reduce((a, k) => a + dy[k].attr, 0);
      const phase = phaseOf(S, c, c.war || war);
      const rec = {
        t, phase, regime: c.regime, money: c.money, hegemon: c.hegemon,
        P: c.P, Y: c.Y, Ystar: c.Ystar, Ycap: c.Ycap, Ylab: c.Ylab, u: c.u, uK: c.uK, U: c.U, omega: c.omega, e: c.e, r: c.r,
        kappa: c.kappa, occ: c.K / Math.max(1e-9, W), K: c.K, Kx: c.Kx, xShare, M: c.M, F: c.F, finShare: c.finShare,
        FAy: c.FA / c.Y, HDw: c.HD / Math.max(1, W), GDy: c.GD / c.Y, top1: c.top1, O: c.O, Mil: c.Mil, Leg: c.Leg, Nat: c.Nat, Rep: c.Rep, Pk: c.Pk, LA: c.LA,
        i: c.i, pi: c.pi, OFF: c.OFF, manu: c.manu, tariff: c.tariff, gmil: c.gmil, H: c.H, DS: c.DS, Ov: c.Ov, Sx: c.Sx, oil: c.oil,
        massCons: c.massCons, Ck: c.Ck, I: c.I, G: c.G, X: c.X, Ix: c.Ix, FI: c.FI, supShare: c.supShare, HHc: c.HHc, AP: c.AP, bub: c.bub,
        ypcCore: c.Y * 1000 / c.P, wageCore, Soc, Div, Riv, fascist: c.fascist,
        sNew: c.s.new, sOld: c.s.old, sChal: c.s.chal, dNew: c.d.new, dOld: c.d.old, dChal: c.d.chal, cart,
        warN: (c.war || war) ? (c.war || war).n : 0, warFasc: (c.war || war) ? !!(c.war || war).fasc : false, wars: c.wars,
        crash: c.crash, depression: c.depression, tension: c.tension || 0,
        seg: {},
        mfg: { core: mfgCore / mfgTot, A: mfgSeg.A / mfgTot, B: mfgSeg.B / mfgTot, C: mfgSeg.C / mfgTot, offshored: offshoredMfg / mfgTot },
        contra, principal,
        dy: {}, totDeaths, attrDeaths, regionDeaths,
        cum: {}
      };
      for (const s of segs) {
        rec.seg[s.id] = {
          pop: s.pop, Y: s.Y, ypc: s.ypc, c: s.c, Imm: s.Imm, O: s.O, Nat: s.Nat, Rep: s.Rep, Lib: s.Lib, Rv: s.Rv, status: s.status,
          col: s.col, sphere: s.sphere, open: s.open, drain: s.drain, drainShare: s.drainShare, debt: s.debt, debtY: s.debt / s.Y,
          tribute: s.tribute, repat: s.repat, ue: s.ue, debtServ: s.debtServ, flight: s.flight || 0, liberated: s.liberated || 0, nd: s.nd || 0,
          famine: s.famine || 0, povT: s.povT || 0, povA: s.povA || 0, Kx: s.Kx, Kd: s.Kd, Ymod: s.Ymod, reserves: s.reserves || 0, hc: s.hc
        };
      }
      for (const k of CAT) { rec.dy[k] = { total: dy[k].total, attr: dy[k].attr }; rec.cum[k] = { total: S.deaths[k].total, attr: S.deaths[k].attr }; }
      hist.push(rec);
      S.t = t;
      snaps[t] = JSON.stringify(S);
      return rec;
    }

    function revolution(s, t, type) {
      const c = S.core;
      s.status = 'socialist'; s.statusSince = t; s.Kx = 0; s.debt = 0; s.theta = 0; s.open = 0; s.Rv = 0; s.sphere = 0; s.col = 0;
      s.landReform = true; s.Lib = 1;
      for (const o of ['A', 'B', 'C']) if (o !== s.id) S.seg[o].inspired = 1;
      c.Mil = clamp(c.Mil + .12, 0, 1);
      addEvent(t, type, { major: true, pop: s.pop });
    }

    function phaseOf(S, c, war) {
      if (war) return war.n === 1 ? 'First inter-imperialist war' : 'Second inter-imperialist war';
      if (c.regime === 'laissez') return S.feat.monopoly ? 'Transition to monopoly' : 'Competitive industrial capitalism';
      if (c.regime === 'imperial') return S.feat.imperialism ? 'Imperialism: monopoly and finance capital' : 'Transition to monopoly';
      if (c.regime === 'interwar') return 'Unstable peace after the first war';
      if (c.regime === 'crisis') return c.fascist > 0 ? 'Depression, fascism and rearmament' : 'Great depression';
      if (c.regime === 'compromise') return 'Post-war compromise under dollar–gold hegemony';
      if (c.regime === 'stagflation') return 'Profit squeeze and stagflation';
      if (c.regime === 'neoliberal') return S.core.OFF > .12 ? 'Neoliberal globalisation on the dollar standard' : 'Neoliberal turn';
      if (c.regime === 'neocrisis') return 'Financial crash and rescue';
      if (c.regime === 'nationalist') return 'Nationalist-protectionist turn';
      if (c.regime === 'radical') return 'Radical-reform path (counterfactual)';
      if (c.regime === 'war') return 'Inter-imperialist war';
      return c.regime;
    }

    function runTo(year) { while (S.t < year && S.t < END) step(); return hist; }
    function setLevers(next) { lev = Object.assign({}, lev, next); }
    function getLevers() { return Object.assign({}, lev); }
    // rewind to the end of a given year and drop later history
    function rewind(year) {
      year = Math.max(START, Math.min(year, S.t));
      S = JSON.parse(snaps[year]);
      hist = hist.filter((r) => r.t <= year);
      for (const k in snaps) if (+k > year) delete snaps[k];
      return S;
    }
    return { step, runTo, rewind, setLevers, getLevers, get state() { return S; }, get history() { return hist; }, seed };
  }

  return { createModel, START, END, DEFAULT_LEVERS, CAT, REG, pw, EXO };
});
