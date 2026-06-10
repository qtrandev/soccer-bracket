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
