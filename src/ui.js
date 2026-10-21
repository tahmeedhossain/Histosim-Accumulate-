(function () {
  'use strict';
  const E = window.AccEngine;
  const START = E.START, END = E.END;
  const $ = (id) => document.getElementById(id);
  const NS = 'http://www.w3.org/2000/svg';
  const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);

  const store = {
    get(k, d) { try { const v = localStorage.getItem('accumulate.' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('accumulate.' + k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } }
  };
  function svgEl(tag, attrs, parent) {
    const n = document.createElementNS(NS, tag);
    if (attrs) for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function el(tag, cls, text, parent) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== null && text !== undefined) n.textContent = text;
    if (parent) parent.appendChild(n);
    return n;
  }
  function svgText(parent, x, y, str, opt) {
    opt = opt || {};
    const t = svgEl('text', { x, y }, parent);
    if (opt.anchor) t.setAttribute('text-anchor', opt.anchor);
    t.style.fontSize = (opt.size || 11) + 'px';
    if (opt.weight) t.style.fontWeight = opt.weight;
    t.style.fill = opt.fill || 'var(--ink-2)';
    if (opt.mono) t.style.fontFamily = 'var(--font-mono)';
    if (opt.upper) { t.style.textTransform = 'uppercase'; t.style.letterSpacing = '.06em'; }
    t.textContent = str;
    return t;
  }

  /* ---------------- formatting ---------------- */
  const pct = (x, d = 1) => (x * 100).toFixed(d) + '%';
  function fmtCap(v) { if (v >= 1000) return (v / 1000).toFixed(v >= 10000 ? 1 : 2) + ' tn'; return v.toFixed(0) + ' bn'; }
  function fmtLives(m) {
    if (m >= 100) return Math.round(m).toLocaleString('en-US') + ' M';
    if (m >= 10) return m.toFixed(1) + ' M';
    if (m >= 1) return m.toFixed(2) + ' M';
    if (m >= 0.001) return Math.round(m * 1000) + 'k';
    if (m > 0) return '<1k';
    return '0';
  }
  const fmtPop = (m) => (m >= 1000 ? (m / 1000).toFixed(2) + ' bn' : m.toFixed(0) + ' M');
  const fmtMoney = (v) => '$' + Math.round(v).toLocaleString('en-US');

  /* ---------------- references (checked unless flagged) ---------------- */
  const REF = {
    capital_v1_25: ['Marx, Capital vol. I, ch. 25: The General Law of Capitalist Accumulation', 'https://www.marxists.org/archive/marx/works/1867-c1/ch25.htm'],
    capital_v3_13: ['Marx, Capital vol. III, ch. 13: The Law As Such (falling rate of profit)', 'https://www.marxists.org/archive/marx/works/1894-c3/ch13.htm'],
    capital_v3_30: ['Marx, Capital vol. III, ch. 30: Money-Capital and Real Capital I', 'https://www.marxists.org/archive/marx/works/1894-c3/ch30.htm'],
    engels1858: ['Engels to Marx, 7 October 1858 (French text)', 'https://www.marxists.org/francais/engels/works/1858/10/fe18581007.htm'],
    hilferding: ['Hilferding, Das Finanzkapital (1910)', 'https://www.marxists.org/archive/hilferding/1910/finkap/index.htm'],
    luxemburg: ['Luxemburg, The Accumulation of Capital (1913)', 'https://www.marxists.org/archive/luxemburg/1913/accumulation-capital/index.htm'],
    bukharin: ['Bukharin, Imperialism and World Economy (written 1915)', 'https://www.marxists.org/archive/bukharin/works/1917/imperial/preface.htm'],
    lenin_ch7: ['Lenin, Imperialism, the Highest Stage of Capitalism (1916), ch. VII', 'https://www.marxists.org/archive/lenin/works/1916/imp-hsc/ch07.htm'],
    lenin_split: ['Lenin, Imperialism and the Split in Socialism (1916)', 'https://www.marxists.org/archive/lenin/works/1916/oct/x01.htm'],
    mao_classes: ['Mao, Analysis of the Classes in Chinese Society (1926)', 'https://www.marxists.org/reference/archive/mao/selected-works/volume-1/mswv1_1.htm'],
    mao_contradiction: ['Mao, On Contradiction (1937)', 'https://www.marxists.org/reference/archive/mao/selected-works/volume-1/mswv1_17.htm'],
    mao_ccp: ['Mao, The Chinese Revolution and the Chinese Communist Party (1939)', 'https://www.marxists.org/reference/archive/mao/selected-works/volume-2/mswv2_23.htm'],
    mao_newdem: ['Mao, On New Democracy (1940)', 'https://www.marxists.org/reference/archive/mao/selected-works/volume-2/mswv2_26.htm'],
    mao_foolish: ['Mao, The Foolish Old Man Who Removed the Mountains (1945)', 'https://www.marxists.org/reference/archive/mao/selected-works/volume-3/mswv3_26.htm'],
    mao_pdd: ["Mao, On the People's Democratic Dictatorship (1949)", 'https://www.marxists.org/reference/archive/mao/selected-works/volume-4/mswv4_65.htm'],
    dimitrov: ['Dimitrov, report to the 7th Comintern Congress, 2 August 1935', 'https://www.marxists.org/reference/archive/dimitrov/works/1935/08_02.htm'],
    rim1984: ['Revolutionary Internationalist Movement, Declaration (1984)', 'https://www.bannedthought.net/International/RIM/Docs/RIM-Declaration-1984-A.pdf'],
    rim1993: ['RIM, Long Live Marxism-Leninism-Maoism! (26 December 1993)', 'https://www.bannedthought.net/International/RIM/AWTW/1995-20/ll_mlm_20_eng.htm'],
    mao_kaunda: ['Mao to Kaunda on the three worlds, 22 February 1974 (Chinese record)', 'https://www.marxists.org/chinese/maozedong/mia-chinese-mao-19740222.htm'],
    baran_sweezy: ['Baran & Sweezy, Monopoly Capital (Monthly Review Press, 1966)', 'https://en.wikipedia.org/wiki/Monopoly_Capital'],
    magdoff_sweezy: ['Magdoff & Sweezy, Stagnation and the Financial Explosion (1987)', 'https://monthlyreview.org/books/pb7158'],
    foster2006: ['Foster, "Monopoly-Finance Capital", Monthly Review 58(7), 2006', 'https://monthlyreview.org/9980058072006/'],
    foster_mcchesney: ['Foster & McChesney, The Endless Crisis (2012)', 'https://monthlyreview.org/books/cl3133'],
    emmanuel: ['Emmanuel, Unequal Exchange (1969; English 1972)', 'https://unesdoc.unesco.org/ark:/48223/pf0000040022'],
    amin: ['Amin, Accumulation on a World Scale (1970; English 1974)', 'https://monthlyreview.org/product/accumulation_on_a_world_scale'],
    prebisch: ['Prebisch, The Economic Development of Latin America and its Principal Problems (ECLA, 1950)', 'https://purochioe.rrojasdatabank.info/prebisch_theec-development.pdf'],
    nkrumah: ['Nkrumah, Neo-Colonialism, the Last Stage of Imperialism (1965)', 'https://www.marxists.org/subject/africa/nkrumah/neo-colonialism/index.htm'],
    hudson: ['Hudson, Super Imperialism (1972)', 'https://ci.nii.ac.jp/ncid/BA03811080'],
    arrighi: ['Arrighi, The Long Twentieth Century (1994)', 'https://search.ub.tum.de/vufind/Record/DE-604.BV010068930?lng=en'],
    gowan: ['Gowan, The Global Gamble (1999)', 'https://shp2.amsab.be/Record/819AC8B7-D708-4286-BF18-FC13E18DEC9F/Details'],
    harvey2003: ['Harvey, The New Imperialism (2003)', 'https://www.oup.com.au/books/others/9780199278084-the-new-imperialism'],
    harvey2005: ['Harvey, A Brief History of Neoliberalism (2005)', 'https://academic.oup.com/book/40603'],
    smith2016: ['Smith, Imperialism in the Twenty-First Century (2016), review', 'https://monthlyreview.org/?p=26896'],
    patnaik2016: ['U. Patnaik & P. Patnaik, A Theory of Imperialism (2016)', 'https://ingramacademic.com/products/a-theory-of-imperialism-9780231179799'],
    patnaik_drain: ['Hickel on U. Patnaik’s drain estimate (Al Jazeera, 2018)', 'https://www.aljazeera.com/opinions/2018/12/19/how-britain-stole-45-trillion-from-india'],
    roy_drain: ['T. Roy, critique of the drain estimate (History Reclaimed, 2022)', 'https://historyreclaimed.co.uk/did-the-british-loot-india/'],
    hickel2022: ['Hickel, Dorninger, Wieland & Suwandi, Global Environmental Change 73 (2022) 102467', 'https://researchonline.lse.ac.uk/id/eprint/113823/1/1_s2.0_S095937802200005X_main_1_.pdf'],
    hickel2024: ['Hickel, Hanbury Lemos & Barbour, Nature Communications 15, 6298 (2024)', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11286830/'],
    glyn_sutcliffe: ['Glyn & Sutcliffe, British Capitalism, Workers and the Profits Squeeze (1972)', 'https://vufind.lboro.ac.uk/Record/44730'],
    agh: ['Armstrong, Glyn & Harrison, Capitalism Since 1945 (1991)', 'https://opac.amsab.be/Record/300085241'],
    lewis1954: ['Lewis, "Economic Development with Unlimited Supplies of Labour" (1954)', 'https://api.crossref.org/works/10.1111/j.1467-9957.1954.tb00021.x'],
    bairoch: ['Bairoch (1982) shares of world manufacturing, reproduced by Clingingsmith & Williamson', 'https://www.lse.ac.uk/Economic-History/Assets/Documents/Research/GEHN/GEHNConferences/conf7/Conf7-Williamson.pdf'],
    maddison: ['Maddison, The World Economy: A Millennial Perspective (OECD, 2001), Table 3-1b', 'https://docenti-deps.unisi.it/sergiocesaratto/wp-content/uploads/sites/26/2020/09/Maddison.pdf'],
    bw_fed: ['Ghizoni, "Creation of the Bretton Woods System", Federal Reserve History', 'https://www.federalreservehistory.org/-/media/Project/FedHistory/FedHistory/Documents/essaysPDFs/Creation-of-the-Bretton-Woods-System-_-Federal-Reserve-History.pdf'],
    bw_wb: ['World Bank Archives, Bretton Woods and the Birth of the World Bank', 'https://www.worldbank.org/en/archive/history/exhibits/Bretton-Woods-and-the-Birth-of-the-World-Bank'],
    nixon_fed: ['Ghizoni, "Nixon Ends Convertibility of U.S. Dollars to Gold", Federal Reserve History', 'https://www.federalreservehistory.org/essays/gold-convertibility-ends'],
    nixon_state: ['US Office of the Historian, Nixon and the End of the Bretton Woods System', 'https://history.state.gov/milestones/1969-1976/nixon-shock'],
    bordo: ['Bordo, The operation and demise of the Bretton Woods system (VoxEU, 2017)', 'https://cepr.org/voxeu/columns/operation-and-demise-bretton-woods-system-1958-1971'],
    gold_fred: ['US monetary gold stock, NBER macrohistory series (FRED)', 'https://fred.stlouisfed.org/graph/fredgraph.csv?id=M1476CUSM144NNBR'],
    oil_fed: ['Corbett, "Oil Shock of 1973–74", Federal Reserve History', 'https://www.federalreservehistory.org/essays/oil-shock-of-1973-74'],
    petro_bloomberg: ['Wong (Bloomberg, 2016) on the 1974 Saudi Treasury arrangement (syndicated copy)', 'https://www.malaymail.com/news/money/2016/05/31/the-untold-story-behind-saudi-arabias-41-year-us-debt-secret/1130991'],
    petro_politifact: ['PolitiFact (2024): no 50-year petrodollar treaty', 'https://politifact.com/factchecks/2024/jun/20/facebook-posts/the-us-dollar-will-continue-to-be-used-for-oil-sal/'],
    volcker: ['Sablik, "Recession of 1981–82", Federal Reserve History', 'https://www.federalreservehistory.org/essays/recession-of-1981-82'],
    fedfunds: ['Effective federal funds rate, monthly (FRED)', 'https://fred.stlouisfed.org/graph/fredgraph.csv?id=FEDFUNDS'],
    latam: ['Sims & Romero, "Latin American Debt Crisis of the 1980s", Federal Reserve History', 'https://www.federalreservehistory.org/essays/latin-american-debt-crisis'],
    fdic: ['FDIC, History of the Eighties, ch. 5 (1997)', 'https://www.fdic.gov/resources/publications/history-eighties/volume-1/history-80s-volume-1-part2-05.pdf'],
    cofer: ['IMF COFER data brief, 30 September 2026', 'https://data.imf.org/en/news/imf%20data%20brief%20september%2030'],
    bis2025: ['BIS Triennial Survey: OTC foreign exchange turnover in April 2025', 'https://www.bis.org/statistics/rpfx25_fx.htm'],
    russia_assets: ['Council of the EU on immobilised Russian assets (2024)', 'https://www.eeas.europa.eu/delegations/ukraine/immobilised-russian-assets-council-decides-set-aside-extraordinary-revenues_en'],
    setser: ['Setser, How to use Russia’s frozen assets (CFR, 2025)', 'https://cfr.org/articles/how-use-russias-frozen-assets'],
    union_bls: ['BLS, Union Members 2025 (18 February 2026)', 'https://www.bls.gov/news.release/archives/union2_02182026.htm'],
    union_crs: ['Mayer, Union Membership Trends in the United States (CRS RL32553, 2004)', 'https://www.everycrsreport.com/reports/RL32553.html'],
    labshare: ['BLS, labour share at its lowest level, 52.8% in 2026 Q2', 'https://www.bls.gov/opub/ted/2026/labor-share-at-its-lowest-level-52-8-percent-in-second-quarter-2026.htm'],
    epi: ['EPI, The Productivity–Pay Gap (updated 14 September 2026)', 'https://epi.org/productivity-pay-gap/'],
    saez: ['Saez, top income shares data (Piketty–Saez, June 2026 file)', 'https://eml.berkeley.edu/~saez/TabFig2024.xlsx'],
    krippner: ['Krippner, "The financialization of the American economy", Socio-Economic Review 3(2), 2005', 'https://economicsociology.org/wp-content/uploads/2015/01/the-financialization-of-the-american-economy.pdf'],
    bea: ['BEA national accounts data file (Tables 1.14, 6.16D)', 'https://apps.bea.gov/national/Release/TXT/NipaDataA.txt'],
    deloecker: ['De Loecker, Eeckhout & Unger, Quarterly Journal of Economics 135(2), 2020', 'https://crei.cat/wp-content/uploads/2020/10/the-rise-1.pdf'],
    basu: ['Basu, "Are Price-Cost Markups Rising in the United States?" (NBER w26057, 2019)', 'https://www.nber.org/papers/w26057'],
    lehman: ['Lehman Brothers Chapter 11 filing, SEC (15 September 2008)', 'https://www.sec.gov/Archives/edgar/data/0000806085/000110465908059632/a08-22764_48k.htm'],
    glick: ['Glick & Lansing, US household deleveraging (FRBSF Economic Letter, 2009)', 'https://www.frbsf.org/research-and-insights/publications/economic-letter/2009/05/us-household-deleveraging-consumption-growth'],
    fed2008: ['Federal Reserve press release, 16 December 2008', 'https://www.federalreserve.gov/newsevents/pressreleases/monetary20081216b.htm'],
    fed2023: ['Federal Reserve press release, 26 July 2023', 'https://www.federalreserve.gov/newsevents/pressreleases/monetary20230726a.htm'],
    fed2026: ['Federal Reserve press release, 16 September 2026', 'https://www.federalreserve.gov/newsevents/pressreleases/monetary20260916a.htm'],
    wto_china: ['USTR, China’s accession to the WTO (2001)', 'https://www.ustr.gov/archive/Document_Library/Fact_Sheets/2001/Background_Information_on_China\'s_Accession_to_the_World_Trade_Organization.html'],
    unsd_mva: ['UN Statistics Division, manufacturing value added, constant 2020 US$', 'https://unstats.un.org/unsd/amaapi/api/file/6'],
    freeman: ['Freeman, "The Great Doubling" (2006 draft)', 'https://eml.berkeley.edu/~webfac/eichengreen/e183_sp07/great_doub.pdf'],
    fairwear: ['Daily Star, "Workers get $0.54 for a $18.25 polo shirt" (11 April 2019)', 'https://www.thedailystar.net/business/news/workers-get-054-1825-polo-shirt-1728829'],
    bd_wage: ['TBS, garment minimum wage set at Tk 12,500 (2023)', 'https://www.tbsnews.net/economy/rmg/rmg-workers-minimum-wage-set-tk12500-746694'],
    adh2016: ['Acemoglu, Autor, Dorn, Hanson & Price, Journal of Labor Economics 34(S1), 2016', 'https://www.nber.org/papers/w20395'],
    adhm2020: ['Autor, Dorn, Hanson & Majlesi, American Economic Review 110(10), 2020', 'https://www.aeaweb.org/doi/10.1257/aer.20170011'],
    mutz: ['Mutz, PNAS 115(19), 2018', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5948965'],
    morgan: ['Morgan, Socius 4, 2018 (reanalysis of Mutz)', 'https://journals.sagepub.com/doi/full/10.1177/2378023118788217'],
    norris: ['Norris & Inglehart, Cultural Backlash (2019)', 'https://www.hks.harvard.edu/publications/cultural-backlash-trump-brexit-and-authoritarian-populism'],
    scotus2026: ['Supreme Court opinion on IEEPA tariffs (20 February 2026)', 'https://www.supremecourt.gov/opinions/25pdf/607us2r12_8nj9.pdf'],
    eo14257: ['Executive Order 14257, Federal Register (April 2025)', 'https://www.govinfo.gov/content/pkg/FR-2025-04-14/html/2025-06378.htm'],
    yale: ['Yale Budget Lab, The State of U.S. Tariffs (updated 24 August 2026)', 'https://budgetlab.yale.edu/research/state-us-tariffs'],
    miran: ['Miran, A User’s Guide to Restructuring the Global Trading System (2024)', 'https://www.hudsonbaycapital.com/documents/a-users-guide-to-restructuring-the-global-trading-system'],
    ww1_brit: ['Britannica, How many people died during World War I?', 'https://britannica.com/question/How-many-people-died-during-World-War-I'],
    ww1_prost: ['Prost, "The Dead" (Cambridge History of the First World War), via HNN', 'https://historynewsnetwork.org/article/154472'],
    ww1_ined: ['INED, Farewell life, farewell love (2018)', 'https://ined.fr/en/everything_about_population/demographic-facts-sheets/focus-on/farewell-life-farewell-love'],
    ww2_brit: ['Britannica, Casualties of World War II', 'https://www.britannica.com/print/article/2231003'],
    ww2_wiki: ['Wikipedia, World War II casualties (with its sources)', 'https://en.wikipedia.org/wiki/World_War_II_casualties'],
    ushmm: ['USHMM, Documenting numbers of victims of the Holocaust', 'https://encyclopedia.ushmm.org/content/en/article/documenting-numbers-of-victims-of-the-holocaust-and-nazi-persecution'],
    davis: ['Davis, Late Victorian Holocausts (Verso, 2001)', 'https://www.versobooks.com/products/1719-late-victorian-holocausts'],
    ograda: ['Ó Gráda, "Making Famine History", Journal of Economic Literature 45 (2007)', 'https://researchrepository.ucd.ie/rest/bitstreams/1368/retrieve'],
    ograda2019: ['Ó Gráda, Famines in WWII (VoxEU, 2019)', 'https://cepr.org/voxeu/columns/famines-wwii'],
    bengal_fic: ['Famine Inquiry Commission report on Bengal (1945)', 'https://indiaofthepast.org/sites/indiaofthepast.org/files/pdf/1940s/bengalfamine/ficreportpart2.pdf'],
    sullivan_hickel: ['Sullivan & Hickel, "Capitalism and extreme poverty", World Development 161 (2023)', 'https://ddd.uab.cat/pub/artpub/2023/319e76b138b3/Capitalism_and_extreme_poverty.pdf'],
    roy2023: ['T. Roy, critique of Sullivan & Hickel (History Reclaimed, 2023)', 'https://historyreclaimed.co.uk/colonialism-did-not-cause-the-indian-famines/'],
    robinson: ['Robinson, The Killing Season (Princeton, 2018)', 'https://www.labyrinthbooks.com/the-killing-season-9780691161389'],
    cribb: ['Cribb, "Unresolved problems in the Indonesian killings of 1965–1966", Asian Survey 42(4), 2002', 'https://researchportalplus.anu.edu.au/en/publications/unresolved-problems-in-the-indonesian-killings-of-1965-1966/'],
    korea_brit: ['Britannica, Korean War summary', 'https://www.britannica.com/summary/Korean-War'],
    prio: ['PRIO Battle Deaths Dataset', 'https://prio.org/data/1'],
    hirschman: ['Hirschman, Preston & Vu Manh Loi, Population and Development Review 21(4), 1995', 'https://doi.org/10.2307/2137774'],
    obermeyer: ['Obermeyer, Murray & Gakidou, BMJ 336:1482 (2008)', 'https://doi.org/10.1136/bmj.a137'],
    costs_of_war: ['Savell, "How Death Outlives War", Costs of War, Brown University (2023)', 'https://costsofwar.watson.brown.edu/papers/how-death-outlives-war'],
    ilo2023: ['ILO, nearly 3 million people die of work-related accidents and diseases (2023)', 'https://www.ilo.org/resource/news/nearly-3-million-people-die-work-related-accidents-and-diseases'],
    rana_ilo: ['ILO statement on Rana Plaza (2024)', 'https://www.ilo.org/resource/statement/employment-injury-insurance-bangladesh-bridging-social-security-cases'],
    case_deaton: ['Case & Deaton, Deaths of Despair (2020), interview', 'https://lareviewofbooks.org/blog/interviews/congress-worse-look-way-talking-anne-case-angus-deaton'],
    men2003: ['Men, Brennan, Boffetta & Zaridze, BMJ 327:964 (2003)', 'https://www.bmj.com/content/327/7421/964'],
    brainerd: ['Brainerd & Cutler, Journal of Economic Perspectives 19(1), 2005', 'https://web.williams.edu/Economics/brainerd/papers/jep05.pdf'],
    stuckler: ['Stuckler, King & McKee, Lancet 373 (2009)', 'https://researchonline.lshtm.ac.uk/id/eprint/5991'],
    earle: ['Earle & Gehlbach, Comparative Economic Studies 53(2), 2011', 'https://doi.org/10.1057/ces.2011.8'],
    sanctions2025: ['Rodríguez, Rendón & Weisbrot, Lancet Global Health 13(8), 2025 (CEPR summary)', 'https://cepr.net/publications/effects-of-international-sanctions-on-age-specific-mortality/'],
    dyson: ['Dyson & Cetorelli, BMJ Global Health 2(2), 2017', 'https://gh.bmj.com/content/2/2/e000311.abstract'],
    wpf: ['World Peace Foundation, historic famines table', 'https://worldpeacefoundation.org/wp-content/uploads/2025/01/Historic-Famines-synthesis-table-191224.pdf'],
    // classic works cited from memory, not checked in this session
    kalecki1943: ['Kalecki, "Political Aspects of Full Employment", The Political Quarterly (1943)', null],
    fisher1933: ['Fisher, "The Debt-Deflation Theory of Great Depressions", Econometrica (1933)', null],
    minsky1986: ['Minsky, Stabilizing an Unstable Economy (1986)', null],
    triffin1960: ['Triffin, Gold and the Dollar Crisis (1960)', null],
    goodwin1967: ['Goodwin, "A Growth Cycle" (1967)', null],
    steindl1952: ['Steindl, Maturity and Stagnation in American Capitalism (1952)', null],
    cynamon: ['Cynamon & Fazzari, "Inequality, the Great Recession and slow recovery", Cambridge Journal of Economics (2016)', null],
    allen: ['Allen, "The Great Divergence in European Wages and Prices" (2001); "Absolute Poverty: When Necessity Displaces Desire" (2017)', null],
    edward2006: ['Edward, "The Ethical Poverty Line", Third World Quarterly (2006)', null]
  };
  function refList(keys, parent) {
    const ul = el('ul', 'refs', null, parent);
    keys.forEach((k) => {
      const r = REF[k]; if (!r) return;
      const li = el('li', null, null, ul);
      if (r[1]) { const a = el('a', null, r[0], li); a.href = r[1]; a.target = '_blank'; a.rel = 'noopener'; }
      else { el('span', null, r[0], li); el('span', 'flag', ' (cited from memory, not checked in this session)', li); }
    });
    return ul;
  }

  /* ---------------- phases ---------------- */
  const PHASES = {
    laissez: {
      mech: 'Many competing firms, a large reserve army and weak unions keep wages near subsistence. Accumulation raises productive capacity faster than workers can buy its output, so slumps recur: capital is written off and weaker firms go bankrupt. The colonies pay tribute and absorb manufactures.',
      hist: 'Industrial capitalism led by Britain in the first two thirds of the nineteenth century.',
      refs: ['capital_v1_25', 'capital_v3_30']
    },
    transition: {
      mech: 'Crises centralise capital: the strong absorb the weak, and joint-stock credit speeds the process, so the monopoly index climbs. Banks become central to industrial finance, and capital begins to flow abroad where profits are higher.',
      hist: 'Cartels and trusts spread in the last third of the nineteenth century. Hilferding analysed the fusion of bank and industrial capital in 1910.',
      refs: ['hilferding', 'lenin_ch7']
    },
    imperialism: {
      mech: "All five of Lenin's features are present. Superprofits from the colonies flow to the core and part of them reaches an upper layer of workers, which lowers militancy. A power that grows faster than its colonial holdings can gain only by redivision, so rivalry builds toward war.",
      hist: 'Lenin wrote Imperialism, the Highest Stage of Capitalism in Zurich between January and June 1916.',
      refs: ['lenin_ch7', 'lenin_split', 'bukharin', 'luxemburg']
    },
    war1: {
      mech: 'Military spending absorbs a large share of output, capital in the war zone is destroyed and the semi-periphery is disrupted. Deaths scale with the destructive power of industry. At the end, the loser’s colonies pass to the winners.',
      hist: 'First World War, 1914–18: about 8.5–10 million soldiers died; civilian deaths are uncertain, perhaps up to 13 million.',
      refs: ['ww1_brit', 'ww1_prost', 'ww1_ined']
    },
    war2: {
      mech: 'A war launched by the fascist powers is fought as a war of extermination. The model counts mass murder of civilians under repression. Defeat removes fascism and leaves the rising power dominant.',
      hist: 'Second World War, 1939–45: 40–50 million dead (Britannica) and 60–75 million when deaths from famine and disease are included. About six million Jews were murdered in the Holocaust (USHMM).',
      refs: ['ww2_brit', 'ww2_wiki', 'ushmm']
    },
    interwar: {
      mech: 'The loser’s colonies pass to the winners and the gold standard is restored. A credit boom grows on war debts and international lending; the challenger has lost its colonies.',
      hist: 'The 1920s: the return to gold and a speculative boom that ended in the 1929 crash.',
      refs: ['capital_v3_30']
    },
    depression: {
      mech: 'With money tied to gold there is no lender of last resort. Banks fail, investment collapses for years, wages are cut, world trade shrinks and governments balance their budgets, which deepens the slump.',
      hist: 'The depression of 1929–33.',
      refs: ['capital_v3_30', 'fisher1933']
    },
    fascism: {
      mech: 'Where finance capital faces a depression and a revolutionary threat, the challenger’s ruling bloc abolishes legal union space, rearms and prepares expansion. Fascist powers build tension until war breaks out.',
      hist: 'Fascists took power in Italy in 1922 and in Germany in 1933. Dimitrov (1935) defined fascism in power as the "open terrorist dictatorship" of the most reactionary sections of finance capital.',
      refs: ['dimitrov']
    },
    compromise: {
      mech: 'Currencies are pegged to the dollar and the dollar to gold. Capital controls, high taxes on profits, legal unions and the pressure of a socialist bloc make wages rise with productivity. Colonies become independent states, but drain continues through trade, profits and debt.',
      hist: 'The post-war boom, about 1945–1973.',
      refs: ['agh', 'bw_fed', 'nkrumah']
    },
    stagflation: {
      mech: 'Full employment and strong unions push wages up faster than productivity, the profit rate falls, firms raise prices and inflation accelerates. Dollar claims abroad have outgrown the gold cover.',
      hist: 'The 1970s: the dollar left gold in 1971 and oil prices nearly quadrupled in 1973–74.',
      refs: ['glyn_sutcliffe', 'nixon_fed', 'oil_fed']
    },
    neoliberal: {
      mech: 'Capital won the 1970s decision. An interest-rate shock breaks inflation and unions, finance is deregulated and capital controls are lifted. The periphery is pushed into debt crises and structural adjustment.',
      hist: 'The Federal Reserve let its funds rate approach 20% in 1980–81; Mexico could not pay its debts in August 1982.',
      refs: ['volcker', 'harvey2005', 'latam']
    },
    globalisation: {
      mech: 'Production moves to low-wage zones (global labour arbitrage) and the core’s wage share falls. Household credit fills the gap between stagnant wages and consumption, finance takes a larger share of profits, and the dollar is the world’s reserve and trading currency.',
      hist: 'From the 1990s. The dollar was on one side of 89.2% of foreign-exchange trades in April 2025 (BIS); its share of allocated reserves fell from about 71% in 1999 to 56.7% in 2026 Q2 (IMF COFER).',
      refs: ['smith2016', 'krippner', 'bis2025', 'cofer']
    },
    neocrisis: {
      mech: 'Household debt service becomes unpayable and the bubble bursts. Under fiat money the state rescues the banks, public debt rises and interest rates go to zero, so the crash is shorter than in 1929, but debt and weak demand slow the recovery.',
      hist: 'Lehman Brothers failed on 15 September 2008; the Federal Reserve cut its rate to 0–¼% on 16 December 2008.',
      refs: ['lehman', 'fed2008', 'glick', 'magdoff_sweezy']
    },
    nationalist: {
      mech: 'Deindustrialisation, falling legitimacy and a rising rival meet a weak organised left, so discontent turns nationalist. Tariffs rise, sanctions spread, and the hegemon tries to reverse the arbitrage its own capital created.',
      hist: 'The 2016 Brexit referendum and US presidential election; US tariffs from April 2025, partly struck down by the Supreme Court in February 2026.',
      refs: ['adhm2020', 'mutz', 'morgan', 'norris', 'yale']
    },
    radical: {
      mech: 'Labour was at least as strong as capital when the 1970s crisis came to a head. Capital controls stay, profits are taxed, finance stays regulated. Inside capitalism, investment still depends on profit, so a squeezed profit rate means slower accumulation.',
      hist: 'Counterfactual. Attempts in this direction, such as France in 1981–83, were reversed.',
      refs: ['kalecki1943']
    }
  };
  function phaseKey(rec) {
    if (rec.warN > 0) return rec.warFasc ? 'war2' : 'war1';
    switch (rec.regime) {
      case 'laissez': return rec.phase === 'Transition to monopoly' ? 'transition' : 'laissez';
      case 'imperial': return rec.phase.indexOf('Imperialism') === 0 ? 'imperialism' : 'transition';
      case 'interwar': return 'interwar';
      case 'crisis': return rec.fascist > 0 ? 'fascism' : 'depression';
      case 'compromise': return 'compromise';
      case 'stagflation': return 'stagflation';
      case 'neoliberal': return rec.OFF > 0.12 ? 'globalisation' : 'neoliberal';
      case 'neocrisis': return 'neocrisis';
      case 'nationalist': return 'nationalist';
      case 'radical': return 'radical';
      default: return 'laissez';
    }
  }
  const MONEY = { gold: 'Gold standard', war: 'War finance', interwar: 'Restored gold-exchange standard', breakdown: 'Gold standard abandoned', bw: 'Dollar–gold standard', dollar: 'Fiat dollar standard' };

  /* ---------------- events ---------------- */
  // each returns { title, short, mech, hist, refs, pause }
  const EV = {
    slump: (e) => ({ title: 'Overproduction slump', short: 'Capacity outruns spending; capital is written off.', pause: !!e.major,
      mech: `Spending fell short of what normal-capacity output requires; utilisation dropped to ${pct(e.u, 1)}. Investment is cut, the weakest firms fail and 4% of the capital stock is written off, which later lets profitability recover.`,
      hist: 'Marx located the ultimate cause of such crises in the gap between the drive to expand production and the restricted consumption of the masses.', refs: ['capital_v3_30'] }),
    crash: (e) => e.gold
      ? { title: e.big ? 'Crash under the gold standard' : 'Financial panic', short: e.big ? 'Bank failures turn a crash into a depression.' : 'A panic passes without a long depression.', pause: !!e.major,
        mech: e.big ? 'Speculative claims had run ahead of profits and credit tightened. With money tied to gold there is no lender of last resort: bank failures turn the crash into a depression of several years, and 12% of capital is written off.' : 'Credit tightened and speculative values fell, but finance was not yet large enough for a long depression.',
        hist: 'Compare the panics of 1873 and 1893.', refs: ['hilferding', 'capital_v3_30'] }
      : { title: e.big ? 'Debt crash and bailout' : 'Speculative bubble deflates', short: e.big ? 'Debt service becomes unpayable; the state rescues the banks.' : 'Asset prices fall; credit tightens for three years.', pause: !!e.major,
        mech: e.big ? `Household debt service reached ${pct(e.dsr)} of wages. Under fiat money the state rescues the banks (public debt rises by a quarter of output) and cuts interest rates to near zero.` : 'Rising rates pricked an asset bubble. Investment and household credit dip for three years. The model generates minor crashes endogenously; their dates are not calibrated.',
        hist: e.big ? 'Compare 2007–09.' : 'Model-generated event.', refs: e.big ? ['minsky1986', 'magdoff_sweezy'] : [] },
    openingB: () => ({ title: 'The agrarian empire is forced open', short: 'Zone B becomes a semi-colony.', pause: true,
      mech: 'The powers’ spheres already covered most of the colonial world and core output had grown past the threshold for a war of opening. Zone B becomes a semi-colony: low tariffs, foreign enclaves, an opium and silver drain.',
      hist: 'First Opium War (1839–42) and the Treaty of Nanking (1842).', refs: ['mao_ccp'] }),
    rebellionB: () => ({ title: 'Great peasant rebellion', short: 'Civil war in the semi-colony.', pause: true,
      mech: 'Immiseration in the semi-colony passed the rebellion threshold while peasant organisation was still weak. Fourteen years of civil war follow; the rebellion is crushed and the zone is opened further.',
      hist: 'Taiping Rebellion, 1850–64: Davis (2001) gives an estimated 20–30 million dead; contemporary estimates ran from 20 to 40 million.', refs: ['davis'] }),
    fragmentB: () => ({ title: 'The semi-colony fragments', short: 'Warlord rule and civil strife.', pause: false,
      mech: 'With most of zone B inside foreign spheres, central authority breaks up into rival military governments; civil strife lowers output.',
      hist: 'China’s warlord era began after 1916.', refs: ['mao_ccp'] }),
    imperialPolitics: () => ({ title: 'Colonial scramble', short: 'The core turns to colonial politics.', pause: false,
      mech: 'Monopoly is rising and three quarters of the dominated world is inside spheres. The core turns to colonial politics: more military spending, and more legal room for unions to buy social peace.',
      hist: 'Berlin Conference on Africa, 1884–85.', refs: ['lenin_ch7'] }),
    feat_monopoly: (e) => ({ title: "Lenin's feature 1: monopoly", short: `Monopoly index ${pct(e.M, 0)}.`, pause: false,
      mech: `The monopoly index reached ${pct(e.M, 0)} (threshold 35%). Crises and the joint-stock company centralised capital in fewer firms.`, hist: '', refs: ['lenin_ch7'] }),
    feat_finance: (e) => ({ title: "Lenin's feature 2: finance capital", short: `Finance-capital index ${pct(e.F, 0)}.`, pause: false,
      mech: `The finance-capital index reached ${pct(e.F, 0)} (threshold 40%): bank and industrial capital are fused through credit and share ownership.`, hist: 'Hilferding, Das Finanzkapital (1910).', refs: ['hilferding', 'lenin_ch7'] }),
    feat_export: (e) => ({ title: "Lenin's feature 3: export of capital", short: `${pct(e.x, 0)} of core capital is abroad.`, pause: false,
      mech: `Capital invested abroad reached ${pct(e.x, 0)} of the core’s capital (threshold 13%). Profit rates at home had fallen below those expected abroad, so surplus capital went to the periphery.`, hist: '', refs: ['lenin_ch7'] }),
    feat_cartels: () => ({ title: "Lenin's feature 4: international cartels", short: 'Monopolies share world markets.', pause: false,
      mech: 'Monopoly combined with capital export crossed the cartel threshold: international combines divide markets among themselves.', hist: '', refs: ['lenin_ch7'] }),
    feat_division: (e) => ({ title: "Lenin's feature 5: the world is divided", short: `${pct(e.Div, 0)} of the dominated world is inside spheres.`, pause: false,
      mech: `${pct(e.Div, 0)} of the dominated world’s population lives inside the powers’ spheres (threshold 88%). From now on a power can gain territory only by taking it from another.`, hist: '', refs: ['lenin_ch7'] }),
    imperialism: () => ({ title: 'Imperialism: all five features present', short: 'Monopoly capitalism becomes imperialism.', pause: true,
      mech: 'Monopoly, finance capital, capital export, international cartels and a completed territorial division are all present. Superprofits flow to the core and part of them reaches upper layers of workers. Uneven growth among the powers now meets a world with nothing left to divide.',
      hist: 'Lenin wrote Imperialism, the Highest Stage of Capitalism in Zurich between January and June 1916; it was first published in 1917.', refs: ['lenin_ch7', 'lenin_split', 'hilferding', 'bukharin'] }),
    war: (e, rec) => ({ title: e.n === 1 ? 'First inter-imperialist war' : 'Second inter-imperialist war', short: e.fasc ? 'War launched by the fascist powers.' : 'War for the redivision of the world.', pause: true,
      mech: e.fasc
        ? 'Fascist rearmament and expansion led to war. It is fought as a war of extermination: the model counts the mass murder of civilians under repression. Capital in the war zone is destroyed on a larger scale than in the first war.'
        : `The challenger produced ${pct(rec.sChal, 0)} of core output but held ${pct(rec.dChal, 0)} of the colonies. With the world already divided, tension built until war. Military spending jumps, capital in the war zone is destroyed, and deaths scale with the destructive power of industry.`,
      hist: e.fasc ? PHASES.war2.hist : PHASES.war1.hist, refs: e.fasc ? PHASES.war2.refs : PHASES.war1.refs }),
    warEnd: (e) => ({ title: e.n === 1 ? 'First war ends' : 'War ends', short: 'Colonies are redivided among the winners.', pause: false,
      mech: 'The losers’ colonies pass to the winners and the losers’ capital is wrecked.', hist: '', refs: [] }),
    revolutionA: (e, rec) => ({ title: 'Revolution in the semi-periphery', short: 'Zone A leaves the world market.', pause: true,
      mech: `During the war, workers’ and peasants’ organisation in zone A (${pct(rec.seg.A.O, 0)}) and immiseration (${pct(rec.seg.A.Imm, 0)}) crossed the revolutionary thresholds. Foreign capital is expropriated, debts are repudiated and land is redistributed; the drain from zone A stops.`,
      hist: 'The October Revolution in Russia, 1917. Mao later wrote that "the salvoes of the October Revolution brought us Marxism-Leninism" (1949).', refs: ['mao_pdd'] }),
    baseAreas: () => ({ title: 'Rural base areas', short: 'Peasant organisation holds territory in zone B.', pause: false,
      mech: 'Organised peasants begin to hold liberated territory in the semi-colony. It grows with organisation and immiseration and shrinks under repression.',
      hist: 'From 1927 the Chinese Communists built rural base areas.', refs: ['mao_classes', 'mao_ccp'] }),
    depression: (e) => ({ title: 'Great Depression', short: 'The gold-standard order collapses.', pause: true,
      mech: e.stagnation ? 'Years of mass unemployment without recovery broke the old regime of accumulation.' : 'The interwar credit boom collapsed. Under the gold-exchange standard there is no lender of last resort: banks fail, investment collapses for years, wages are cut, trade shrinks and budgets are balanced, which deepens the slump.',
      hist: 'The crash of 1929 and the depression of 1929–33.', refs: ['capital_v3_30', 'fisher1933'] }),
    fascism: (e, rec) => ({ title: 'Fascism in power', short: 'The challenger’s ruling bloc turns to open dictatorship.', pause: true,
      mech: `After three years of depression, with nationalist mobilisation at ${pct(rec.Nat, 0)}, a revolutionary threat and finance capital dominant, the challenger’s ruling bloc abolishes legal union space, cuts wages and rearms.`,
      hist: PHASES.fascism.hist, refs: ['dimitrov'] }),
    newDeal: () => ({ title: 'Depression ends without fascism', short: 'A managed compromise replaces the crisis regime.', pause: true,
      mech: 'Ten years of crisis passed without a fascist seizure of power. The regime settles into a compromise: capital controls, higher taxes on profits, legal unions.',
      hist: 'Closest analogue: the US New Deal, which ran alongside fascism elsewhere rather than in its place.', refs: [] }),
    brettonWoods: (e) => ({ title: 'Bretton Woods: dollar–gold standard', short: 'Currencies pegged to the dollar, the dollar to gold.', pause: true,
      mech: `The war leaves the rising power with ${pct(e.H, 0)} of great-power output and most of the world’s gold. Currencies are pegged to the dollar and the dollar to gold.`,
      hist: 'The Bretton Woods conference met in July 1944 with 44 nations and fixed the dollar at $35 an ounce of gold. After the war the US held about three quarters of the world’s official gold.', refs: ['bw_fed', 'bw_wb', 'nixon_state'] }),
    compromise: () => ({ title: 'Post-war compromise', short: 'Wages rise with productivity under capital controls.', pause: true,
      mech: PHASES.compromise.mech, hist: PHASES.compromise.hist, refs: ['agh'] }),
    decolonization: () => ({ title: 'Decolonisation begins', short: 'Colonial control erodes.', pause: true,
      mech: 'The war has weakened the colonial powers and national movements in zone C are strong; colonial control erodes every year.',
      hist: 'India and Pakistan became independent in 1947, Indonesia in 1949, Ghana in 1957, and much of Africa in 1960.', refs: ['nkrumah'] }),
    independence: () => ({ title: 'Formal independence', short: 'Zone C is independent; the drain continues.', pause: true,
      mech: 'Colonial control fell below 12%. Zone C is formally independent, but value still flows out through unequal exchange, repatriated profits and, later, debt.',
      hist: 'Nkrumah (1965) called this neo-colonialism; Emmanuel, Amin and Prebisch analysed the transfer through trade.', refs: ['nkrumah', 'emmanuel', 'amin', 'prebisch'] }),
    revolutionB: (e, rec) => ({ title: 'Revolution in the semi-colony', short: 'Zone B leaves the world market.', pause: true,
      mech: `Liberated areas covered ${pct(rec.seg.B.Lib, 0)} of zone B once the war had exhausted the old order. Land reform ends most rent, foreign capital is expropriated, and the drain from zone B stops.`,
      hist: 'The People’s Republic of China was proclaimed on 1 October 1949. Mao’s analysis of China as "colonial, semi-colonial and semi-feudal" is in The Chinese Revolution and the CCP (1939).', refs: ['mao_ccp', 'mao_newdem', 'mao_pdd', 'mao_foolish'] }),
    revolutionC: () => ({ title: 'Revolution in the periphery', short: 'Zone C leaves the world market.', pause: true,
      mech: 'Liberated territory covered more than half of zone C. The drain from zone C stops.', hist: 'Counterfactual at this scale.', refs: [] }),
    proxyWar: () => ({ title: 'Counter-insurgency wars', short: 'The hegemon fights liberation movements.', pause: true,
      mech: 'With a socialist bloc present, the hegemon fights liberation movements in zone C directly or through allies. Deaths scale with liberated territory and the intervention lever.',
      hist: 'Korean War 1950–53: about 2.6 million dead (Britannica). Vietnam: about 1 million Vietnamese deaths in 1965–75 (Hirschman et al. 1995); 3.8 million violent deaths in 1955–2002 (Obermeyer et al. 2008).', refs: ['korea_brit', 'prio', 'hirschman', 'obermeyer'] }),
    coup: (e) => ({ title: 'Coup against a developmental government', short: 'A massacre follows; developmental policy is reversed.', pause: !!e.major,
      mech: 'The hegemon backs a coup against a national-developmental government in zone C. The killings that follow are counted under repression, and developmental policy is rolled back.',
      hist: 'Indonesia 1965–66: about 500,000 killed (Robinson 2018); published estimates range from 500,000 to 1 million.', refs: ['robinson', 'cribb'] }),
    restorationA: (e, rec) => ({ title: 'Capitalist restoration in zone A', short: 'A new bourgeoisie takes over the party-state.', pause: true,
      mech: 'The revisionism index, the strength of a new bureaucratic bourgeoisie inside the party-state, reached its threshold. State ownership remains, but production is run for profit and for bloc rivalry.',
      hist: 'This is the MLM thesis: the Revolutionary Internationalist Movement (1984) holds that revisionists led by Khrushchev seized power in 1956 and restored capitalism. Other Marxist and non-Marxist accounts date or define the change differently.', refs: ['rim1984'] }),
    restorationB: () => ({ title: 'Capitalist restoration in zone B', short: 'Market reform begins.', pause: true,
      mech: 'The revisionism index reached its threshold in zone B. Market reform starts and the zone gradually opens to foreign capital.',
      hist: 'RIM (1993) dates this to the "1976 counter-revolutionary coup" led by Hua Guofeng and Deng Xiaoping.', refs: ['rim1993'] }),
    collapseA: () => ({ title: 'Collapse of the restored bloc', short: 'Zone A opens; a mortality crisis follows.', pause: true,
      mech: 'Stagnation, the arms race and debt pushed legitimacy below the threshold. Zone A opens to the world market; capital flight and asset stripping follow, with a mortality crisis lasting about a decade.',
      hist: 'The USSR dissolved in December 1991. About 2.5–3 million more Russian adults died in 1992–2001 than 1991 death rates imply (Men et al. 2003); the role of mass privatisation is disputed.', refs: ['men2003', 'brainerd', 'stuckler', 'earle'] }),
    rivalJoins: () => ({ title: 'The reform zone becomes a rival', short: 'Zone B is a manufacturing power.', pause: true,
      mech: 'Market reform and foreign investment have made zone B a manufacturing centre with its own reserves and, later, capital exports.',
      hist: 'China joined the WTO on 11 December 2001. Its share of world manufacturing value added was 30.7% in 2024 at constant 2020 prices (28.5% at current prices).', refs: ['wto_china', 'unsd_mva', 'lewis1954'] }),
    nixonShock: (e) => ({ title: 'The dollar leaves gold', short: 'Dollar claims outgrew the gold stock.', pause: true,
      mech: `Dollar claims held abroad reached ${e.Ov.toFixed(1)} times the gold stock. A reserve currency must be supplied through deficits that undermine its own gold cover, so the link is cut and the dollar floats.`,
      hist: 'Nixon closed the gold window on 15 August 1971. The US gold stock fell from $24.6 billion (1949) to $11.1 billion (1970).', refs: ['nixon_fed', 'bordo', 'gold_fred', 'triffin1960'] }),
    oilShock: () => ({ title: 'Oil shock', short: 'Oil rent cuts profits and feeds inflation.', pause: true,
      mech: 'After the dollar floats, oil exporters raise prices. The oil rent cuts core profits and adds to inflation; petrodollars are lent on to the periphery.',
      hist: 'Oil nearly quadrupled in 1973–74, from $2.90 to $11.65 a barrel. Saudi oil revenue was recycled into US Treasuries under a 1974 arrangement; there is no evidence of a formal agreement to price oil only in dollars.', refs: ['oil_fed', 'petro_bloomberg', 'petro_politifact'] }),
    profitSqueeze: (e, rec) => ({ title: 'Profit squeeze', short: 'Profit rate falls as inflation rises.', pause: true,
      mech: `The profit rate fell to ${pct(rec.r)}, below 86% of its post-war peak, while inflation ran above 4.5%. Full employment and strong unions had pushed wages up faster than productivity.`,
      hist: 'Glyn and Sutcliffe described the squeeze for Britain in 1972.', refs: ['glyn_sutcliffe', 'agh'] }),
    neoliberal: (e) => ({ title: 'Neoliberal turn', short: 'Capital wins the 1970s decision.', pause: true,
      mech: `When the crisis came to a head, capital’s political power (${pct(e.Pk, 0)}) outweighed labour’s (${pct(e.left, 0)}). Interest rates are raised sharply, unions are attacked, finance is deregulated and capital controls are lifted.`,
      hist: 'The Federal Reserve let its funds rate approach 20% in 1980–81 (monthly average peak 19.1% in June 1981).', refs: ['volcker', 'fedfunds', 'harvey2005'] }),
    radical: (e) => ({ title: 'Radical reform wins', short: 'Labour wins the 1970s decision (counterfactual).', pause: true,
      mech: `When the crisis came to a head, labour’s power (${pct(e.left, 0)}) matched capital’s (${pct(e.Pk, 0)}). Capital controls stay, profits are taxed and finance stays regulated. Inside capitalism, investment still depends on profit.`,
      hist: 'Counterfactual. Kalecki (1943) argued that business opposes lasting full employment for political reasons.', refs: ['kalecki1943'] }),
    debtCrisis: (e) => ({ title: 'Debt crisis in the periphery', short: 'Structural adjustment follows.', pause: true,
      mech: `Debt service took ${pct(e.dsr, 0)} of zone C’s exports as core interest rates shot up. Structural adjustment follows: subsidies are cut, markets opened and assets sold.`,
      hist: 'On 12 August 1982 Mexico said it could not meet payments on $80 billion of debt. Latin American debt had grown from about $29 billion (1970) to $327 billion (1982).', refs: ['latam', 'fdic'] }),
    arbitrage: (e, rec) => ({ title: 'Global labour arbitrage', short: 'Production moves to low-wage zones.', pause: true,
      mech: `Offshored production reached ${pct(rec.OFF, 0)} of the core’s manufacturing. Core firms capture value produced at low wages, and it appears in national accounts as value added in the core.`,
      hist: 'Freeman estimated that the entry of China, India and the former Soviet bloc doubled the global labour pool, from about 1.46 to 2.93 billion workers. A 2019 costing of a polo shirt retailing at $18.25 found $0.54 going to the workers who made it (2.96%) and a factory price of $3.85.', refs: ['smith2016', 'freeman', 'fairwear', 'hickel2024'] }),
    financialCrisis: () => ({ title: 'Financial crisis', short: 'Household debt can no longer be serviced.', pause: true,
      mech: 'Household credit had filled the gap between stagnant wages and the consumption norm. When debt service could no longer be met, the crash came; the state rescued the banks and cut rates to zero.',
      hist: 'US household debt reached about 133% of disposable income in 2007. Lehman Brothers filed for bankruptcy on 15 September 2008.', refs: ['glick', 'lehman', 'fed2008', 'cynamon'] }),
    dollarWeapon: (e, rec) => ({ title: 'Sanctions as a weapon', short: 'Control of the dollar system is used against rivals.', pause: true,
      mech: `Sanctions intensity reached ${pct(rec.Sx, 0)}. As the hegemon’s weight declines, its control of dollar payments is used against rivals and defectors.`,
      hist: 'About €260 billion of Russian central-bank assets were immobilised in 2022. One cross-country study links unilateral sanctions to about 564,000 deaths a year in 2012–21 (95% interval 368,000–761,000); it is a single observational study.', refs: ['russia_assets', 'setser', 'sanctions2025'] }),
    monofin: (e, rec) => ({ title: 'Monopoly-finance capital', short: 'Stagnant production, swollen finance.', pause: true,
      mech: `Monopoly (${pct(rec.M, 0)}) and finance (${pct(rec.F, 0)}) are both high and finance takes ${pct(rec.finShare, 0)} of profits: stagnation in production coexists with financial expansion.`,
      hist: 'Foster’s term (2006). Financial corporations’ share of US domestic corporate profits rose from 8.8% (1950) to 38.1% (2002), calculated from BEA data.', refs: ['foster2006', 'magdoff_sweezy', 'krippner', 'bea', 'deloecker'] }),
    nationalist: (e, rec) => ({ title: 'Nationalist-protectionist turn', short: 'Discontent goes to nationalism.', pause: true,
      mech: `Nationalism ${pct(e.Nat, 0)}, legitimacy ${pct(rec.Leg, 0)}, manufacturing far below its peak and a rival with substantial weight. With the organised left weak, discontent goes to nationalism: tariffs rise and sanctions spread.`,
      hist: 'Trade-exposed US counties shifted toward Republican presidential candidates, a marginally significant effect (Autor et al. 2020); Mutz (2018) stressed status threat, and Morgan (2018) disputed that reading. The US declared broad tariffs on 2 April 2025; the Supreme Court struck down the IEEPA tariffs on 20 February 2026; the Yale Budget Lab put the average statutory tariff at 11.0% in August 2026.', refs: ['adhm2020', 'mutz', 'morgan', 'norris', 'eo14257', 'scotus2026', 'yale', 'miran'] })
  };
  function evInfo(e, rec) {
    const f = EV[e.type];
    if (!f) return { title: e.type, short: '', mech: '', hist: '', refs: [], pause: false };
    return f(e, rec || recAt(e.t));
  }

  /* ---------------- levers & presets ---------------- */
  const LEVERS = [
    { id: 'labour', name: 'Labour movement', desc: 'How fast core workers organise and how much organisation counts in wage bargaining.' },
    { id: 'periOrg', name: 'Organisation in the periphery', desc: 'Growth of worker and peasant organisation and of liberated areas in zones A, B and C.' },
    { id: 'supervision', name: 'Mass supervision of leaders', desc: 'How strongly the masses check a new bureaucratic bourgeoisie in socialist states (slows the revisionism index).' },
    { id: 'extraction', name: 'Colonial extraction', desc: 'Tribute rates, colonial acquisitions and the opium drain.' },
    { id: 'aristocracy', name: 'Labour aristocracy', desc: 'Share of imperial superprofits passed to upper layers of core workers.' },
    { id: 'repression', name: 'Repression', desc: 'Force used against organised workers and peasants at home and in the colonies.' },
    { id: 'intervention', name: 'Imperial intervention', desc: 'Coups, counter-insurgency and sanctions by the hegemon.' },
    { id: 'antitrust', name: 'Antitrust', desc: 'State action against concentration; slows the monopoly index.' },
    { id: 'finreg', name: 'Financial regulation', desc: 'Limits on credit expansion, speculation and household lending.' },
    { id: 'mobility', name: 'Capital mobility', desc: 'Ease of exporting capital and moving production abroad.' }
  ];
  const PRESETS = [
    { name: 'Calibrated history', set: {} },
    { name: 'Strong labour movement', set: { labour: 100 } },
    { name: 'Organised periphery', set: { periOrg: 85 } },
    { name: 'Mass supervision', set: { supervision: 95 } },
    { name: 'No colonial extraction', set: { extraction: 10 } },
    { name: 'Regulated finance', set: { finreg: 85, mobility: 30 } },
    { name: 'Iron heel', set: { repression: 90, intervention: 90 } },
    { name: 'Bought-off workers', set: { aristocracy: 95, labour: 35 } },
    { name: 'Capital unbound', set: { mobility: 90, finreg: 10, antitrust: 20 } }
  ];

  /* ---------------- state ---------------- */
  let seed = 1917;
  let levers = Object.assign({}, E.DEFAULT_LEVERS);
  let model = null;
  let base = [], baseSeed = null;
  let playing = false, speed = 3, acc = 0, lastTs = 0;
  let viewT = null;
  let pauseAtTurns = store.get('pause', true);
  let showMinor = false;
  let compare = false;
  let userEvents = [];
  let tab = store.get('tab', 'forces');
  let chronSig = '';

  const H = () => model.history;
  const latest = () => { const h = H(); return h[h.length - 1]; };
  function recAt(t) { const h = H(); const i = clamp(t - h[0].t, 0, h.length - 1); return h[i]; }
  const cur = () => (viewT === null ? latest() : recAt(viewT));
  const leversDiffer = () => LEVERS.some((l) => levers[l.id] !== 50);
  const baseAt = (t) => base[t - base[0].t];

  function computeBaseline() {
    if (baseSeed === seed) return;
    const m = E.createModel({ seed });
    base = m.runTo(END).slice();
    baseSeed = seed;
  }
  function startRun(note) {
    pause();
    model = E.createModel({ seed, levers });
    model.step();
    computeBaseline();
    compare = leversDiffer();
    userEvents = note ? [{ t: latest().t, type: 'user', title: note, short: 'Run restarted from 1800.' }] : [];
    viewT = null;
    hideTurn();
    renderAll();
  }

  /* ---------------- run loop ---------------- */
  function play() {
    if (model.state.t >= END) return;
    if (viewT !== null) { viewT = null; }
    playing = true; lastTs = 0; acc = 0.999;
    $('playBtn').textContent = 'Pause';
    hideTurn();
    requestAnimationFrame(tick);
  }
  function pause() {
    playing = false;
    const b = $('playBtn'); if (b) b.textContent = model && model.state.t >= END ? 'Finished' : 'Play';
  }
  function tick(ts) {
    if (!playing) return;
    if (!lastTs) lastTs = ts;
    const dt = Math.min(0.25, (ts - lastTs) / 1000); lastTs = ts;
    acc += dt * speed;
    let n = Math.floor(acc);
    if (n > 0) {
      acc -= n;
      let stopped = false;
      while (n-- > 0 && model.state.t < END) {
        const rec = model.step();
        if (afterStep(rec, true)) { stopped = true; break; }
      }
      renderAll();
      if (stopped || model.state.t >= END) { pause(); renderAll(); return; }
    }
    requestAnimationFrame(tick);
  }
  // returns true if the run should pause for a turning point
  function afterStep(rec, interactive) {
    if (!interactive || !pauseAtTurns) return false;
    const evs = model.state.events.filter((e) => e.t === rec.t);
    const turning = evs.filter((e) => evInfo(e, rec).pause);
    if (turning.length) { showTurn(rec.t, turning[0], evs, true); return true; }
    return false;
  }
  function stepOnce() {
    if (model.state.t >= END) return;
    pause(); viewT = null;
    const rec = model.step();
    const evs = model.state.events.filter((e) => e.t === rec.t);
    const turning = evs.filter((e) => evInfo(e, rec).pause);
    renderAll();
    if (turning.length && pauseAtTurns) showTurn(rec.t, turning[0], evs, false);
  }
  function runToEnd() {
    pause(); viewT = null; hideTurn();
    model.runTo(END);
    renderAll();
  }
  function branchFrom() {
    if (viewT === null || viewT >= latest().t) return;
    const t = viewT;
    model.rewind(t);
    model.setLevers(levers);
    userEvents = userEvents.filter((u) => u.t <= t);
    userEvents.push({ t, type: 'user', title: 'Branched from ' + t, short: 'Later history discarded; current levers apply from ' + (t + 1) + '.' });
    compare = compare || leversDiffer();
    viewT = null; hideTurn();
    renderAll();
  }

  /* ---------------- turning-point card ---------------- */
  function showTurn(t, e, all, canContinue) {
    const rec = recAt(t);
    const info = evInfo(e, rec);
    const box = $('turn');
    $('turnYear').textContent = 'Model year ' + t;
    $('turnKind').textContent = 'Turning point';
    $('turnTitle').textContent = info.title;
    $('turnMech').textContent = info.mech;
    const hist = $('turnHist'); hist.textContent = '';
    if (info.hist) { el('b', null, 'Historical counterpart. ', hist); hist.appendChild(document.createTextNode(info.hist)); }
    const refs = $('turnRefs'); refs.textContent = '';
    if (info.refs && info.refs.length) refList(info.refs, refs);
    const also = $('turnAlso'); also.textContent = '';
    const others = (all || []).filter((x) => x !== e && EV[x.type]);
    if (others.length) {
      also.appendChild(document.createTextNode('Also this year: '));
      others.forEach((x, i) => {
        const b = el('button', 'linkish', evInfo(x, rec).title, also); b.type = 'button';
        b.addEventListener('click', () => showTurn(t, x, all, canContinue));
        if (i < others.length - 1) also.appendChild(document.createTextNode(' · '));
      });
    }
    $('turnGo').hidden = !canContinue || model.state.t >= END;
    $('turnClose').textContent = canContinue ? 'Stay paused' : 'Close';
    box.hidden = false;
    if (canContinue) $('turnGo').focus(); else $('turnClose').focus();
  }
  function hideTurn() { const b = $('turn'); if (b) b.hidden = true; }

  /* ---------------- header ---------------- */
  function renderHeader(rec) {
    $('yearOut').textContent = rec.t;
    $('phaseOut').textContent = rec.phase;
    const heg = rec.hegemon === 'new' ? 'rising power' : 'old power';
    $('regimeOut').textContent = (MONEY[rec.money] || rec.money) + ' · hegemon: ' + heg;
    const h = H();
    const s = $('scrub');
    s.min = h[0].t; s.max = latest().t; s.value = viewT === null ? latest().t : viewT;
    $('scrubOut').textContent = viewT === null ? 'latest ' + latest().t : 'viewing ' + viewT;
    const b = $('branchBtn');
    b.disabled = viewT === null || viewT >= latest().t;
    b.textContent = viewT !== null && viewT < latest().t ? 'Branch from ' + viewT : 'Branch from viewed year';
    $('playBtn').textContent = playing ? 'Pause' : (model.state.t >= END ? 'Finished' : 'Play');
    $('playBtn').disabled = model.state.t >= END;
    $('stepBtn').disabled = model.state.t >= END;
    $('endBtn').disabled = model.state.t >= END;
  }

  /* ---------------- phase card ---------------- */
  let lastPhaseSig = '';
  function renderPhase(rec) {
    const key = phaseKey(rec);
    const sig = key + '|' + rec.phase + '|' + rec.money + '|' + rec.hegemon + '|' + (rec.warN > 0);
    if (sig === lastPhaseSig) return;
    lastPhaseSig = sig;
    const P = PHASES[key];
    $('pcTitle').textContent = rec.phase;
    const meta = $('pcMeta'); meta.textContent = '';
    const chip = (txt, cls) => { const c = el('span', 'chip' + (cls ? ' ' + cls : ''), null, meta); el('span', 'dot', null, c); c.appendChild(document.createTextNode(txt)); };
    chip(MONEY[rec.money] || rec.money);
    chip('Hegemon: ' + (rec.hegemon === 'new' ? 'rising power' : 'old power'));
    if (rec.warN > 0) chip('At war', 'war');
    $('pcMech').textContent = P.mech;
    const h = $('pcHist'); h.textContent = '';
    el('b', null, 'Historical counterpart. ', h); h.appendChild(document.createTextNode(P.hist));
    refList(P.refs, h);
  }

  /* ---------------- map ---------------- */
  const STATUS = {
    empire: ['Agrarian empire', '--s4'], semi: ['Semi-periphery', '--s3'], semicolony: ['Semi-colony', '--s4'], colonial: ['Colonial rule', '--s4'],
    indep: ['Formally independent', '--s5'], socialist: ['Socialist', '--s2'], restored: ['Restored capitalism', '--s7'],
    reform: ['Market reform', '--s7'], rival: ['Rising rival', '--s1'], postsoviet: ['Post-Soviet capitalism', '--s3']
  };
  const ZONE_NAME = { A: 'Zone A · Russia/USSR', B: 'Zone B · China', C: 'Zone C · the colonised world' };
  const ZONE_SHORT = { A: 'Zone A', B: 'Zone B', C: 'Zone C' };
  const LAYOUT = {
    wide: { vb: [640, 444], core: [12, 12, 316, 222], A: [396, 12, 232, 126], B: [396, 168, 232, 132], C: [12, 330, 616, 108], wide: true },
    narrow: { vb: [360, 690], core: [6, 6, 348, 232], A: [6, 300, 164, 150], B: [190, 300, 164, 150], C: [6, 512, 348, 172], wide: false }
  };
  let mapLayout = null;
  function flowGeom(L, id) {
    const c = L.core, z = L[id];
    if (L.wide) {
      if (id === 'A') return { x1: z[0], y1: z[1] + 62, x2: c[0] + c[2] + 8, y2: z[1] + 62, lx: (z[0] + c[0] + c[2]) / 2, ly: z[1] + 50 };
      if (id === 'B') return { x1: z[0], y1: z[1] + 60, x2: c[0] + c[2] + 8, y2: c[1] + c[3] - 40, lx: (z[0] + c[0] + c[2]) / 2 + 4, ly: z[1] + 22 };
      return { x1: c[0] + 180, y1: z[1], x2: c[0] + 180, y2: c[1] + c[3] + 8, lx: c[0] + 196, ly: (z[1] + c[1] + c[3]) / 2 + 4 };
    }
    if (id === 'A') return { x1: z[0] + 82, y1: z[1], x2: z[0] + 82, y2: c[1] + c[3] + 8, lx: z[0] + 92, ly: (z[1] + c[1] + c[3]) / 2 + 4 };
    if (id === 'B') return { x1: z[0] + 82, y1: z[1], x2: z[0] + 82, y2: c[1] + c[3] + 8, lx: z[0] + 92, ly: (z[1] + c[1] + c[3]) / 2 + 4 };
    return { x1: 180, y1: z[1], x2: 180, y2: c[1] + c[3] + 8, lx: 190, ly: z[1] - 30 };
  }
  function drawArrow(g, f, w, color) {
    const dx = f.x2 - f.x1, dy = f.y2 - f.y1, len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len;
    const head = clamp(w * 1.7, 8, 22);
    const ex = f.x2 - ux * head, ey = f.y2 - uy * head;
    const line = svgEl('line', { x1: f.x1, y1: f.y1, x2: ex, y2: ey }, g);
    line.style.stroke = color; line.style.strokeWidth = w; line.style.strokeLinecap = 'butt';
    const px = -uy, py = ux, hw = Math.max(w * 1.25, 6);
    const poly = svgEl('polygon', { points: `${f.x2},${f.y2} ${ex + px * hw},${ey + py * hw} ${ex - px * hw},${ey - py * hw}` }, g);
    poly.style.fill = color;
  }
  function zoneBox(g, r, opt) {
    const rect = svgEl('rect', { x: r[0], y: r[1], width: r[2], height: r[3], rx: 6 }, g);
    rect.style.fill = 'var(--sheet)'; rect.style.stroke = opt.war ? 'var(--red-ink)' : 'var(--rule-2)'; rect.style.strokeWidth = opt.war ? 2 : 1;
    return rect;
  }
  function drawMap(rec) {
    const svg = $('mapSvg');
    const w = svg.parentNode.clientWidth || 640;
    const L = w < 520 ? LAYOUT.narrow : LAYOUT.wide;
    if (mapLayout !== L) { mapLayout = L; svg.setAttribute('viewBox', '0 0 ' + L.vb[0] + ' ' + L.vb[1]); }
    // clear all but title/desc
    Array.from(svg.childNodes).forEach((n) => { if (n.nodeName !== 'title' && n.nodeName !== 'desc') svg.removeChild(n); });
    const gFlows = svgEl('g', null, svg), gBoxes = svgEl('g', null, svg);
    const segs = rec.seg;
    // flows: periphery -> core, width ~ sqrt(drain)
    ['A', 'B', 'C'].forEach((id) => {
      const s = segs[id];
      const f = flowGeom(L, id);
      const closedZone = s.status === 'socialist' || s.status === 'restored';
      if (closedZone || s.drain <= 0.01) {
        svgText(gFlows, f.lx, f.ly, closedZone ? 'delinked' : '', { size: 11, fill: 'var(--ink-3)', anchor: L.wide && id !== 'C' ? 'middle' : 'start' });
        return;
      }
      const wpx = clamp(1.4 + 0.36 * Math.sqrt(s.drain), 1.5, 16);
      drawArrow(gFlows, f, wpx, 'var(--ledger)');
      const lbl = svgText(gFlows, f.lx, f.ly, 'drain ' + pct(s.drainShare), { size: 11, fill: 'var(--ledger)', weight: 600 });
      if (!L.wide || id === 'C') lbl.setAttribute('text-anchor', 'start'); else lbl.setAttribute('text-anchor', 'middle');
    });
    // core
    const c = L.core, war = rec.warN > 0;
    zoneBox(gBoxes, c, { war });
    const pad = 12, x0 = c[0] + pad;
    svgText(gBoxes, x0, c[1] + 20, 'Core', { size: 12, weight: 700, fill: 'var(--ink)', upper: true });
    svgText(gBoxes, c[0] + c[2] - pad, c[1] + 20, 'excess deaths ' + fmtLives(rec.regionDeaths.core), { size: 11, anchor: 'end', fill: 'var(--red-ink)', weight: 600 });
    if (war) svgText(gBoxes, x0 + 50, c[1] + 20, 'at war', { size: 11, fill: 'var(--red-ink)', weight: 700, upper: true });
    const powers = [['old', 'Old power', rec.sOld, rec.dOld], ['chal', 'Challenger', rec.sChal, rec.dChal], ['new', 'Rising power', rec.sNew, rec.dNew]];
    const barX = x0 + (L.wide ? 104 : 100), barW = c[2] - (barX - c[0]) - (L.wide ? 52 : 50);
    powers.forEach((p, i) => {
      const y = c[1] + 46 + i * 38;
      svgText(gBoxes, x0, y + 8, p[1], { size: 12, weight: 600, fill: 'var(--ink)' });
      let tag = '';
      if (rec.hegemon === p[0]) tag = 'hegemon';
      if (p[0] === 'chal' && rec.fascist > 0) tag = 'fascist';
      if (tag) svgText(gBoxes, x0, y + 22, tag, { size: 10, fill: tag === 'fascist' ? 'var(--red-ink)' : 'var(--ledger)', upper: true, weight: 600 });
      const b1 = svgEl('rect', { x: barX, y: y - 2, width: Math.max(1, barW * p[2]), height: 9, rx: 2 }, gBoxes); b1.style.fill = 'var(--ink-2)';
      const b2 = svgEl('rect', { x: barX, y: y + 10, width: Math.max(1, barW * clamp(p[3], 0, 1)), height: 9, rx: 2 }, gBoxes); b2.style.fill = 'var(--s4)';
      svgText(gBoxes, barX + barW + 6, y + 6, pct(p[2], 0), { size: 10, mono: true });
      svgText(gBoxes, barX + barW + 6, y + 18, pct(p[3], 0), { size: 10, mono: true });
    });
    const ly = c[1] + 46 + 3 * 38 - 4;
    const k1 = svgEl('rect', { x: barX, y: ly, width: 10, height: 8, rx: 1 }, gBoxes); k1.style.fill = 'var(--ink-2)';
    svgText(gBoxes, barX + 14, ly + 8, 'share of core output', { size: 10 });
    const k2 = svgEl('rect', { x: barX, y: ly + 13, width: 10, height: 8, rx: 1 }, gBoxes); k2.style.fill = 'var(--s4)';
    svgText(gBoxes, barX + 14, ly + 21, 'share of colonies held', { size: 10 });
    const ypc = rec.ypcCore;
    const line1 = 'Pop ' + fmtPop(rec.P) + ' · ' + fmtMoney(ypc) + ' per head';
    const line2 = 'Reserve army ' + pct(rec.U, 0) + ' · wage share ' + pct(rec.omega, 0) + ' · profit rate ' + pct(rec.r);
    svgText(gBoxes, x0, c[1] + c[3] - 28, line1, { size: 11, fill: 'var(--ink)' });
    svgText(gBoxes, x0, c[1] + c[3] - 12, line2, { size: 11 });
    // periphery zones
    ['A', 'B', 'C'].forEach((id) => {
      const s = segs[id], r = L[id];
      const atWar = war && (id === 'A' || (id === 'B' && rec.warFasc));
      zoneBox(gBoxes, r, { war: atWar });
      const xx = r[0] + 10; let yy = r[1] + 19;
      svgText(gBoxes, xx, yy, L.wide ? ZONE_NAME[id] : ZONE_SHORT[id], { size: 11, weight: 700, fill: 'var(--ink)', upper: !L.wide });
      const dz = rec.regionDeaths[id];
      if (L.wide || id === 'C') svgText(gBoxes, r[0] + r[2] - 10, yy, 'deaths ' + fmtLives(dz), { size: 11, anchor: 'end', fill: 'var(--red-ink)', weight: 600 });
      yy += 18;
      const st = STATUS[s.status] || [s.status, '--ink-3'];
      const dot = svgEl('circle', { cx: xx + 5, cy: yy - 4, r: 5 }, gBoxes); dot.style.fill = 'var(' + st[1] + ')';
      svgText(gBoxes, xx + 15, yy, st[0], { size: 11, weight: 600, fill: 'var(--ink)' });
      const lines = [];
      if (L.wide && id !== 'C') {
        lines.push('Pop ' + fmtPop(s.pop) + ' · ' + fmtMoney(s.ypc) + ' per head');
        lines.push('Consumption ' + s.c.toFixed(2) + '× subsistence');
      } else if (L.wide && id === 'C') {
        lines.push('Pop ' + fmtPop(s.pop) + ' · ' + fmtMoney(s.ypc) + ' per head · consumption ' + s.c.toFixed(2) + '× subsistence');
        if (s.drain > 0.01) lines.push('Drain by channel (% of output): tribute ' + (s.tribute / s.Y * 100).toFixed(1) + ' · repatriated profit ' + (s.repat / s.Y * 100).toFixed(1) + ' · unequal exchange ' + (s.ue / s.Y * 100).toFixed(1) + ' · debt service ' + (s.debtServ / s.Y * 100).toFixed(1));
      } else {
        if (id !== 'C') lines.push('deaths ' + fmtLives(dz));
        lines.push('Pop ' + fmtPop(s.pop));
        lines.push(fmtMoney(s.ypc) + ' per head');
        lines.push('Consumption ' + s.c.toFixed(2) + '×');
        if (id === 'C' && s.drain > 0.01) {
          lines.push('Tribute ' + (s.tribute / s.Y * 100).toFixed(1) + '% · profit ' + (s.repat / s.Y * 100).toFixed(1) + '%');
          lines.push('Unequal exch. ' + (s.ue / s.Y * 100).toFixed(1) + '% · debt ' + (s.debtServ / s.Y * 100).toFixed(1) + '%');
        }
      }
      const tags = [];
      if (s.status === 'semicolony' && s.Lib > 0.02) tags.push('liberated ' + pct(s.Lib, 0));
      if ((s.status === 'colonial' || s.status === 'indep') && s.liberated > 0.02) tags.push('liberated ' + pct(s.liberated, 0));
      if (s.status === 'socialist') tags.push('revisionism ' + pct(Math.min(1, s.Rv), 0));
      if (rec.Sx > 0.05 && ((id === 'A' && rec.t > 2013) || (id === 'B' && rec.t > 2018))) tags.push('under sanctions');
      if (s.debtY > 0.15 && id === 'C') tags.push('debt ' + pct(s.debtY, 0) + ' of output');
      lines.forEach((ln, i) => {
        const isDeath = ln.indexOf('deaths') === 0;
        svgText(gBoxes, xx, yy + 17 + i * 16, ln, { size: 11, fill: isDeath ? 'var(--red-ink)' : 'var(--ink-2)', weight: isDeath ? 600 : 400 });
      });
      if (tags.length) svgText(gBoxes, xx, r[1] + r[3] - 9, tags.join(' · '), { size: 10, fill: 'var(--ink-2)', upper: true, weight: 600 });
    });
    $('mapDesc').textContent = 'Year ' + rec.t + '. ' + ['A', 'B', 'C'].map((id) => ZONE_SHORT[id] + ': ' + (STATUS[segs[id].status] || [segs[id].status])[0] + ', drain ' + pct(segs[id].drainShare) + ' of output').join('; ') + '.';
  }

  /* ---------------- tiles ---------------- */
  const TILES = [
    { id: 'cap', label: 'Productive capacity', get: (r) => r.Ystar, fmt: (v) => fmtCap(v), unit: 'model $/yr', note: (r, h) => '×' + (r.Ystar / h[0].Ystar).toFixed(1) + ' since ' + h[0].t },
    { id: 'mass', pctUnit: true, label: 'Mass consumption ÷ capacity', get: (r) => r.massCons / r.Ystar * 100, fmt: (v) => v.toFixed(1), unit: '%', note: (r) => 'capitalists ' + (r.Ck / r.Ystar * 100).toFixed(1) + '% · investment ' + (r.I / r.Ystar * 100).toFixed(1) + '%' },
    { id: 'u', pctUnit: true, label: 'Capacity utilisation', get: (r) => r.u * 100, fmt: (v) => v.toFixed(1), unit: '%', note: (r) => 'capital stock used ' + pct(r.uK, 0) },
    { id: 'U', pctUnit: true, label: 'Reserve army', get: (r) => r.U * 100, fmt: (v) => v.toFixed(1), unit: '%', note: () => 'of the wage-labour force' },
    { id: 'omega', pctUnit: true, label: 'Wage share', get: (r) => r.omega * 100, fmt: (v) => v.toFixed(1), unit: '%', note: (r) => 'surplus value ÷ wages ' + pct(r.e, 0) },
    { id: 'r', pctUnit: true, label: 'Rate of profit', get: (r) => r.r * 100, fmt: (v) => v.toFixed(1), unit: '%', note: (r) => 'from abroad: ' + pct(r.supShare, 0) + ' of profits' },
    { id: 'drain', pctUnit: true, label: 'Drain from zone C', get: (r) => r.seg.C.drainShare * 100, fmt: (v) => v.toFixed(1), unit: '% of its output', note: (r) => 'debt ' + pct(r.seg.C.debtY, 0) + ' of zone C output' },
    { id: 'lives', label: 'Lives lost, attributable', get: (r) => E.CAT.reduce((a, k) => a + r.cum[k].attr, 0), fmt: (v) => fmtLives(v), unit: 'since 1801', loss: true, note: (r) => 'this year ' + fmtLives(r.attrDeaths) + ' · total excess ' + fmtLives(r.totDeaths) }
  ];
  const tileEls = {};
  function buildTiles() {
    const host = $('tiles'); host.textContent = '';
    TILES.forEach((T) => {
      const d = el('div', 'tile' + (T.loss ? ' loss' : ''), null, host);
      el('div', 'label', T.label, d);
      const v = el('div', 'val', null, d);
      const vn = el('span', null, '–', v);
      const vu = el('small', null, T.unit, v);
      const svg = svgEl('svg', { viewBox: '0 0 200 30', preserveAspectRatio: 'none', 'aria-hidden': 'true' }, d);
      const ghost = svgEl('path', { d: '' }, svg); ghost.style.fill = 'none'; ghost.style.stroke = 'var(--ghost)'; ghost.style.strokeWidth = 1.2; ghost.setAttribute('vector-effect', 'non-scaling-stroke');
      const path = svgEl('path', { d: '' }, svg); path.style.fill = 'none'; path.style.stroke = T.loss ? 'var(--red-ink)' : 'var(--ink-2)'; path.style.strokeWidth = 1.6; path.setAttribute('vector-effect', 'non-scaling-stroke');
      const note = el('div', 'note', '', d);
      tileEls[T.id] = { vn, vu, ghost, path, note };
    });
  }
  function renderTiles(rec) {
    const h = H();
    const upto = h.filter((r) => r.t <= rec.t);
    TILES.forEach((T) => {
      const o = tileEls[T.id];
      const v = T.get(rec);
      o.vn.textContent = T.fmt(v);
      let note = T.note(rec, h);
      if (compare && base.length) {
        const b = baseAt(rec.t);
        if (b) note = 'calibrated: ' + T.fmt(T.get(b)) + (T.pctUnit ? '%' : '') + ' · ' + note;
      }
      o.note.textContent = note;
      // sparkline over the full 1801–2026 axis
      const vals = upto.map(T.get);
      const bvals = compare ? base.filter((r) => r.t <= rec.t).map(T.get) : [];
      let lo = Infinity, hi = -Infinity;
      vals.concat(bvals).forEach((x) => { if (isFinite(x)) { if (x < lo) lo = x; if (x > hi) hi = x; } });
      if (!isFinite(lo)) { o.path.setAttribute('d', ''); o.ghost.setAttribute('d', ''); return; }
      const logScale = T.id === 'cap';
      const tf = (x) => (logScale ? Math.log(Math.max(x, 1e-6)) : x);
      const l2 = tf(lo), h2 = tf(hi) === l2 ? l2 + 1 : tf(hi);
      const X = (t) => (t - (START + 1)) / (END - START - 1) * 200;
      const Y = (x) => 28 - (tf(x) - l2) / (h2 - l2) * 26;
      const mk = (arr, recs) => arr.map((x, i) => (i ? 'L' : 'M') + X(recs[i].t).toFixed(1) + ',' + Y(x).toFixed(1)).join('');
      o.path.setAttribute('d', mk(vals, upto));
      o.ghost.setAttribute('d', compare ? mk(bvals, base.filter((r) => r.t <= rec.t)) : '');
    });
  }

  /* ---------------- Lenin's five features ---------------- */
  const FEATS = [
    { id: 'monopoly', name: 'Monopoly', desc: 'concentration of production and capital decisive in economic life', get: (r) => r.M, thr: 0.35 },
    { id: 'finance', name: 'Finance capital', desc: 'bank capital merged with industrial capital; a financial oligarchy', get: (r) => r.F, thr: 0.40 },
    { id: 'export', name: 'Export of capital', desc: 'export of capital, as distinct from goods, exceptionally important', get: (r) => r.xShare, thr: 0.13 },
    { id: 'cartels', name: 'International cartels', desc: 'international monopolist associations share the world among themselves', get: (r) => r.cart, thr: 0.25 },
    { id: 'division', name: 'Territorial division complete', desc: 'the whole world divided among the biggest capitalist powers', get: (r) => r.Div, thr: 0.88 }
  ];
  const featEls = {};
  function buildFeats() {
    const ul = $('featList'); ul.textContent = '';
    FEATS.forEach((F) => {
      const li = el('li', null, null, ul);
      const box = el('span', 'box', '', li); box.setAttribute('aria-hidden', 'true');
      const what = el('div', 'what', null, li);
      el('b', null, F.name, what);
      el('span', null, F.desc, what);
      const meter = el('div', 'meter', null, what); const fill = el('i', null, null, meter);
      const stamp = el('span', 'stamp', '', li);
      featEls[F.id] = { li, box, fill, stamp };
    });
  }
  function renderFeats(rec) {
    const feat = model.state.feat || {};
    let count = 0;
    FEATS.forEach((F) => {
      const o = featEls[F.id];
      const yr = feat[F.id];
      const on = !!yr && yr <= rec.t;
      if (on) count++;
      o.li.classList.toggle('on', on);
      o.box.textContent = on ? '✓' : '';
      const v = F.get(rec);
      o.fill.style.width = clamp(v / F.thr, 0, 1) * 100 + '%';
      o.stamp.textContent = on ? 'since ' + yr : pct(v, 0) + ' / ' + pct(F.thr, 0);
    });
    const yi = feat.imperialism;
    $('featLine').textContent = yi && yi <= rec.t
      ? 'All five present since ' + yi + ': in Lenin’s terms the stage of imperialism. Thresholds are model choices; Lenin gave no numbers.'
      : count + ' of 5 present. Thresholds are model choices; Lenin gave no numbers.';
  }

  /* ---------------- contradictions ---------------- */
  const CONTRA = [
    ['capLab', 'Labour against capital in the core'],
    ['impOpp', 'Oppressed nations against imperialism'],
    ['interImp', 'Among the imperialist powers'],
    ['campCon', 'Socialist camp against imperialist camp'],
    ['forcesRel', 'Productive forces against relations of production'],
    ['hegRiv', 'Declining hegemon against rising rival'],
    ['feudal', 'Peasants against landlords (semi-feudal)']
  ];
  const contraEls = {};
  function buildContra() {
    const ul = $('contraList'); ul.textContent = '';
    CONTRA.forEach(([k, name]) => {
      const li = el('li', null, null, ul);
      const lab = el('span', null, name, li);
      const tag = el('span', 'tag', 'principal', lab); tag.hidden = true;
      const bar = el('span', 'bar', null, li); const fill = el('i', null, null, bar);
      const v = el('span', 'v', '', li);
      contraEls[k] = { li, fill, v, tag };
    });
  }
  function renderContra(rec) {
    CONTRA.forEach(([k]) => {
      const o = contraEls[k], v = rec.contra[k];
      o.fill.style.width = clamp(v, 0, 1) * 100 + '%';
      o.v.textContent = Math.round(v * 100);
      const p = rec.principal === k;
      o.li.classList.toggle('principal', p);
      o.tag.hidden = !p;
    });
  }

  /* ---------------- charts ---------------- */
  function niceTicks(min, max, count) {
    if (!(max > min)) { max = min + 1; }
    const span = max - min, step0 = span / count, mag = Math.pow(10, Math.floor(Math.log10(step0))), err = step0 / mag;
    const step = (err >= 7.5 ? 10 : err >= 3.5 ? 5 : err >= 1.5 ? 2 : 1) * mag;
    const lo = Math.floor(min / step + 1e-9) * step, hi = Math.ceil(max / step - 1e-9) * step;
    const ticks = []; for (let v = lo; v <= hi + step / 2; v += step) ticks.push(+v.toFixed(10));
    return { lo, hi, ticks, step };
  }
  function fmtTick(v, step) { const d = step < 1 ? (step < 0.1 ? 2 : 1) : 0; return v.toFixed(d); }
  const decades = () => { const out = []; for (let d = 1800; d <= 2020; d += 10) out.push(d); return out; };

  class Chart {
    constructor(host, def) {
      this.def = def; this.showTable = false; this.hoverT = null; this.hoverD = null;
      const wrap = el('div', 'chart', null, host);
      const head = el('div', 'chart-head', null, wrap);
      el('h3', null, def.title, head);
      const right = el('div', 'ctl-row', null, head);
      el('span', 'unit', def.unit, right);
      const tb = el('button', 'btn small', 'Table', right); tb.type = 'button'; tb.setAttribute('aria-pressed', 'false');
      tb.addEventListener('click', () => { this.showTable = !this.showTable; tb.setAttribute('aria-pressed', String(this.showTable)); tb.textContent = this.showTable ? 'Hide table' : 'Table'; this.render(); });
      this.legend = el('div', 'legend', null, wrap);
      this.plot = el('div', 'plot', null, wrap);
      this.svg = svgEl('svg', { role: 'img', 'aria-label': def.title + ' (' + def.unit + ')', tabindex: '0' }, this.plot);
      this.tip = el('div', 'tip', null, this.plot); this.tip.hidden = true;
      this.empty = el('div', 'empty', 'Press Play. The series draw as the model runs.', this.plot);
      this.tableWrap = el('div', 'tablewrap', null, wrap); this.tableWrap.hidden = true;
      if (def.foot) { const foot = el('div', 'chart-foot', null, wrap); const p = el('p', null, def.foot, foot); if (def.footRefs) refList(def.footRefs, p); }
      this.svg.addEventListener('pointermove', (ev) => this.onMove(ev));
      this.svg.addEventListener('pointerleave', () => { this.hoverT = null; this.hoverD = null; this.render(); });
      this.svg.addEventListener('keydown', (ev) => this.onKey(ev));
      this.svg.addEventListener('blur', () => { this.hoverT = null; this.hoverD = null; this.render(); });
    }
    seriesColor(i) { return 'var(--s' + (i + 1) + ')'; }
    buildLegend() {
      const L = this.legend; L.textContent = '';
      const def = this.def;
      if (def.type === 'stack') {
        def.cats.forEach((c, i) => { const s = el('span', null, null, L); const k = el('i', 'key rect', null, s); k.style.background = this.seriesColor(i); s.appendChild(document.createTextNode(c.label)); });
        if (compare) { const s = el('span', null, null, L); el('i', 'key ghost', null, s); s.appendChild(document.createTextNode('calibrated run (total)')); }
        return;
      }
      def.series.forEach((sr, i) => { const s = el('span', null, null, L); const k = el('i', 'key', null, s); k.style.borderColor = this.seriesColor(i); s.appendChild(document.createTextNode(sr.label)); });
      if (compare) { const s = el('span', null, null, L); el('i', 'key ghost', null, s); s.appendChild(document.createTextNode('calibrated run')); }
      (def.refs || []).forEach((rf) => { const s = el('span', null, null, L); const k = el('i', 'key ref', null, s); k.style.borderColor = rf.series !== undefined ? this.seriesColor(rf.series) : 'var(--ink-2)'; s.appendChild(document.createTextNode(rf.label)); });
    }
    data() {
      const h = H();
      const last = latest().t;
      const b = compare && base.length ? base.filter((r) => r.t <= last) : [];
      return { h, b, last };
    }
    render() {
      this.buildLegend();
      if (this.def.type === 'stack') return this.renderStack();
      return this.renderLine();
    }
    dims() {
      const W = Math.max(280, Math.round(this.plot.clientWidth || 600));
      const narrow = W < 560;
      const direct = !narrow && this.def.type !== 'stack' && this.def.series.length <= 4;
      const Ht = this.def.height || (narrow ? 210 : 250);
      return { W, Ht, narrow, direct, m: { l: 46, r: direct ? 104 : 14, t: 10, b: 24 } };
    }
    axes(g, D, x, yTicks, y, yFmt) {
      const { W, Ht, m, narrow } = D;
      // horizontal grid + y labels
      yTicks.forEach((v) => {
        const yy = y(v);
        const ln = svgEl('line', { x1: m.l, x2: W - m.r, y1: yy, y2: yy }, g); ln.style.stroke = 'var(--rule)'; ln.style.strokeWidth = 1;
        const tx = svgText(g, m.l - 6, yy + 4, yFmt(v), { size: 11, anchor: 'end', fill: 'var(--ink-3)' }); tx.style.fontVariantNumeric = 'tabular-nums';
      });
      const step = narrow ? 50 : 25;
      for (let t = 1800; t <= 2025; t += step) {
        const xx = x(t);
        const tk = svgEl('line', { x1: xx, x2: xx, y1: Ht - m.b, y2: Ht - m.b + 4 }, g); tk.style.stroke = 'var(--rule-2)';
        svgText(g, xx, Ht - 6, String(t), { size: 11, anchor: 'middle', fill: 'var(--ink-3)' });
      }
      const base0 = svgEl('line', { x1: m.l, x2: W - m.r, y1: Ht - m.b, y2: Ht - m.b }, g); base0.style.stroke = 'var(--rule-2)';
    }
    renderLine() {
      const def = this.def, D = this.dims(), { W, Ht, m } = D;
      const { h, b, last } = this.data();
      const svg = this.svg; svg.textContent = '';
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + Ht); svg.setAttribute('height', Ht);
      this.empty.hidden = h.length > 2;
      const x = (t) => m.l + (t - 1800) / (2026 - 1800) * (W - m.l - m.r);
      // y domain
      let lo = Infinity, hi = -Infinity;
      const scan = (v) => { if (v !== null && isFinite(v) && (!def.log || v > 0)) { if (v < lo) lo = v; if (v > hi) hi = v; } };
      def.series.forEach((sr) => { h.forEach((r) => scan(sr.get(r))); b.forEach((r) => scan(sr.get(r))); });
      (def.refs || []).forEach((rf) => rf.pts.forEach((p) => { if (p[0] <= last) scan(p[1]); }));
      if (!isFinite(lo)) { lo = 0; hi = 1; }
      let y, yTicks, yFmt;
      if (def.log) {
        const l0 = Math.floor(Math.log10(lo)), l1 = Math.ceil(Math.log10(hi));
        const L0 = l0, L1 = Math.max(l1, l0 + 1);
        y = (v) => Ht - m.b - (Math.log10(Math.max(v, Math.pow(10, L0))) - L0) / (L1 - L0) * (Ht - m.t - m.b);
        yTicks = []; for (let k = L0; k <= L1; k++) { yTicks.push(Math.pow(10, k)); if (L1 - L0 <= 2 && k < L1) { yTicks.push(2 * Math.pow(10, k)); yTicks.push(5 * Math.pow(10, k)); } }
        yFmt = (v) => (v >= 1000 ? (v / 1000) + 'k' : String(v));
      } else {
        if (def.yMin !== undefined) lo = Math.min(lo, def.yMin);
        if (def.yMax !== undefined) hi = Math.max(hi, def.yMax);
        if (def.yMin === undefined && lo > 0 && lo < hi * 0.35) lo = 0;
        const nt = niceTicks(lo, hi, D.narrow ? 4 : 5);
        y = (v) => Ht - m.b - (v - nt.lo) / (nt.hi - nt.lo) * (Ht - m.t - m.b);
        yTicks = nt.ticks; yFmt = (v) => fmtTick(v, nt.step);
      }
      const g = svgEl('g', null, svg);
      this.axes(g, D, x, yTicks, y, yFmt);
      const pathOf = (recs, get) => {
        let d = '', pen = false;
        recs.forEach((r) => { const v = get(r); if (v === null || !isFinite(v) || (def.log && v <= 0)) { pen = false; return; } d += (pen ? 'L' : 'M') + x(r.t).toFixed(1) + ',' + y(v).toFixed(1); pen = true; });
        return d;
      };
      // ghost (calibrated run)
      if (b.length) def.series.forEach((sr) => { const p = svgEl('path', { d: pathOf(b, sr.get) }, g); p.style.fill = 'none'; p.style.stroke = 'var(--ghost)'; p.style.strokeWidth = 1.5; p.style.strokeLinejoin = 'round'; });
      // series
      def.series.forEach((sr, i) => { const p = svgEl('path', { d: pathOf(h, sr.get) }, g); p.style.fill = 'none'; p.style.stroke = this.seriesColor(i); p.style.strokeWidth = 2; p.style.strokeLinejoin = 'round'; p.style.strokeLinecap = 'round'; });
      // reference points (historical data)
      (def.refs || []).forEach((rf) => rf.pts.forEach((pt) => {
        if (pt[0] > last) return;
        const c = svgEl('circle', { cx: x(pt[0]), cy: y(pt[1]), r: 4 }, g);
        c.style.fill = 'var(--sheet)'; c.style.stroke = rf.series !== undefined ? this.seriesColor(rf.series) : 'var(--ink-2)'; c.style.strokeWidth = 1.6;
      }));
      // direct labels at line ends
      if (D.direct && h.length > 2) {
        const lastRec = h[h.length - 1];
        const labs = def.series.map((sr, i) => ({ i, v: sr.get(lastRec), text: sr.short || sr.label })).filter((o) => o.v !== null && isFinite(o.v) && (!def.log || o.v > 0)).map((o) => ({ ...o, y: y(o.v) }));
        labs.sort((a, c2) => a.y - c2.y);
        for (let k = 1; k < labs.length; k++) if (labs[k].y - labs[k - 1].y < 13) labs[k].y = labs[k - 1].y + 13;
        const lx = x(lastRec.t) + 6;
        labs.forEach((o) => {
          const k = svgEl('line', { x1: lx, x2: lx + 10, y1: o.y, y2: o.y }, g); k.style.stroke = this.seriesColor(o.i); k.style.strokeWidth = 2;
          svgText(g, lx + 14, o.y + 4, o.text, { size: 11, fill: 'var(--ink-2)' });
        });
      }
      // view-year cursor
      if (viewT !== null) { const cx = x(viewT); const cl = svgEl('line', { x1: cx, x2: cx, y1: m.t, y2: Ht - m.b }, g); cl.style.stroke = 'var(--ink-3)'; cl.style.strokeWidth = 1; }
      // hover crosshair
      this.geom = { x, y, m, W, Ht, first: h[0].t, last };
      if (this.hoverT !== null && h.length > 1) {
        const t = clamp(this.hoverT, h[0].t, last);
        const hx = x(t);
        const hl = svgEl('line', { x1: hx, x2: hx, y1: m.t, y2: Ht - m.b }, g); hl.style.stroke = 'var(--ink-2)'; hl.style.strokeWidth = 1;
        const r = recAt(t);
        def.series.forEach((sr, i) => { const v = sr.get(r); if (v === null || !isFinite(v) || (def.log && v <= 0)) return; const c = svgEl('circle', { cx: hx, cy: y(v), r: 4 }, g); c.style.fill = this.seriesColor(i); c.style.stroke = 'var(--sheet)'; c.style.strokeWidth = 2; });
        this.showTipLine(t, hx);
      } else this.tip.hidden = true;
      if (this.showTable) this.renderTableLine(h); else this.tableWrap.hidden = true;
    }
    showTipLine(t, hx) {
      const def = this.def, tip = this.tip; tip.textContent = '';
      el('div', 'ty', String(t), tip);
      const r = recAt(t);
      const fmt = def.fmt || ((v) => v.toFixed(1));
      def.series.forEach((sr, i) => {
        const v = sr.get(r); const row = el('div', 'row', null, tip);
        const k = el('i', 'k', null, row); k.style.borderColor = this.seriesColor(i);
        el('b', null, v === null || !isFinite(v) ? '–' : fmt(v), row); el('span', null, sr.label, row);
      });
      if (compare && base.length) {
        const br = baseAt(t);
        if (br) { el('div', 'sep', null, tip); el('div', 'ty', 'Calibrated run', tip); def.series.forEach((sr) => { const v = sr.get(br); const row = el('div', 'row', null, tip); const k = el('i', 'k', null, row); k.style.borderColor = 'var(--ghost)'; el('b', null, v === null || !isFinite(v) ? '–' : fmt(v), row); el('span', null, sr.label, row); }); }
      }
      const near = [];
      (def.refs || []).forEach((rf) => rf.pts.forEach((p) => { if (Math.abs(p[0] - t) <= 1) near.push([rf, p]); }));
      if (near.length) {
        el('div', 'sep', null, tip);
        near.forEach(([rf, p]) => { const row = el('div', 'row', null, tip); const k = el('i', 'k ref', null, row); k.style.borderColor = rf.series !== undefined ? this.seriesColor(rf.series) : 'var(--ink-2)'; el('b', null, fmt(p[1]), row); el('span', null, (p[2] || p[0]) + ': ' + rf.label, row); });
      }
      tip.hidden = false;
      const pw = this.plot.clientWidth, tw = tip.offsetWidth || 180;
      let left = hx + 12; if (left + tw > pw) left = Math.max(0, hx - tw - 12);
      tip.style.left = left + 'px'; tip.style.top = '6px';
    }
    renderTableLine(h) {
      const def = this.def, tw = this.tableWrap; tw.textContent = ''; tw.hidden = false;
      const table = el('table', null, null, tw);
      const thead = el('thead', null, null, table); const trh = el('tr', null, null, thead);
      el('th', null, 'Year', trh); def.series.forEach((sr) => el('th', null, sr.label, trh));
      if (compare) def.series.forEach((sr) => el('th', null, sr.label + ' (calibrated)', trh));
      const tb = el('tbody', null, null, table);
      const fmt = def.fmt || ((v) => v.toFixed(1));
      const years = h.filter((r) => r.t % 10 === 0 || r.t === h[h.length - 1].t).map((r) => r.t);
      years.forEach((t) => {
        const r = recAt(t); const tr = el('tr', null, null, tb); el('td', null, String(t), tr);
        def.series.forEach((sr) => { const v = sr.get(r); el('td', null, v === null || !isFinite(v) ? '–' : fmt(v), tr); });
        if (compare) { const br = baseAt(t); def.series.forEach((sr) => { const v = br ? sr.get(br) : null; el('td', null, v === null || !isFinite(v) ? '–' : fmt(v), tr); }); }
      });
      if (def.refs && def.refs.length) {
        const p = el('p', 'muted', null, tw); p.style.fontSize = 'var(--step--1)'; p.style.marginTop = '6px';
        p.textContent = 'Historical data points: ' + def.refs.map((rf) => rf.label + ': ' + rf.pts.map((q) => (q[2] || q[0]) + ' ' + fmt(q[1])).join(', ')).join('. ') + '.';
      }
    }
    stackData(recs) {
      const def = this.def;
      return decades().map((d) => {
        const rs = recs.filter((r) => r.t >= d && r.t < d + 10);
        if (!rs.length) return null;
        const vals = def.cats.map((c) => { const s = rs.reduce((a, r) => a + c.get(r), 0); return def.agg === 'avg' ? s / rs.length : s; });
        return { d, n: rs.length, vals, total: vals.reduce((a, v) => a + v, 0) };
      });
    }
    renderStack() {
      const def = this.def, D = this.dims(), { W, Ht, m } = D;
      const { h, b } = this.data();
      const svg = this.svg; svg.textContent = '';
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + Ht); svg.setAttribute('height', Ht);
      this.empty.hidden = h.length > 2;
      const rows = this.stackData(h), brows = b.length ? this.stackData(b) : [];
      let hi = 0; rows.forEach((r) => { if (r) hi = Math.max(hi, r.total); }); brows.forEach((r) => { if (r) hi = Math.max(hi, r.total); });
      if (hi <= 0) hi = 1;
      const nt = niceTicks(0, hi, D.narrow ? 4 : 5);
      const y = (v) => Ht - m.b - (v - nt.lo) / (nt.hi - nt.lo) * (Ht - m.t - m.b);
      const x = (t) => m.l + (t - 1800) / (2026 - 1800) * (W - m.l - m.r);
      const band = x(1810) - x(1800);
      const g = svgEl('g', null, svg);
      this.axes(g, D, x, nt.ticks, y, (v) => fmtTick(v, nt.step));
      this.bars = [];
      rows.forEach((r, i) => {
        if (!r) return;
        const bx0 = x(r.d), bx1 = x(Math.min(r.d + 10, 2026));
        const bw = Math.max(2, bx1 - bx0 - 4);
        const bx = bx0 + 2;
        let acc0 = 0;
        r.vals.forEach((v, k) => {
          if (v <= 0) return;
          const y0 = y(acc0), y1 = y(acc0 + v);
          acc0 += v;
          const hgt = Math.max(0, y0 - y1 - (k > 0 ? 1 : 0));
          if (hgt < 0.5) return;
          const rc = svgEl('rect', { x: bx, y: y1, width: bw, height: hgt, rx: k === r.vals.length - 1 ? 1.5 : 0 }, g);
          rc.style.fill = this.seriesColor(k);
          if (this.hoverD !== null && this.hoverD !== r.d) rc.style.opacity = 0.55;
        });
        const br = brows[i];
        if (br) { const gy = y(br.total); const gl = svgEl('line', { x1: bx - 2, x2: bx + bw + 2, y1: gy, y2: gy }, g); gl.style.stroke = 'var(--ghost)'; gl.style.strokeWidth = 2; }
        this.bars.push({ d: r.d, x0: bx0, x1: bx1, r, br });
      });
      if (viewT !== null) { const cx = x(viewT); const cl = svgEl('line', { x1: cx, x2: cx, y1: m.t, y2: Ht - m.b }, g); cl.style.stroke = 'var(--ink-3)'; }
      this.geom = { x, m, W, Ht, band };
      if (this.hoverD !== null) {
        const bar = this.bars.find((q) => q.d === this.hoverD);
        if (bar) this.showTipStack(bar); else this.tip.hidden = true;
      } else this.tip.hidden = true;
      if (this.showTable) this.renderTableStack(rows, brows); else this.tableWrap.hidden = true;
    }
    showTipStack(bar) {
      const def = this.def, tip = this.tip; tip.textContent = '';
      const r = bar.r;
      const yrs = r.d + '–' + Math.min(r.d + 9, latest().t);
      el('div', 'ty', yrs + (def.agg === 'avg' ? ' (average)' : ''), tip);
      const fmt = def.fmt || ((v) => v.toFixed(1));
      for (let k = def.cats.length - 1; k >= 0; k--) {
        const row = el('div', 'row', null, tip); const kk = el('i', 'k', null, row); kk.style.borderColor = this.seriesColor(k);
        el('b', null, fmt(r.vals[k]), row); el('span', null, def.cats[k].label, row);
      }
      el('div', 'sep', null, tip);
      const tr = el('div', 'row', null, tip); el('i', null, null, tr); el('b', null, fmt(r.total), tr); el('span', null, 'total', tr);
      if (bar.br) { const tr2 = el('div', 'row', null, tip); const k2 = el('i', 'k', null, tr2); k2.style.borderColor = 'var(--ghost)'; el('b', null, fmt(bar.br.total), tr2); el('span', null, 'calibrated run', tr2); }
      tip.hidden = false;
      const pw = this.plot.clientWidth, tw = tip.offsetWidth || 180;
      let left = bar.x1 + 6; if (left + tw > pw) left = Math.max(0, bar.x0 - tw - 6);
      tip.style.left = left + 'px'; tip.style.top = '6px';
    }
    renderTableStack(rows, brows) {
      const def = this.def, tw = this.tableWrap; tw.textContent = ''; tw.hidden = false;
      const table = el('table', null, null, tw);
      const trh = el('tr', null, null, el('thead', null, null, table));
      el('th', null, 'Decade', trh); def.cats.forEach((c) => el('th', null, c.label, trh)); el('th', null, 'Total', trh);
      if (compare) el('th', null, 'Total, calibrated run', trh);
      const tb = el('tbody', null, null, table);
      const fmt = def.fmt || ((v) => v.toFixed(1));
      rows.forEach((r, i) => {
        if (!r) return;
        const tr = el('tr', null, null, tb); el('td', null, r.d + 's', tr);
        r.vals.forEach((v) => el('td', null, fmt(v), tr)); el('td', null, fmt(r.total), tr);
        if (compare) el('td', null, brows[i] ? fmt(brows[i].total) : '–', tr);
      });
    }
    onMove(ev) {
      if (!this.geom) return;
      const rect = this.svg.getBoundingClientRect();
      const px = (ev.clientX - rect.left) * (this.geom.W / rect.width);
      if (this.def.type === 'stack') {
        const bar = (this.bars || []).find((q) => px >= q.x0 && px < q.x1);
        const d = bar ? bar.d : null;
        if (d !== this.hoverD) { this.hoverD = d; this.render(); }
        return;
      }
      const m = this.geom.m;
      const t = Math.round(1800 + (px - m.l) / (this.geom.W - m.l - m.r) * (2026 - 1800));
      const tt = clamp(t, this.geom.first, this.geom.last);
      if (tt !== this.hoverT) { this.hoverT = tt; this.render(); }
    }
    onKey(ev) {
      if (ev.key !== 'ArrowLeft' && ev.key !== 'ArrowRight') return;
      ev.preventDefault();
      const dir = ev.key === 'ArrowLeft' ? -1 : 1;
      if (this.def.type === 'stack') {
        const ds = (this.bars || []).map((q) => q.d); if (!ds.length) return;
        const i = this.hoverD === null ? ds.length - 1 : clamp(ds.indexOf(this.hoverD) + dir, 0, ds.length - 1);
        this.hoverD = ds[i]; this.render(); return;
      }
      const g = this.geom; if (!g) return;
      this.hoverT = clamp((this.hoverT === null ? g.last : this.hoverT + dir), g.first, g.last); this.render();
    }
  }

  const C = (key) => (r) => r[key] * 100;
  const TABS = [
    { id: 'forces', name: 'Forces & consumption', charts: [
      { title: 'Productive capacity against mass consumption (core)', unit: 'billions of model $ a year, log scale', log: true, fmt: (v) => (v >= 1000 ? (v / 1000).toFixed(2) + 'k' : v.toFixed(0)),
        series: [{ label: 'Productive capacity', short: 'Capacity', get: (r) => r.Ystar }, { label: 'Output sold', short: 'Sold', get: (r) => r.Y }, { label: 'Mass consumption', short: 'Masses', get: (r) => r.massCons }, { label: 'Capitalists’ consumption', short: 'Capitalists', get: (r) => r.Ck }],
        foot: 'Capacity is the lower of capital ÷ capital-output ratio and labour productivity × wage-labour force. Mass consumption is wages after tax plus transfers plus new household credit minus debt service. A real-world comparison: from 1979 Q4 to 2026 Q2, US net productivity grew 93.7% while the hourly pay of typical workers grew 32.7% (EPI).', footRefs: ['epi', 'capital_v3_30'] },
      { title: 'Realisation', unit: '% of capacity', yMin: 0,
        series: [{ label: 'Capacity utilisation', short: 'Utilisation', get: C('u') }, { label: 'Mass consumption ÷ capacity', short: 'Masses', get: (r) => r.massCons / r.Ystar * 100 }, { label: 'Investment ÷ capacity', short: 'Investment', get: (r) => r.I / r.Ystar * 100 }],
        foot: 'When wages lag capacity, output can be sold only if investment, capitalists’ consumption, state spending, exports or credit fill the gap. When they do not, utilisation falls and the reserve army grows.' }
    ] },
    { id: 'exploit', name: 'Exploitation & profit', charts: [
      { title: 'Wage share, rate of profit and reserve army (core)', unit: '%', yMin: 0,
        series: [{ label: 'Wage share', short: 'Wage share', get: C('omega') }, { label: 'Rate of profit', short: 'Profit rate', get: C('r') }, { label: 'Reserve army (unemployed share of wage labour)', short: 'Reserve army', get: C('U') }],
        refs: [{ label: 'US non-farm business labour share (BLS)', series: 0, pts: [[1947, 65.5], [1960, 66.2], [1970, 65.1], [1979, 63.0], [2007, 59.0], [2019, 56.3], [2026, 52.8]] }],
        foot: 'The model’s wage share covers the whole capitalist sector of the core; the BLS series covers the US non-farm business sector, so compare direction rather than level. The reserve army includes underemployment that historical unemployment series do not measure, so nineteenth-century values run high.', footRefs: ['labshare', 'capital_v1_25', 'capital_v3_13'] },
      { title: 'Rate of surplus value', unit: 'surplus value ÷ wages, %', yMin: 0,
        series: [{ label: 'Rate of surplus value', short: 's ÷ v', get: C('e') }],
        foot: 'Surplus value is output minus wages in the capitalist sector, before taxes and depreciation.' }
    ] },
    { id: 'mono', name: 'Monopoly & finance', charts: [
      { title: 'Lenin’s five features as model indices', unit: '%', yMin: 0, yMax: 100,
        series: [{ label: 'Monopoly index', get: C('M') }, { label: 'Finance-capital index', get: C('F') }, { label: 'Capital abroad ÷ total capital', get: C('xShare') }, { label: 'Cartel index', get: (r) => Math.min(1, r.cart) * 100 }, { label: 'Dominated population inside spheres', get: C('Div') }],
        foot: 'Thresholds for the checklist: monopoly 35, finance 40, capital abroad 13, cartels 25, division 88. They are model choices.', footRefs: ['lenin_ch7', 'hilferding'] },
      { title: 'Finance and the top 1%', unit: '%', yMin: 0,
        series: [{ label: 'Finance share of profits', short: 'Finance', get: C('finShare') }, { label: 'Top 1% income share', short: 'Top 1%', get: C('top1') }],
        refs: [
          { label: 'US financial corporations’ share of domestic profits (calculated from BEA)', series: 0, pts: [[1950, 8.8], [1970, 19.3], [1980, 17.1], [2002, 38.1], [2025, 23.9]] },
          { label: 'US top 1% fiscal income share incl. capital gains (Piketty–Saez)', series: 1, pts: [[1928, 23.9], [1975, 8.9], [2024, 22.4]] }],
        foot: 'Data points are for the United States only; the model is the core as a whole.', footRefs: ['bea', 'krippner', 'saez', 'foster2006'] },
      { title: 'Household debt', unit: '% of the core wage bill', yMin: 0,
        series: [{ label: 'Household debt ÷ wage bill', short: 'Debt', get: C('HDw') }],
        foot: 'US household debt reached about 133% of disposable income in 2007 (Glick & Lansing). The model divides by the wage bill, so levels are not directly comparable.', footRefs: ['glick', 'cynamon'] }
    ] },
    { id: 'imp', name: 'Imperialism', charts: [
      { type: 'stack', agg: 'avg', title: 'Drain from zone C by channel', unit: '% of zone C output, decade average',
        cats: [{ label: 'Tribute', get: (r) => r.seg.C.tribute / r.seg.C.Y * 100 }, { label: 'Repatriated profit', get: (r) => r.seg.C.repat / r.seg.C.Y * 100 }, { label: 'Unequal exchange', get: (r) => r.seg.C.ue / r.seg.C.Y * 100 }, { label: 'Debt service', get: (r) => r.seg.C.debtServ / r.seg.C.Y * 100 }],
        foot: 'Hickel et al. (2022) estimate the South’s net drain at $10.8 trillion in 2015 in Northern prices (23% of Northern GDP). Patnaik’s estimate of the drain from India, 1765–1938, about $45 trillion compounded to the present, is disputed (Roy 2022).', footRefs: ['hickel2022', 'patnaik_drain', 'roy_drain', 'emmanuel', 'amin'] },
      { title: 'Share of world manufacturing', unit: '%', yMin: 0, yMax: 100,
        series: [{ label: 'Core + zone A', short: 'Core + A', get: (r) => (r.mfg.core + r.mfg.A) * 100 }, { label: 'Zone B', short: 'Zone B', get: (r) => r.mfg.B * 100 }, { label: 'Zone C', short: 'Zone C', get: (r) => r.mfg.C * 100 }],
        refs: [
          { label: 'Developed countries (Bairoch)', series: 0, pts: [[1800, 32.3], [1830, 39.5], [1860, 63.4], [1880, 79.1], [1900, 89.0], [1913, 92.5]] },
          { label: 'China (Bairoch; UN 2024 at constant prices)', series: 1, pts: [[1800, 33.3], [1830, 29.8], [1860, 19.7], [1880, 12.5], [1900, 6.2], [1913, 3.6], [2024, 30.7]] }],
        foot: 'Bairoch’s early figures include handicrafts; 1860 and 1900 values for developed countries are 100 minus his Third World shares. The model counts in volumes, closer to Bairoch than to current-dollar shares.', footRefs: ['bairoch', 'unsd_mva'] },
      { title: 'Output per head', unit: 'model $ ≈ 1990 international $, log scale', log: true, fmt: (v) => Math.round(v).toLocaleString('en-US'),
        series: [{ label: 'Core', short: 'Core', get: (r) => r.ypcCore }, { label: 'Zone A', short: 'A', get: (r) => r.seg.A.ypc }, { label: 'Zone B', short: 'B', get: (r) => r.seg.B.ypc }, { label: 'Zone C', short: 'C', get: (r) => r.seg.C.ypc }],
        refs: [
          { label: 'Western Europe (Maddison)', series: 0, pts: [[1820, 1232], [1913, 3473], [1950, 4594], [1973, 11534], [1998, 17921]] },
          { label: 'Africa (Maddison)', series: 3, pts: [[1820, 418], [1913, 585], [1950, 852], [1973, 1365], [1998, 1368]] }],
        foot: 'Maddison puts the gap between the richest and poorest regions at 3:1 in 1820 and 19:1 in 1998.', footRefs: ['maddison'] }
    ] },
    { id: 'money', name: 'Money & hegemony', charts: [
      { title: 'Dollar system and hegemony', unit: '%', yMin: 0, yMax: 100,
        series: [{ label: 'Dollar share of reserves', short: 'Dollar share', get: (r) => (r.money === 'bw' || r.money === 'dollar' ? r.DS * 100 : null) }, { label: 'Hegemon’s share of great-power output', short: 'Hegemon', get: C('H') }, { label: 'Sanctions intensity', short: 'Sanctions', get: C('Sx') }, { label: 'Average tariff', short: 'Tariff', get: C('tariff') }],
        refs: [
          { label: 'IMF COFER, US dollar share of allocated reserves', series: 0, pts: [[1999.4, 72.13, '1999 Q2'], [1999.9, 71.01, '1999 Q4'], [2026, 56.70, '2026 Q2']] },
          { label: 'US average statutory tariff (Yale Budget Lab, Aug 2026)', series: 3, pts: [[2026, 11.0]] }],
        foot: 'COFER shares are as revised by the IMF in 2026. The tariff point is for the United States; the model’s tariff is a core average.', footRefs: ['cofer', 'bis2025', 'yale', 'hudson', 'arrighi'] },
      { title: 'Interest and inflation (core)', unit: '%',
        series: [{ label: 'Policy interest rate', short: 'Interest', get: C('i') }, { label: 'Inflation', short: 'Inflation', get: C('pi') }],
        refs: [{ label: 'US federal funds rate (monthly average; 2026: midpoint of the target range)', series: 0, pts: [[1981.4, 19.1, 'June 1981'], [2024, 5.33, 'Aug 2023–Aug 2024'], [2026, 3.875, 'Sept 2026, range 3.75–4']] }],
        foot: 'Between December 2008 and December 2015 the monthly effective federal funds rate stayed between 0.07% and 0.22%. Under gold, prices could fall for years; under fiat money, inflation becomes the adjustment.', footRefs: ['fedfunds', 'volcker', 'fed2008', 'fed2023', 'fed2026'] }
    ] },
    { id: 'politics', name: 'Class power & politics', charts: [
      { title: 'Class forces in the core', unit: 'index, 0–100', yMin: 0, yMax: 100,
        series: [{ label: 'Labour organisation', get: C('O') }, { label: 'Militancy', get: C('Mil') }, { label: 'Capital’s political power', get: C('Pk') }, { label: 'Legitimacy of the order', get: C('Leg') }, { label: 'Nationalism', get: C('Nat') }],
        refs: [{ label: 'US union membership rate (1954: older series; 1983 on: BLS)', series: 0, pts: [[1954, 34.8], [1983, 20.1], [2025, 10.0]] }],
        foot: 'Labour organisation is a model index, not union density; the US data points show direction only.', footRefs: ['union_crs', 'union_bls', 'lenin_split', 'engels1858'] },
      { title: 'Repression and fascism', unit: 'index, 0–100', yMin: 0, yMax: 100,
        series: [{ label: 'Repression in the core', short: 'Core', get: C('Rep') }, { label: 'Repression in zone C', short: 'Zone C', get: (r) => r.seg.C.Rep * 100 }, { label: 'Fascist share of core output', short: 'Fascism', get: C('fascist') }],
        footRefs: ['dimitrov'] }
    ] },
    { id: 'lives', name: 'Lives lost', charts: [
      { type: 'stack', agg: 'sum', title: 'Deaths attributed to the modelled mechanisms', unit: 'millions per decade', fmt: (v) => (v >= 10 ? v.toFixed(0) : v.toFixed(1)),
        cats: [{ label: 'War', get: (r) => r.dy.war.attr }, { label: 'Famine', get: (r) => r.dy.famine.attr }, { label: 'Chronic poverty', get: (r) => r.dy.poverty.attr }, { label: 'Repression and genocide', get: (r) => r.dy.repression.attr }, { label: 'Work and despair', get: (r) => r.dy.occupational.attr + r.dy.despair.attr }, { label: 'Transition and sanctions', get: (r) => r.dy.transition.attr + r.dy.sanctions.attr }],
        foot: 'Attributable deaths only; see the ledger below for what each category counts and for the literature.' },
      { type: 'stack', agg: 'sum', title: 'All excess deaths by zone, including chronic poverty', unit: 'millions per decade', fmt: (v) => (v >= 10 ? v.toFixed(0) : v.toFixed(1)),
        cats: [{ label: 'Core', get: (r) => r.regionDeaths.core }, { label: 'Zone A', get: (r) => r.regionDeaths.A }, { label: 'Zone B', get: (r) => r.regionDeaths.B }, { label: 'Zone C', get: (r) => r.regionDeaths.C }],
        foot: 'Includes chronic-poverty mortality measured against a population at 3.9× bare subsistence, which is a benchmark, not a counterfactual. Mortality inside socialist and restored zones is not computed.' }
    ] }
  ];
  let charts = [];
  function buildTabs() {
    const tl = $('tabs'); tl.textContent = '';
    TABS.forEach((T) => {
      const b = el('button', 'tab', T.name, tl); b.type = 'button'; b.setAttribute('role', 'tab'); b.id = 'tab-' + T.id;
      b.setAttribute('aria-selected', String(T.id === tab)); b.setAttribute('aria-controls', 'tabPanel');
      b.addEventListener('click', () => { tab = T.id; store.set('tab', tab); buildTabs(); buildCharts(); renderCharts(); });
    });
    $('tabPanel').setAttribute('aria-labelledby', 'tab-' + tab);
  }
  function buildCharts() {
    const host = $('tabPanel'); host.textContent = '';
    const T = TABS.find((x) => x.id === tab) || TABS[0];
    charts = T.charts.map((def) => new Chart(host, def));
  }
  function renderCharts() { charts.forEach((ch) => ch.render()); }

  /* ---------------- levers ---------------- */
  const leverEls = {};
  function buildLevers() {
    const host = $('leverList'); host.textContent = '';
    LEVERS.forEach((L) => {
      const d = el('div', 'lever', null, host);
      const lab = el('label', null, L.name, d); lab.htmlFor = 'lv-' + L.id;
      const inp = el('input', null, null, d); inp.type = 'range'; inp.min = 0; inp.max = 100; inp.step = 5; inp.id = 'lv-' + L.id; inp.value = levers[L.id];
      const out = el('output', null, '', d); out.htmlFor = inp.id;
      el('div', 'desc', L.desc, d);
      inp.addEventListener('input', () => onLever(L, +inp.value));
      leverEls[L.id] = { d, inp, out };
    });
    const pr = $('presets'); pr.textContent = '';
    PRESETS.forEach((P) => {
      const b = el('button', 'btn small', P.name, pr); b.type = 'button';
      b.addEventListener('click', () => {
        levers = Object.assign({}, E.DEFAULT_LEVERS, P.set);
        syncLevers();
        startRun(P.name === 'Calibrated history' ? null : 'Preset: ' + P.name);
        play();
      });
    });
    syncLevers();
  }
  function leverText(v) { return '×' + (v / 50).toFixed(1); }
  function syncLevers() {
    LEVERS.forEach((L) => { const o = leverEls[L.id]; if (!o) return; o.inp.value = levers[L.id]; o.out.textContent = leverText(levers[L.id]); o.d.classList.toggle('changed', levers[L.id] !== 50); });
  }
  function onLever(L, v) {
    levers[L.id] = v;
    model.setLevers(levers);
    syncLevers();
    if (leversDiffer()) compare = true;
    const t = model.state.t;
    const txt = LEVERS.filter((x) => levers[x.id] !== 50).map((x) => x.name + ' ' + leverText(levers[x.id])).join(', ') || 'all levers at calibration';
    const lastU = userEvents[userEvents.length - 1];
    if (lastU && lastU.t === t && lastU.kind === 'levers') lastU.short = txt;
    else userEvents.push({ t, type: 'user', kind: 'levers', title: 'Levers changed', short: txt + '. Acts from ' + (t + 1) + '.' });
    renderAll();
  }

  /* ---------------- chronicle ---------------- */
  function renderChron() {
    const evs = model.state.events;
    const sig = evs.length + '|' + userEvents.length + '|' + showMinor + '|' + userEvents.map((u) => u.short).join('');
    if (sig === chronSig) return;
    chronSig = sig;
    const ul = $('chron'); ul.textContent = '';
    const items = [];
    evs.forEach((e) => {
      if (!EV[e.type]) return;
      const info = evInfo(e);
      const major = info.pause || e.major;
      if (!major && !showMinor) return;
      items.push({ t: e.t, e, info, cls: major ? '' : 'minor' });
    });
    userEvents.forEach((u) => items.push({ t: u.t, u, cls: 'user' }));
    items.sort((a, b) => b.t - a.t);
    if (!items.length) { el('li', 'empty', 'Events appear here as the model produces them.', ul); return; }
    items.forEach((it) => {
      const li = el('li', it.cls, null, ul);
      const b = el('button', null, null, li); b.type = 'button';
      el('span', 'y', String(it.t), b);
      const tx = el('span', 't', it.u ? it.u.title : it.info.title, b);
      el('span', 's', it.u ? it.u.short : it.info.short, tx);
      if (it.e) b.addEventListener('click', () => { pause(); const all = model.state.events.filter((x) => x.t === it.t); showTurn(it.t, it.e, all, false); });
      else b.disabled = true;
    });
  }

  /* ---------------- ledger ---------------- */
  const LEDGER = [
    ['war', 'War', 'Deaths in inter-imperialist wars, wars of conquest, the semi-colony’s great rebellion and counter-insurgency wars. All counted as attributable.',
      'First World War: 8.5–10 M soldiers, civilians uncertain (up to ~13 M). Second World War: 40–50 M, or 60–75 M with famine and disease. Korea: ~2.6 M. Vietnam: ~1 M (1965–75) to 3.8 M violent deaths (1955–2002). Post-9/11 war zones: at least 4.5–4.7 M direct and indirect. Taiping: 20–30 M.', ['ww1_brit', 'ww2_brit', 'korea_brit', 'hirschman', 'obermeyer', 'costs_of_war', 'davis']],
    ['famine', 'Famine', 'Excess deaths in drought years. Attributable: the part that would not occur if 40% of the retainable drain had stayed with the population and colonial tax demands had been relieved in the stricken region.',
      'Davis (2001): 31.7–61.3 M in India, China and Brazil in 1876–79 and 1896–1902. Bengal 1943: estimates 0.8–3.8 M, consensus about 2.1 M.', ['davis', 'ograda', 'bengal_fic']],
    ['poverty', 'Chronic poverty', 'Excess mortality from low mass consumption, spread over ten consumption deciles. Total is measured against a population at 3.9× bare subsistence. Attributable is the part removed by keeping 40% of the retainable drain.',
      'Sullivan & Hickel (2023): 50 M excess deaths in India 1891–1920 against India’s 1880s death rate; 165 M in 1881–1920 against an early-modern English baseline. The result depends on the baseline; Roy disputes the causation.', ['sullivan_hickel', 'roy2023']],
    ['repression', 'Repression and genocide', 'Killings in the repression of organised resistance by colonial, comprador and core states; massacres after coups; fascist terror and genocide.',
      'Holocaust: about 6 M Jews murdered. Indonesia 1965–66: 500,000 to 1 M.', ['ushmm', 'robinson', 'cribb']],
    ['occupational', 'Work', 'Deaths at work in modern production, above an unavoidable floor.',
      'ILO: about 2.93 M work-related deaths in 2019 (2.6 M from disease, 330,000 accidents). Rana Plaza 2013: at least 1,132 dead.', ['ilo2023', 'rana_ilo']],
    ['despair', 'Despair', 'From 1985: deaths in the core linked to deindustrialisation, inequality and unemployment.',
      'Case & Deaton: about 158,000 US deaths of despair in 2017.', ['case_deaton']],
    ['transition', 'Transition', 'The mortality crisis after the restored bloc collapses.',
      'Men et al. (2003): 2.5–3 M extra Russian adult deaths in 1992–2001. The privatisation link is disputed.', ['men2003', 'stuckler', 'earle']],
    ['sanctions', 'Sanctions', 'Deaths linked to dollar sanctions on targeted economies, scaled to the study at right.',
      'Rodríguez, Rendón & Weisbrot (2025): about 564,000 deaths a year in 2012–21 (95% interval 368,000–761,000), a single observational study. The 1990s Iraq child-mortality figure was later found to rest on a manipulated survey.', ['sanctions2025', 'dyson']]
  ];
  let ledgerBuilt = false; const ledgerCells = {};
  function buildLedger() {
    const t = $('ledgerTable'); t.textContent = '';
    const trh = el('tr', null, null, el('thead', null, null, t));
    ['Category', 'Attributable, this run', 'Total excess, this run', 'What the model counts', 'Literature for comparison'].forEach((h, i) => { const th = el('th', i >= 3 ? 'wrap' : null, h, trh); th.scope = 'col'; });
    const tb = el('tbody', null, null, t);
    LEDGER.forEach(([k, name, what, lit, refs]) => {
      const tr = el('tr', null, null, tb);
      el('td', null, name, tr);
      const a = el('td', 'red num', '', tr), tot = el('td', 'num', '', tr);
      el('td', 'wrap', what, tr);
      const l = el('td', 'lit', lit, tr); refList(refs, l);
      ledgerCells[k] = { a, tot };
    });
    const tf = el('tfoot', null, null, t); const trf = el('tr', null, null, tf);
    el('td', null, 'All categories', trf); ledgerCells._a = el('td', 'red num', '', trf); ledgerCells._t = el('td', 'num', '', trf);
    const note = el('td', 'wrap', '', trf); note.colSpan = 2; ledgerCells._n = note;
    ledgerBuilt = true;
  }
  function renderLedger(rec) {
    if (!ledgerBuilt) buildLedger();
    let A = 0, T = 0;
    LEDGER.forEach(([k]) => { const v = rec.cum[k]; ledgerCells[k].a.textContent = fmtLives(v.attr); ledgerCells[k].tot.textContent = fmtLives(v.total); A += v.attr; T += v.total; });
    ledgerCells._a.textContent = fmtLives(A); ledgerCells._t.textContent = fmtLives(T);
    let n = 'Cumulative to ' + rec.t + '.';
    if (compare && base.length) { const b = baseAt(rec.t); if (b) { const BA = E.CAT.reduce((s, k) => s + b.cum[k].attr, 0); n += ' Calibrated run at the same year: ' + fmtLives(BA) + ' attributable.'; } }
    ledgerCells._n.textContent = n;
  }

  /* ---------------- render all ---------------- */
  let resizeTimer = null;
  function renderAll() {
    const rec = cur();
    renderHeader(rec);
    renderPhase(rec);
    drawMap(rec);
    renderTiles(rec);
    renderFeats(rec);
    renderContra(rec);
    renderCharts();
    renderChron();
    renderLedger(rec);
  }

  /* ---------------- wiring ---------------- */
  function wire() {
    $('playBtn').addEventListener('click', () => (playing ? pause() : play()));
    $('stepBtn').addEventListener('click', stepOnce);
    $('endBtn').addEventListener('click', runToEnd);
    $('resetBtn').addEventListener('click', () => { startRun(leversDiffer() ? 'Restarted with current levers' : null); });
    $('speedSel').addEventListener('change', (e) => { speed = +e.target.value; });
    $('seedIn').addEventListener('change', (e) => {
      const v = Math.round(+e.target.value);
      if (!(v >= 1 && v <= 999999)) { e.target.value = seed; return; }
      seed = v; startRun(seed === 1917 ? null : 'Seed ' + seed);
    });
    const pc = $('pauseChk'); pc.checked = pauseAtTurns;
    pc.addEventListener('change', () => { pauseAtTurns = pc.checked; store.set('pause', pauseAtTurns); });
    $('minorChk').addEventListener('change', (e) => { showMinor = e.target.checked; renderChron(); });
    $('scrub').addEventListener('input', (e) => {
      pause();
      const v = +e.target.value;
      viewT = v >= latest().t ? null : v;
      lastPhaseSig = '';
      renderAll();
    });
    $('branchBtn').addEventListener('click', branchFrom);
    $('leverReset').addEventListener('click', () => {
      LEVERS.forEach((L) => { levers[L.id] = 50; });
      model.setLevers(levers); syncLevers();
      userEvents.push({ t: model.state.t, type: 'user', kind: 'levers', title: 'Levers back to calibration', short: 'Acts from ' + (model.state.t + 1) + '.' });
      renderAll();
    });
    $('turnGo').addEventListener('click', () => { hideTurn(); play(); });
    $('turnClose').addEventListener('click', hideTurn);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hideTurn(); });
    window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(renderAll, 120); });
  }

  /* ---------------- calibration table and sources ---------------- */
  function buildCalibration() {
    const cm = E.createModel({ seed: 1917 });
    const ch = cm.runTo(END);
    const at = (y) => ch[y - ch[0].t];
    const evs = cm.state.events;
    const first = (type, pred) => { const e = evs.find((x) => x.type === type && (!pred || pred(x))); return e ? String(e.t) : 'not reached'; };
    const sumK = (a, b, k) => ch.filter((r) => r.t >= a && r.t <= b).reduce((acc, r) => acc + r.dy[k].total, 0);
    const wars = evs.filter((e) => e.type === 'war');
    const warDeaths = (w) => { const end = (evs.find((e) => e.type === 'warEnd' && e.n === w.n) || { t: w.t + 6 }).t; return { d: sumK(w.t, end, 'war'), rep: sumK(w.t, end, 'repression') }; };
    const p = (x, d) => (x * 100).toFixed(d === undefined ? 1 : d) + '%';
    const money = (v) => '$' + Math.round(v).toLocaleString('en-US');
    const rows = [
      ['Developed countries’ share of world manufacturing, 1913 (Bairoch)', '92.5%', p(at(1913).mfg.core + at(1913).mfg.A) + ' (core + zone A)'],
      ['China’s share of world manufacturing, 1830 and 1900 (Bairoch)', '29.8% · 6.2%', p(at(1830).mfg.B) + ' · ' + p(at(1900).mfg.B) + ' (zone B)'],
      ['GDP per head, Western Europe, 1913 and 1998 (Maddison)', '$3,473 · $17,921', money(at(1913).ypcCore) + ' · ' + money(at(1998).ypcCore) + ' (core)'],
      ['GDP per head, Africa, 1913 and 1998 (Maddison)', '$585 · $1,368', money(at(1913).seg.C.ypc) + ' · ' + money(at(1998).seg.C.ypc) + ' (zone C)'],
      ['Famine deaths 1876–79 and 1896–1902 (Davis, India, China, Brazil)', '31.7–61.3 M', fmtLives(sumK(1876, 1879, 'famine') + sumK(1896, 1902, 'famine')) + ' (zones B and C)'],
      ['First World War deaths', '8.5–10 M soldiers; civilians uncertain, up to ~13 M', wars[0] ? fmtLives(warDeaths(wars[0]).d) : 'no war'],
      ['Second World War deaths', '40–50 M; 60–75 M with famine and disease', wars[1] ? fmtLives(warDeaths(wars[1]).d) + ' in war + ' + fmtLives(warDeaths(wars[1]).rep) + ' fascist terror' : 'no war'],
      ['US labour share, 1960 Q4 and 2026 Q2 (BLS)', '66.2% · 52.8%', p(at(1960).omega) + ' · ' + p(at(2026).omega) + ' (core wage share)'],
      ['US top 1% income share, 1928, 1975, 2024 (Piketty–Saez)', '23.9% · 8.9% · 22.4%', p(at(1928).top1) + ' · ' + p(at(1975).top1) + ' · ' + p(at(2024).top1)],
      ['Dollar share of reserves, 1999 Q4 and 2026 Q2 (IMF COFER)', '71.0% · 56.7%', p(at(1999).DS) + ' · ' + p(at(2026).DS)],
      ['US federal funds rate, monthly peak (June 1981)', '19.1%', p(Math.max(...ch.filter((r) => r.t >= 1978 && r.t <= 1986).map((r) => r.i))) + ' (model peak, 1978–86)'],
      ['US financial corporations’ share of profits, 1950 and 2002 (from BEA)', '8.8% · 38.1%', p(at(1950).finShare) + ' · ' + p(at(2002).finShare)],
      ['First World War begins', '1914', wars[0] ? String(wars[0].t) : 'not reached'],
      ['October Revolution', '1917', first('revolutionA')],
      ['Wall Street crash, depression', '1929', first('depression')],
      ['Second World War begins', '1939', wars[1] ? String(wars[1].t) : 'not reached'],
      ['Bretton Woods conference', '1944', first('brettonWoods')],
      ['People’s Republic of China', '1949', first('revolutionB')],
      ['Gold window closed', '1971', first('nixonShock')],
      ['Interest-rate shock and neoliberal turn', '1979–81', first('neoliberal')],
      ['Mexico cannot pay', '1982', first('debtCrisis')],
      ['USSR dissolved', '1991', first('collapseA')],
      ['China joins the WTO', '2001', first('rivalJoins')],
      ['Lehman Brothers fails', '2008', first('financialCrisis')],
      ['Brexit vote, Trump elected', '2016', first('nationalist')]
    ];
    const tb = $('calibBody'); tb.textContent = '';
    rows.forEach((r) => { const tr = el('tr', null, null, tb); el('td', null, r[0], tr); el('td', null, r[1], tr); el('td', null, r[2], tr); });
  }
  const SOURCE_GROUPS = [
    ['Marxist theory', ['capital_v1_25', 'capital_v3_13', 'capital_v3_30', 'engels1858', 'hilferding', 'luxemburg', 'bukharin', 'lenin_ch7', 'lenin_split', 'mao_classes', 'mao_contradiction', 'mao_ccp', 'mao_newdem', 'mao_foolish', 'mao_pdd', 'mao_kaunda', 'dimitrov', 'rim1984', 'rim1993']],
    ['Monopoly, finance, imperialism and dependency', ['baran_sweezy', 'magdoff_sweezy', 'foster2006', 'foster_mcchesney', 'emmanuel', 'amin', 'prebisch', 'nkrumah', 'hudson', 'arrighi', 'gowan', 'harvey2003', 'harvey2005', 'smith2016', 'patnaik2016', 'patnaik_drain', 'roy_drain', 'hickel2022', 'hickel2024', 'glyn_sutcliffe', 'agh', 'lewis1954', 'krippner', 'deloecker', 'basu']],
    ['Money, trade and politics', ['bw_fed', 'bw_wb', 'nixon_fed', 'nixon_state', 'bordo', 'gold_fred', 'oil_fed', 'petro_bloomberg', 'petro_politifact', 'volcker', 'fedfunds', 'latam', 'fdic', 'cofer', 'bis2025', 'russia_assets', 'setser', 'lehman', 'glick', 'fed2008', 'fed2023', 'fed2026', 'wto_china', 'adh2016', 'adhm2020', 'mutz', 'morgan', 'norris', 'eo14257', 'scotus2026', 'yale', 'miran']],
    ['Data series', ['bairoch', 'maddison', 'unsd_mva', 'labshare', 'epi', 'saez', 'bea', 'union_bls', 'union_crs', 'freeman', 'fairwear', 'bd_wage']],
    ['Mortality', ['ww1_brit', 'ww1_prost', 'ww1_ined', 'ww2_brit', 'ww2_wiki', 'ushmm', 'davis', 'ograda', 'ograda2019', 'bengal_fic', 'sullivan_hickel', 'roy2023', 'robinson', 'cribb', 'korea_brit', 'prio', 'hirschman', 'obermeyer', 'costs_of_war', 'ilo2023', 'rana_ilo', 'case_deaton', 'men2003', 'brainerd', 'stuckler', 'earle', 'sanctions2025', 'dyson', 'wpf']],
    ['Classic works behind model mechanisms (cited from memory; not checked in this session)', ['kalecki1943', 'fisher1933', 'minsky1986', 'triffin1960', 'goodwin1967', 'steindl1952', 'cynamon', 'allen', 'edward2006']]
  ];
  function buildSources() {
    const host = $('sources'); host.textContent = '';
    SOURCE_GROUPS.forEach(([title, keys]) => { el('h4', null, title, host); refList(keys, host); });
  }

  function boot(data) {
    data = data || {};
    if (data.seed) seed = data.seed;
    if (data.levers) levers = Object.assign({}, E.DEFAULT_LEVERS, data.levers);
    if (data.tab) tab = data.tab;
    $('seedIn').value = seed;
    buildTiles(); buildFeats(); buildContra(); buildTabs(); buildCharts(); buildLevers(); buildSources(); buildCalibration(); wire();
    startRun(null);
    if (data.t && data.t > latest().t) { model.runTo(Math.min(END, data.t)); renderAll(); }
  }
  const hot = (window.claude && window.claude.hot) || null;
  if (hot && typeof hot.snapshot === 'function') {
    try { hot.snapshot(() => ({ seed, levers, t: model ? model.state.t : START, tab })); } catch (err) { /* viewer hook unavailable */ }
  }
  if (hot && typeof hot.ready === 'function') hot.ready(boot);
  else boot(hot && hot.data ? hot.data : {});
})();
