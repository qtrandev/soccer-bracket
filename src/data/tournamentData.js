// 2026 FIFA World Cup – 48 teams, 12 groups
// Flag images via https://flagcdn.com/w40/{iso2}.png

export const TEAMS = {
  // Group A
  MEX: { name: 'Mexico',       iso2: 'mx', conf: 'CONCACAF' },
  KOR: { name: 'South Korea',  iso2: 'kr', conf: 'AFC' },
  CZE: { name: 'Czechia',      iso2: 'cz', conf: 'UEFA' },
  RSA: { name: 'South Africa', iso2: 'za', conf: 'CAF' },
  // Group B
  CAN: { name: 'Canada',       iso2: 'ca', conf: 'CONCACAF' },
  SUI: { name: 'Switzerland',  iso2: 'ch', conf: 'UEFA' },
  BIH: { name: 'Bosnia & Herz.',iso2:'ba', conf: 'UEFA' },
  QAT: { name: 'Qatar',        iso2: 'qa', conf: 'AFC' },
  // Group C
  BRA: { name: 'Brazil',       iso2: 'br', conf: 'CONMEBOL' },
  MAR: { name: 'Morocco',      iso2: 'ma', conf: 'CAF' },
  SCO: { name: 'Scotland',     iso2: 'gb-sct', conf: 'UEFA' },
  HAI: { name: 'Haiti',        iso2: 'ht', conf: 'CONCACAF' },
  // Group D
  USA: { name: 'USA',          iso2: 'us', conf: 'CONCACAF' },
  TUR: { name: 'Turkey',       iso2: 'tr', conf: 'UEFA' },
  AUS: { name: 'Australia',    iso2: 'au', conf: 'AFC' },
  PAR: { name: 'Paraguay',     iso2: 'py', conf: 'CONMEBOL' },
  // Group E
  GER: { name: 'Germany',      iso2: 'de', conf: 'UEFA' },
  ECU: { name: 'Ecuador',      iso2: 'ec', conf: 'CONMEBOL' },
  CIV: { name: "Côte d'Ivoire",iso2: 'ci', conf: 'CAF' },
  CUW: { name: 'Curaçao',      iso2: 'cw', conf: 'CONCACAF' },
  // Group F
  NED: { name: 'Netherlands',  iso2: 'nl', conf: 'UEFA' },
  JPN: { name: 'Japan',        iso2: 'jp', conf: 'AFC' },
  SWE: { name: 'Sweden',       iso2: 'se', conf: 'UEFA' },
  TUN: { name: 'Tunisia',      iso2: 'tn', conf: 'CAF' },
  // Group G
  BEL: { name: 'Belgium',      iso2: 'be', conf: 'UEFA' },
  IRN: { name: 'Iran',         iso2: 'ir', conf: 'AFC' },
  EGY: { name: 'Egypt',        iso2: 'eg', conf: 'CAF' },
  NZL: { name: 'New Zealand',  iso2: 'nz', conf: 'OFC' },
  // Group H
  ESP: { name: 'Spain',        iso2: 'es', conf: 'UEFA' },
  URU: { name: 'Uruguay',      iso2: 'uy', conf: 'CONMEBOL' },
  KSA: { name: 'Saudi Arabia', iso2: 'sa', conf: 'AFC' },
  CPV: { name: 'Cape Verde',   iso2: 'cv', conf: 'CAF' },
  // Group I
  FRA: { name: 'France',       iso2: 'fr', conf: 'UEFA' },
  SEN: { name: 'Senegal',      iso2: 'sn', conf: 'CAF' },
  NOR: { name: 'Norway',       iso2: 'no', conf: 'UEFA' },
  IRQ: { name: 'Iraq',         iso2: 'iq', conf: 'AFC' },
  // Group J
  ARG: { name: 'Argentina',    iso2: 'ar', conf: 'CONMEBOL' },
  AUT: { name: 'Austria',      iso2: 'at', conf: 'UEFA' },
  ALG: { name: 'Algeria',      iso2: 'dz', conf: 'CAF' },
  JOR: { name: 'Jordan',       iso2: 'jo', conf: 'AFC' },
  // Group K
  POR: { name: 'Portugal',     iso2: 'pt', conf: 'UEFA' },
  COL: { name: 'Colombia',     iso2: 'co', conf: 'CONMEBOL' },
  COD: { name: 'DR Congo',     iso2: 'cd', conf: 'CAF' },
  UZB: { name: 'Uzbekistan',   iso2: 'uz', conf: 'AFC' },
  // Group L
  ENG: { name: 'England',      iso2: 'gb-eng', conf: 'UEFA' },
  CRO: { name: 'Croatia',      iso2: 'hr', conf: 'UEFA' },
  GHA: { name: 'Ghana',        iso2: 'gh', conf: 'CAF' },
  PAN: { name: 'Panama',       iso2: 'pa', conf: 'CONCACAF' },
};

export const GROUPS = {
  A: { teams: ['MEX', 'KOR', 'CZE', 'RSA'] },
  B: { teams: ['CAN', 'SUI', 'BIH', 'QAT'] },
  C: { teams: ['BRA', 'MAR', 'SCO', 'HAI'] },
  D: { teams: ['USA', 'TUR', 'AUS', 'PAR'] },
  E: { teams: ['GER', 'ECU', 'CIV', 'CUW'] },
  F: { teams: ['NED', 'JPN', 'SWE', 'TUN'] },
  G: { teams: ['BEL', 'IRN', 'EGY', 'NZL'] },
  H: { teams: ['ESP', 'URU', 'KSA', 'CPV'] },
  I: { teams: ['FRA', 'SEN', 'NOR', 'IRQ'] },
  J: { teams: ['ARG', 'AUT', 'ALG', 'JOR'] },
  K: { teams: ['POR', 'COL', 'COD', 'UZB'] },
  L: { teams: ['ENG', 'CRO', 'GHA', 'PAN'] },
};

export const GROUP_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

export const VENUES = {
  'MetLife':      { name: 'MetLife Stadium',      city: 'New York / NJ', tz: 'America/New_York',    country: 'USA' },
  'ATT':          { name: 'AT&T Stadium',          city: 'Dallas, TX',    tz: 'America/Chicago',     country: 'USA' },
  'Mercedes':     { name: 'Mercedes-Benz Stadium', city: 'Atlanta, GA',   tz: 'America/New_York',    country: 'USA' },
  'SoFi':         { name: 'SoFi Stadium',          city: 'Los Angeles, CA',tz: 'America/Los_Angeles', country: 'USA' },
  'Lumen':        { name: 'Lumen Field',           city: 'Seattle, WA',   tz: 'America/Los_Angeles', country: 'USA' },
  'Gillette':     { name: 'Gillette Stadium',      city: 'Boston, MA',    tz: 'America/New_York',    country: 'USA' },
  'NRG':          { name: 'NRG Stadium',           city: 'Houston, TX',   tz: 'America/Chicago',     country: 'USA' },
  'Arrowhead':    { name: 'Arrowhead Stadium',     city: 'Kansas City, MO',tz: 'America/Chicago',    country: 'USA' },
  'HardRock':     { name: 'Hard Rock Stadium',     city: 'Miami, FL',     tz: 'America/New_York',    country: 'USA' },
  'Lincoln':      { name: 'Lincoln Financial Field',city: 'Philadelphia, PA',tz:'America/New_York',  country: 'USA' },
  'Levis':        { name: "Levi's Stadium",        city: 'San Francisco, CA',tz:'America/Los_Angeles',country:'USA'},
  'Azteca':       { name: 'Estadio Azteca',        city: 'Mexico City',   tz: 'America/Mexico_City', country: 'Mexico' },
  'Akron':        { name: 'Estadio Akron',         city: 'Guadalajara',   tz: 'America/Mexico_City', country: 'Mexico' },
  'BBVA':         { name: 'Estadio BBVA',          city: 'Monterrey',     tz: 'America/Monterrey',   country: 'Mexico' },
  'BMO':          { name: 'BMO Field',             city: 'Toronto',       tz: 'America/Toronto',     country: 'Canada' },
  'BCPlace':      { name: 'BC Place',              city: 'Vancouver',     tz: 'America/Vancouver',   country: 'Canada' },
};

// Knockout-round venue assignments (approximate – Final at MetLife)
export const KNOCKOUT_VENUES = {
  r32: ['MetLife', 'ATT', 'Mercedes', 'SoFi', 'Lumen', 'Gillette', 'NRG', 'Arrowhead',
        'HardRock', 'Lincoln', 'Levis', 'Azteca', 'BBVA', 'Akron', 'BMO', 'BCPlace'],
  r16: ['MetLife', 'ATT', 'Mercedes', 'SoFi', 'Lumen', 'Gillette', 'NRG', 'Arrowhead'],
  qf:  ['MetLife', 'ATT', 'SoFi', 'Lumen'],
  sf:  ['MetLife', 'ATT'],
  final: ['MetLife'],
};

// Round of 32 bracket – slot codes reference group positions: A1 = group A winner, etc.
// Third-place wildcards: 3rd-1 through 3rd-8 (best 8 of 12 third-place teams)
export const R32_MATCHES = [
  // Left side of bracket
  { id: 'r32-1',  slot1: 'A1', slot2: 'B2', venue: 'Azteca',    date: '2026-06-28', time: '15:00' },
  { id: 'r32-2',  slot1: 'C1', slot2: 'D2', venue: 'MetLife',   date: '2026-06-28', time: '19:00' },
  { id: 'r32-3',  slot1: 'B1', slot2: 'A2', venue: 'SoFi',      date: '2026-06-29', time: '15:00' },
  { id: 'r32-4',  slot1: 'D1', slot2: 'C2', venue: 'ATT',       date: '2026-06-29', time: '19:00' },
  { id: 'r32-5',  slot1: 'E1', slot2: 'F2', venue: 'Mercedes',  date: '2026-06-30', time: '15:00' },
  { id: 'r32-6',  slot1: 'G1', slot2: 'H2', venue: 'Lumen',     date: '2026-06-30', time: '19:00' },
  { id: 'r32-7',  slot1: 'F1', slot2: 'E2', venue: 'Arrowhead', date: '2026-07-01', time: '15:00' },
  { id: 'r32-8',  slot1: 'H1', slot2: 'G2', venue: 'NRG',       date: '2026-07-01', time: '19:00' },
  // Right side of bracket
  { id: 'r32-9',  slot1: 'I1', slot2: 'J2', venue: 'Gillette',  date: '2026-07-02', time: '15:00' },
  { id: 'r32-10', slot1: 'K1', slot2: 'L2', venue: 'Lincoln',   date: '2026-07-02', time: '19:00' },
  { id: 'r32-11', slot1: 'J1', slot2: 'I2', venue: 'HardRock',  date: '2026-07-03', time: '15:00' },
  { id: 'r32-12', slot1: 'L1', slot2: 'K2', venue: 'Levis',     date: '2026-07-03', time: '19:00' },
  // Wildcard section (best 8 third-place teams)
  { id: 'r32-13', slot1: '3W1', slot2: '3W2', venue: 'BBVA',    date: '2026-07-04', time: '15:00' },
  { id: 'r32-14', slot1: '3W3', slot2: '3W4', venue: 'Akron',   date: '2026-07-04', time: '19:00' },
  { id: 'r32-15', slot1: '3W5', slot2: '3W6', venue: 'BMO',     date: '2026-07-05', time: '15:00' },
  { id: 'r32-16', slot1: '3W7', slot2: '3W8', venue: 'BCPlace',  date: '2026-07-05', time: '19:00' },
];

// R32 → R16 path: pairs of r32 match IDs that feed one R16 match
export const R16_MATCHES = [
  { id: 'r16-1', src: ['r32-1', 'r32-2'], venue: 'MetLife',   date: '2026-07-06', time: '15:00' },
  { id: 'r16-2', src: ['r32-3', 'r32-4'], venue: 'ATT',       date: '2026-07-06', time: '19:00' },
  { id: 'r16-3', src: ['r32-5', 'r32-6'], venue: 'SoFi',      date: '2026-07-07', time: '15:00' },
  { id: 'r16-4', src: ['r32-7', 'r32-8'], venue: 'Mercedes',  date: '2026-07-07', time: '19:00' },
  { id: 'r16-5', src: ['r32-9',  'r32-10'], venue: 'Lumen',   date: '2026-07-08', time: '15:00' },
  { id: 'r16-6', src: ['r32-11', 'r32-12'], venue: 'Gillette',date: '2026-07-08', time: '19:00' },
  { id: 'r16-7', src: ['r32-13', 'r32-14'], venue: 'NRG',     date: '2026-07-09', time: '15:00' },
  { id: 'r16-8', src: ['r32-15', 'r32-16'], venue: 'Arrowhead',date: '2026-07-09',time: '19:00' },
];

export const QF_MATCHES = [
  { id: 'qf-1', src: ['r16-1', 'r16-2'], venue: 'MetLife',  date: '2026-07-11', time: '15:00' },
  { id: 'qf-2', src: ['r16-3', 'r16-4'], venue: 'ATT',      date: '2026-07-11', time: '19:00' },
  { id: 'qf-3', src: ['r16-5', 'r16-6'], venue: 'SoFi',     date: '2026-07-12', time: '15:00' },
  { id: 'qf-4', src: ['r16-7', 'r16-8'], venue: 'Lumen',    date: '2026-07-12', time: '19:00' },
];

export const SF_MATCHES = [
  { id: 'sf-1', src: ['qf-1', 'qf-2'], venue: 'MetLife', date: '2026-07-14', time: '19:00' },
  { id: 'sf-2', src: ['qf-3', 'qf-4'], venue: 'ATT',     date: '2026-07-15', time: '19:00' },
];

export const FINAL_MATCH = {
  id: 'final', src: ['sf-1', 'sf-2'], venue: 'MetLife', date: '2026-07-19', time: '15:00',
};

export const ROUND_LABELS = {
  r32: 'Round of 32',
  r16: 'Round of 16',
  qf:  'Quarterfinals',
  sf:  'Semifinals',
  final: 'Final',
};

export const ALL_ROUNDS = ['r32', 'r16', 'qf', 'sf', 'final'];
