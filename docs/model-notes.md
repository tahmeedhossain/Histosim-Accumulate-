# Model notes: calibration, anchors and sources

Seed 1917 with all ten levers at 50 reproduces the calibrated run described here.

## What the model is
- Annual stock-flow model, 1800–2026. Core of three capitalist powers (old power, challenger, rising power) plus zone A (Russia/USSR analogue), zone B (China analogue) and zone C (the colonised, later formally independent world). Each zone is one aggregate.
- No stage is scheduled: monopoly, finance capital, imperialism (Lenin's five features), wars, depression, fascism, Bretton Woods, profit squeeze, the dollar float, the neoliberal turn, the debt crisis, labour arbitrage, the financial crash, sanctions and the nationalist turn all fire when model variables cross stated thresholds. Some mechanisms are gated by calendar year (listed below), which pulls every run toward historical timing.
- Instruments: capacity against mass consumption, utilisation, reserve army, wage share, profit rate, rate of surplus value, monopoly and finance indices, drain by channel, manufacturing shares, output per head, dollar share, interest and inflation, class-power indices, repression, deaths.
- Levers (×0 to ×2): labour movement, organisation in the periphery, mass supervision of leaders (MLM restoration thesis), colonial extraction, labour aristocracy, repression, imperial intervention, antitrust, financial regulation, capital mobility.
- Ledger of lives: "attributable" deaths (war; famine and poverty under a counterfactual in which 40% of the retainable drain stays at home; repression; work; despair; transition; sanctions) against "total excess" deaths, which add chronic poverty measured against a population at 3.9 times bare subsistence (context only). Mortality inside socialist or restored zones is not computed.

## How the defaults relate to history
- Defaults: levers at 50, seed 1917, and fixed coefficients and thresholds tuned by hand so turning points land near historical dates. Nothing was estimated statistically, so the fit is by construction and is not evidence for the mechanisms.
- Changing levers or the seed moves events, reorders some and removes others. Eight seeds: depression 1923–1932, second war 1933–1941, neoliberal turn 1964–1983, financial crisis 1989–2010, nationalist turn 2009–2015; in two seeds the profit squeeze came before the dollar float and the financial crisis before zone B's rise.
- Lever examples (seed 1917): labour movement 80 gives a first war in 1927, no fascism and no second war; capital mobility 80 gives imperialism in 1898, wars in 1904 and 1928, a neoliberal turn in 1959 and a nationalist turn in 2004; financial regulation 80 means imperialism is never complete, one war (1943) and no neoliberal turn by 2026; colonial extraction 20 means imperialism is never complete, a war launched by a fascist power in 1941, and 170 M attributable deaths against 214 M.
- Fixed regardless of levers: the exogenous calendar paths (technical potential, population growth, proletarianisation, manufacturing share, relative growth of the three powers, health technology), Davis's drought years, and calendar switches in the code: the opium drain ends in 1912; household credit is limited before 1946; liberated zones in zone C form only after 1940; rivalry over colonies is damped after 1950 (no run has more than two world wars); the fallback route to decolonisation opens after 1950; proxy wars weaken from 1980; coups end after 1991; the nationalist turn cannot come before 1996; deindustrialisation feeds nationalism from 1991 and the rival's weight from 2006; sanctions start after 1990 (zone A at full weight from 2014, zone B from 2019); the rival exports capital from 2011; deaths of despair are counted from 1986; the stagnation route to a general crisis opens after 1925.

## Calibrated run: main dates (model, history in brackets)
Opening of zone B 1843 (1839–42) · peasant rebellion 1851 (Taiping, 1850) · imperialism complete 1908 · first war 1915 (1914) · revolution in zone A 1916 (1917) · depression 1931 (1929) · fascism 1934 · second war 1940 (1939) · Bretton Woods and compromise 1945 (1944) · revolution in zone B 1948 (1949) · restoration in zone A 1956 (RIM: 1956) · dollar leaves gold 1970 (1971) · profit squeeze 1972 · restoration in zone B 1976 (RIM: 1976) · neoliberal turn 1981 (1979–81) · debt crisis 1982 (1982) · labour arbitrage 1992 · collapse of zone A's bloc 1993 (1991) · zone B becomes a rival 2002 (WTO, 2001) · financial crisis 2009 (2008) · nationalist turn 2014 (2016) · monopoly-finance capital 2019.

## Calibration levels (data against model)
- Developed countries' share of world manufacturing, 1913: 92.5% (Bairoch) against 93.7%. China, 1830 and 1900: 29.8% and 6.2% against 26.3% and 4.8%.
- GDP per head, Western Europe, 1913 and 1998: $3,473 and $17,921 (Maddison) against $2,873 and $21,290 for the core. Africa: $585 and $1,368 against $556 and $1,538 for zone C.
- Famine deaths, 1876–79 and 1896–1902: 31.7–61.3 M (Davis) against 49.6 M.
- First World War: 8.5–10 M soldiers plus civilians (up to about 13 M) against 17.5 M. Second World War: 40–50 M, or 60–75 M with famine and disease, against 56.9 M plus 14.2 M fascist terror.
- US labour share, 1960 and 2026: 66.2% and 52.8% against a core wage share of 68.0% and 50.9%.
- US top 1% income share (Piketty–Saez), 1928, 1975 and 2024: 23.9%, 8.9% and 22.4% against 14.7%, 8.0% and 24.5%.
- Dollar share of allocated reserves, 1999 and 2026: about 71% and 56.7% against 71.7% and 58.0%. Federal funds rate peak 19.1% (June 1981) against 17.2%.
- Finance share of profits, 1950 and 2002: 8.8% and 38.1% against 15.8% and 30.3%.
- Totals to 2026: 214 M attributable deaths (war 112, famine 27, poverty 32, repression 20.5, work 12.9, despair 5.5, transition 2.9, sanctions 1.3) and 2,074 M total excess deaths including the poverty benchmark.

## Known misses
Nineteenth-century slumps are too deep (the reserve army includes underemployment); unemployment runs at 12–16% after 2009 and around 2021; the finance share of profits is too high in 1950 and dips under zero interest rates; core output per head is low in 1913; restoration dates follow the MLM periodisation and cannot be tested in the model.

## Checked anchors (October 2026)
- Lenin, Imperialism, ch. VII (the five features): https://www.marxists.org/archive/lenin/works/1916/imp-hsc/ch07.htm
- Bairoch's shares, via Clingingsmith & Williamson: https://www.lse.ac.uk/Economic-History/Assets/Documents/Research/GEHN/GEHNConferences/conf7/Conf7-Williamson.pdf
- Maddison (2001), Table 3-1b: https://docenti-deps.unisi.it/sergiocesaratto/wp-content/uploads/sites/26/2020/09/Maddison.pdf
- Davis, Late Victorian Holocausts, Table P1 (31.7–61.3 M): https://www.versobooks.com/products/1719-late-victorian-holocausts
- Ó Gráda (2007): Bengal about 2.1 M consensus; USSR 1932–33, 4–6 M in archival estimates; China 1959–61, 15–43 M: https://researchrepository.ucd.ie/rest/bitstreams/1368/retrieve
- Sullivan & Hickel (2023): India 50 M or 165 M depending on the baseline: https://ddd.uab.cat/pub/artpub/2023/319e76b138b3/Capitalism_and_extreme_poverty.pdf
- Hickel et al. (2022): drain of $10.8 trillion in 2015: https://researchonline.lse.ac.uk/id/eprint/113823/1/1_s2.0_S095937802200005X_main_1_.pdf
- BLS, labour share 52.8% in 2026 Q2: https://www.bls.gov/opub/ted/2026/labor-share-at-its-lowest-level-52-8-percent-in-second-quarter-2026.htm
- EPI, productivity–pay gap (93.7% against 32.7%, 1979q4–2026q2): https://epi.org/productivity-pay-gap/
- IMF COFER (56.70% in 2026 Q2): https://data.imf.org/en/news/imf%20data%20brief%20september%2030
- BIS (2025): the dollar on one side of 89.2% of FX trades: https://www.bis.org/statistics/rpfx25_fx.htm
- Nixon shock and the US gold stock: https://www.federalreservehistory.org/essays/gold-convertibility-ends and https://fred.stlouisfed.org/graph/fredgraph.csv?id=M1476CUSM144NNBR
- Volcker and Mexico 1982: https://www.federalreservehistory.org/essays/recession-of-1981-82 and https://www.fdic.gov/resources/publications/history-eighties/volume-1/history-80s-volume-1-part2-05.pdf
- Autor et al. (2020); Mutz (2018); Morgan (2018): https://www.aeaweb.org/doi/10.1257/aer.20170011 , https://pmc.ncbi.nlm.nih.gov/articles/PMC5948965 and https://journals.sagepub.com/doi/full/10.1177/2378023118788217
- Yale Budget Lab tariffs (11.0% statutory, August 2026): https://budgetlab.yale.edu/research/state-us-tariffs ; Supreme Court IEEPA ruling, 20 February 2026: https://www.supremecourt.gov/opinions/25pdf/607us2r12_8nj9.pdf
- RIM (1984, 1993) on restoration: https://www.bannedthought.net/International/RIM/Docs/RIM-Declaration-1984-A.pdf and https://www.bannedthought.net/International/RIM/AWTW/1995-20/ll_mlm_20_eng.htm
- Sanctions mortality (about 564,000 a year, single study): https://cepr.net/publications/effects-of-international-sanctions-on-age-specific-mortality/

The page's own notes carry the complete reference list.

## Cited from memory, not checked
Kalecki 1943; Fisher 1933; Minsky 1986; Triffin 1960; Goodwin 1967; Steindl 1952; Cynamon & Fazzari 2016; Allen 2001 and 2017; Edward 2006 (ethical poverty line).
