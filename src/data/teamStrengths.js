// Strength ratings 1–100 for 2026 World Cup predictions (France = 100, top of scale)
// 5-source synthesis: Kalshi/Polymarket win probabilities ($1.5B volume, Jun 2026),
// The Score, The Ringer, Bleacher Report power rankings, FIFA world rankings (Jun 11 2026)
export const STRENGTHS = {
  // Tier 1 – Trophy contenders
  // Kalshi win prob: FRA 16.1%, ESP 16.5%, POR 11.7%, ENG 10.7%, ARG 8.9%, BRA 7.8%
  FRA: 100, // Kalshi co-fav 16.1%, FIFA #3, Score #1, Ringer #2
  ESP: 99,  // Kalshi co-fav 16.5%, FIFA #2, Score #2, Ringer #1 — Euro 2024 holders
  POR: 94,  // Kalshi 11.7% — well clear of England; deep squad post-Ronaldo
  ENG: 93,  // Kalshi 10.7%, FIFA #4 — Bellingham/Foden golden generation
  ARG: 91,  // Kalshi 8.9%, FIFA #1 — reigning champions, still deep
  BRA: 86,  // Kalshi 7.8%, FIFA #6 — INJURY: Rodrygo (ACL), Estevao, Wesley out; Neymar doubtful; drew Morocco 1-1
  NED: 81,  // Kalshi 5.2%, FIFA #8 — INJURY: Simons (ACL), De Ligt (back), Timber (groin) all out
  GER: 85,  // Kalshi 5.1%, FIFA #10 — Wirtz/Musiala era, Score #7

  // Tier 2 – Dark horses / quarter-final threats
  // Kalshi: NOR 2.6%, MAR 2.3%, USA 2.2%, BEL 2.0%
  NOR: 80,  // Kalshi 2.6% (9th!), Score #9, Ringer #12 — Haaland + Ødegaard
  MAR: 81,  // Kalshi 2.3%, FIFA #7 — drew Brazil 1-1 in group opener; confirmed elite
  USA: 79,  // Kalshi 2.2%, 4-1 demolition of Paraguay; dominant on home soil
  BEL: 73,  // Kalshi 2.0%, Score #12, Ringer #11 — last hurrah of golden gen
  COL: 71,  // Kalshi 1.7%, FIFA #13, Score #11 — strong qualifying run
  JPN: 64,  // Kalshi 1.6%, Score #16 — INJURY: Mitoma (hamstring) and Minamino (ACL) both out
  MEX: 68,  // Kalshi 1.4%, FIFA #14 — CONCACAF home advantage, Score #23
  SUI: 63,  // Kalshi 0.95%, Score #20 — drew Qatar 1-1 in opener, below expectations

  // Tier 3 – Round-of-16 contenders
  // Kalshi: TUR 0.86%, URU 0.86%, CRO 0.85%, ECU 0.76%, SEN 0.65%
  TUR: 65,  // Kalshi 0.86%, Score #18, Ringer #18 — strong Euro 2024 run
  URU: 64,  // Kalshi 0.86%, Score #17, Ringer #16 — aging but still dangerous
  CRO: 63,  // Kalshi 0.85% — same odds tier as TUR/URU; was overrated, now corrected
  ECU: 62,  // Kalshi 0.76%, Ringer #9 (!), Score #15 — dangerous CONMEBOL side
  SEN: 59,  // Kalshi 0.65%, Score #13 — strong squad but limited ceiling

  // Tier 4 – Group-stage dark horses
  // Kalshi: KOR/AUT/CIV all ~0.35%, CAN/SCO ~0.25%
  CIV: 52,  // Kalshi 0.35%, Score #19, Ringer #22 — 2024 AFCON champions
  AUT: 51,  // Kalshi 0.35%, Score #24, Ringer #23 — rising European side
  KOR: 52,  // Kalshi 0.36%, Score #27 — beat Czechia 2-1 in opener, slightly above expectations
  CAN: 44,  // Kalshi 0.25%, Score #25 — INJURY: Davies doubtful; drew Bosnia 1-1 in opener
  SCO: 47,  // Kalshi 0.25%, Score #26, Ringer #27 — competitive ceiling is low
  PAR: 44,  // Score #28, Ringer #21 — inconsistent CONMEBOL qualifier
  ALG: 43,  // FIFA #28, Ringer #24, NBC #26 — stronger than low rankings suggest
  EGY: 42,  // Score #31, Ringer #34 — Salah-era window closing
  SWE: 41,  // Score #21, Ringer #28 — post-Ibrahimović decline
  CZE: 40,  // Score #32, Ringer #26 — limited upside, no sources rate them highly

  // Tier 5 – Group-stage survivors / making up the numbers
  IRN: 39,  // FIFA #20 but consistently score #33, ranked far below FIFA rating
  AUS: 37,  // Score #34, Ringer #30 — Socceroos aging
  BIH: 36,  // Score #35, Ringer #33 — ceiling is a group-stage exit
  COD: 35,  // Score #36, Ringer #31 — DR Congo improving
  GHA: 34,  // Score #29, Ringer #35 — inconsistent
  PAN: 33,  // Score #37, Ringer #36 — overrated for WC contexts
  TUN: 32,  // Score #38, Ringer #37
  UZB: 31,  // Score #39, Ringer #39
  NZL: 30,  // Score #40, Ringer #44 — Oceania quality gap
  KSA: 29,  // Score #41, Ringer #38 — 2022 flash in the pan
  RSA: 28,  // Score #42, Ringer #42 — hosts of 2010, struggling now
  JOR: 27,  // Score #44, Ringer #40 — AFC qualifier
  CPV: 26,  // Score #46, Ringer #41 — Cabo Verde punching above weight
  QAT: 25,  // Score #47, Ringer #47 — 2022 hosts went out in group stage
  HAI: 24,  // Score #45, Ringer #43
  IRQ: 23,  // Score #43, Ringer #45 — FIFA #57
  CUW: 22,  // Score #48, Ringer #46 — lowest rated, small island nation
};

// Rank 1–48 derived from STRENGTHS (highest strength = #1)
export const STRENGTH_RANKS = Object.fromEntries(
  Object.entries(STRENGTHS)
    .sort(([, a], [, b]) => b - a)
    .map(([code], i) => [code, i + 1])
);

// Official FIFA/Coca-Cola Men's World Ranking — June 11, 2026 (published day of WC kickoff)
// Note: ranks are global positions, not 1–48, so gaps exist where non-WC teams sit
export const FIFA_RANKINGS = {
  ARG: 1,  ESP: 2,  FRA: 3,  ENG: 4,  POR: 5,
  BRA: 6,  MAR: 7,  NED: 8,  BEL: 9,  GER: 10,
  CRO: 11, COL: 13, MEX: 14, SEN: 15, URU: 16,
  USA: 17, JPN: 18, SUI: 19, IRN: 20, TUR: 22,
  ECU: 23, AUT: 24, KOR: 25, AUS: 27, ALG: 28,
  EGY: 29, CAN: 30, NOR: 31, CIV: 33, PAN: 34,
  SWE: 38, CZE: 40, PAR: 41, SCO: 42, TUN: 45,
  COD: 46, UZB: 50, QAT: 56, IRQ: 57, RSA: 60,
  KSA: 61, JOR: 63, BIH: 64, CPV: 67, GHA: 73,
  CUW: 82, HAI: 83, NZL: 85,
};

// Per-strategy strength modifiers (added on top of base STRENGTHS)
export const STRATEGY_BOOSTS = {
  favorites: {},
  southamerica: {
    ARG: 12, BRA: 12, URU: 12, COL: 12, ECU: 12, PAR: 12,
  },
  europe: {
    // England gets the biggest boost — "European Giants" narrative is their moment
    ENG: 15, GER: 12,
    FRA: 8, ESP: 10, POR: 10, NED: 10,
    BEL: 10, CRO: 8, SUI: 8, NOR: 10, SWE: 8, AUT: 8,
    CZE: 8, BIH: 8, TUR: 8, SCO: 8,
  },
  hosts: {
    // Boosted enough that a host can actually win on home soil
    USA: 22, MEX: 22, CAN: 22,
  },
  chaos: {}, // handled separately with randomness
};

export const MAX_STRENGTH = Math.max(...Object.values(STRENGTHS)); // 93 (France)

export function getStrength(teamCode, strategy) {
  if (strategy === 'chaos') return Math.random() * 100;
  const base = STRENGTHS[teamCode] ?? 50;
  const boost = (STRATEGY_BOOSTS[strategy] ?? {})[teamCode] ?? 0;
  return Math.min(100, base + boost);
}
