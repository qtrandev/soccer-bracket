// Strength ratings 0–100 for 2026 World Cup predictions
// Based on: FIFA rankings, betting odds, squad quality, recent results
// Sources: FIFA.com rankings (early 2026), tournament odds aggregates

export const STRENGTHS = {
  // Tier 1 – Championship contenders
  FRA: 93, // Mbappé generation at peak — actual 2026 betting favorite
  ENG: 90, // Golden generation finally delivering
  ARG: 88, // Defending champions — transitional era as Messi winds down
  BRA: 87, // Back to form after 2022 disappointment
  POR: 85, // Ronaldo era transitioning, deep squad
  ESP: 84, // Dominant tiki-taka revival
  GER: 83, // Post-rebuild, hungry again
  NED: 82, // Van Dijk/Gakpo era
  BEL: 80, // Red Devils' last hurrah

  // Tier 3 – Dark horses / round-of-8 threats
  URU: 77, // Always dangerous, disciplined
  JPN: 75, // Bundesliga exports, tactical masterclass
  CRO: 72, // 2018 finalists, battle-hardened
  USA: 74, // Significant improvement — strong 2026 qualifying run
  CAN: 71, // 2022 debut improved, home-continent edge
  MEX: 70, // CONCACAF hosts, crowd advantage
  SUI: 70, // Consistent underperformers who keep advancing

  // Tier 4 – Round-of-16 contenders
  KOR: 68,
  TUR: 67,
  NOR: 66, // Haaland factor
  SWE: 65,
  AUS: 65,
  COL: 65,
  MAR: 64, // 2022 semifinalists, experienced now
  CZE: 63,
  SEN: 63,
  ECU: 62,
  AUT: 62,
  CIV: 60, // Talented but inconsistent
  SCO: 60,

  // Tier 5 – Group-stage survivors / upset potential
  ALG: 58,
  TUN: 58,
  GHA: 57,
  EGY: 56,
  IRN: 55,
  BIH: 55,
  PAR: 55,
  COD: 53,
  PAN: 53,
  KSA: 52,
  IRQ: 52,
  QAT: 50,
  RSA: 50,
  CPV: 50,
  UZB: 50,
  JOR: 48,
  NZL: 48,
  HAI: 42,
  CUW: 40,
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
  return base + boost;
}
