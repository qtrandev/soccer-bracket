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
  TUR: { name: 'Türkiye',      iso2: 'tr', conf: 'UEFA' },
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
  CPV: { name: 'Cabo Verde',   iso2: 'cv', conf: 'CAF' },
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

// Official FIFA World Cup 2026 knockout structure (match numbers 73–104)
// Slot codes: 'A1' = Group A winner, 'A2' = Group A runner-up,
//             '3RD' = third-placed team; which group's third fills each slot
//             is resolved at runtime via resolveThirdPlaceSlots() (Annex C).
//
// Arrays are in BRACKET DISPLAY ORDER (not match-number order) so the existing
// left/right slicing in KnockoutBracket.jsx keeps working:
//   r32[0..7] = left half, r32[8..15] = right half
//   r16[i] = winners of r32[2i] and r32[2i+1]; same pattern up the rounds.
//
// Official round windows (per FIFA match schedule):
//   R32: Jun 28 – Jul 3 · R16: Jul 4 – 7 · QF: Jul 9 – 11
//   SF: Jul 14 (Dallas/AT&T) & Jul 15 (Atlanta/Mercedes-Benz) · Final: Jul 19 (MetLife)
export const R32_MATCHES = [
  // ---- Left half ----
  { id: 'm74', slot1: 'E1', slot2: '3RD', venue: 'Gillette',  date: '2026-06-29', time: '16:30' },
  { id: 'm77', slot1: 'I1', slot2: '3RD', venue: 'MetLife',   date: '2026-06-30', time: '17:00' },
  { id: 'm73', slot1: 'A2', slot2: 'B2',  venue: 'SoFi',      date: '2026-06-28', time: '15:00' },
  { id: 'm75', slot1: 'F1', slot2: 'C2',  venue: 'BBVA',      date: '2026-06-29', time: '21:00' },
  { id: 'm83', slot1: 'K2', slot2: 'L2',  venue: 'BMO',       date: '2026-07-02', time: '19:00' },
  { id: 'm84', slot1: 'H1', slot2: 'J2',  venue: 'SoFi',      date: '2026-07-02', time: '15:00' },
  { id: 'm81', slot1: 'D1', slot2: '3RD', venue: 'Levis',     date: '2026-07-01', time: '20:00' },
  { id: 'm82', slot1: 'G1', slot2: '3RD', venue: 'Lumen',     date: '2026-07-01', time: '16:00' },
  // ---- Right half ----
  { id: 'm76', slot1: 'C1', slot2: 'F2',  venue: 'NRG',       date: '2026-06-29', time: '13:00' },
  { id: 'm78', slot1: 'E2', slot2: 'I2',  venue: 'ATT',       date: '2026-06-30', time: '13:00' },
  { id: 'm79', slot1: 'A1', slot2: '3RD', venue: 'Azteca',    date: '2026-06-30', time: '21:00' },
  { id: 'm80', slot1: 'L1', slot2: '3RD', venue: 'Mercedes',  date: '2026-07-01', time: '12:00' },
  { id: 'm86', slot1: 'J1', slot2: 'H2',  venue: 'HardRock',  date: '2026-07-03', time: '18:00' },
  { id: 'm88', slot1: 'D2', slot2: 'G2',  venue: 'ATT',       date: '2026-07-03', time: '14:00' },
  { id: 'm85', slot1: 'B1', slot2: '3RD', venue: 'BCPlace',   date: '2026-07-02', time: '23:00' },
  { id: 'm87', slot1: 'K1', slot2: '3RD', venue: 'Arrowhead', date: '2026-07-03', time: '21:30' },
];

// R16 feeds — sequential display pairing (r16[i] = winners of r32[2i], r32[2i+1])
export const R16_MATCHES = [
  { id: 'm89', src: ['m74', 'm77'], venue: 'Lincoln',  date: '2026-07-04', time: '17:00' },
  { id: 'm90', src: ['m73', 'm75'], venue: 'NRG',      date: '2026-07-04', time: '13:00' },
  { id: 'm93', src: ['m83', 'm84'], venue: 'ATT',      date: '2026-07-06', time: '15:00' },
  { id: 'm94', src: ['m81', 'm82'], venue: 'Lumen',    date: '2026-07-06', time: '20:00' },
  { id: 'm91', src: ['m76', 'm78'], venue: 'MetLife',  date: '2026-07-05', time: '16:00' },
  { id: 'm92', src: ['m79', 'm80'], venue: 'Azteca',   date: '2026-07-05', time: '20:00' },
  { id: 'm95', src: ['m86', 'm88'], venue: 'Mercedes', date: '2026-07-07', time: '12:00' },
  { id: 'm96', src: ['m85', 'm87'], venue: 'BCPlace',  date: '2026-07-07', time: '16:00' },
];

export const QF_MATCHES = [
  { id: 'm97',  src: ['m89', 'm90'], venue: 'Gillette',  date: '2026-07-09', time: '16:00' },
  { id: 'm98',  src: ['m93', 'm94'], venue: 'SoFi',      date: '2026-07-10', time: '15:00' },
  { id: 'm99',  src: ['m91', 'm92'], venue: 'HardRock',  date: '2026-07-11', time: '17:00' },
  { id: 'm100', src: ['m95', 'm96'], venue: 'Arrowhead', date: '2026-07-11', time: '21:00' },
];

export const SF_MATCHES = [
  { id: 'm101', src: ['m97', 'm98'],  venue: 'ATT',      date: '2026-07-14', time: '15:00' },
  { id: 'm102', src: ['m99', 'm100'], venue: 'Mercedes', date: '2026-07-15', time: '15:00' },
];

export const FINAL_MATCH = {
  id: 'm104', src: ['m101', 'm102'], venue: 'MetLife', date: '2026-07-19', time: '15:00',
};

// All 72 group stage matches. Times stored in EDT (UTC-4).
// Arrays are sorted chronologically within each group; every pair of two is one matchday.
export const GROUP_MATCHES = {
  A: [
    { id: 'm1',  home: 'MEX', away: 'RSA', venue: 'Azteca',   date: '2026-06-11', time: '15:00' },
    { id: 'm2',  home: 'KOR', away: 'CZE', venue: 'Akron',    date: '2026-06-11', time: '22:00' },
    { id: 'm25', home: 'CZE', away: 'RSA', venue: 'Mercedes', date: '2026-06-18', time: '12:00' },
    { id: 'm28', home: 'MEX', away: 'KOR', venue: 'Akron',    date: '2026-06-18', time: '21:00' },
    { id: 'm53', home: 'CZE', away: 'MEX', venue: 'Azteca',   date: '2026-06-24', time: '21:00' },
    { id: 'm54', home: 'RSA', away: 'KOR', venue: 'BBVA',     date: '2026-06-24', time: '21:00' },
  ],
  B: [
    { id: 'm3',  home: 'CAN', away: 'BIH', venue: 'BMO',      date: '2026-06-12', time: '15:00' },
    { id: 'm8',  home: 'QAT', away: 'SUI', venue: 'Levis',    date: '2026-06-13', time: '15:00' },
    { id: 'm26', home: 'SUI', away: 'BIH', venue: 'SoFi',     date: '2026-06-18', time: '15:00' },
    { id: 'm27', home: 'CAN', away: 'QAT', venue: 'BCPlace',  date: '2026-06-18', time: '18:00' },
    { id: 'm51', home: 'SUI', away: 'CAN', venue: 'BCPlace',  date: '2026-06-24', time: '15:00' },
    { id: 'm52', home: 'BIH', away: 'QAT', venue: 'Lumen',    date: '2026-06-24', time: '15:00' },
  ],
  C: [
    { id: 'm7',  home: 'BRA', away: 'MAR', venue: 'MetLife',  date: '2026-06-13', time: '18:00' },
    { id: 'm5',  home: 'HAI', away: 'SCO', venue: 'Gillette', date: '2026-06-13', time: '21:00' },
    { id: 'm30', home: 'SCO', away: 'MAR', venue: 'Gillette', date: '2026-06-19', time: '18:00' },
    { id: 'm29', home: 'BRA', away: 'HAI', venue: 'Lincoln',  date: '2026-06-19', time: '20:30' },
    { id: 'm49', home: 'SCO', away: 'BRA', venue: 'HardRock', date: '2026-06-24', time: '18:00' },
    { id: 'm50', home: 'MAR', away: 'HAI', venue: 'Mercedes', date: '2026-06-24', time: '18:00' },
  ],
  D: [
    { id: 'm4',  home: 'USA', away: 'PAR', venue: 'SoFi',     date: '2026-06-12', time: '21:00' },
    { id: 'm6',  home: 'AUS', away: 'TUR', venue: 'BCPlace',  date: '2026-06-14', time: '00:00' },
    { id: 'm32', home: 'USA', away: 'AUS', venue: 'Lumen',    date: '2026-06-19', time: '15:00' },
    { id: 'm31', home: 'TUR', away: 'PAR', venue: 'Levis',    date: '2026-06-20', time: '00:00' },
    { id: 'm59', home: 'TUR', away: 'USA', venue: 'SoFi',     date: '2026-06-25', time: '22:00' },
    { id: 'm60', home: 'PAR', away: 'AUS', venue: 'Levis',    date: '2026-06-25', time: '22:00' },
  ],
  E: [
    { id: 'm10', home: 'GER', away: 'CUW', venue: 'NRG',      date: '2026-06-14', time: '13:00' },
    { id: 'm9',  home: 'CIV', away: 'ECU', venue: 'Lincoln',  date: '2026-06-14', time: '19:00' },
    { id: 'm33', home: 'GER', away: 'CIV', venue: 'BMO',      date: '2026-06-20', time: '16:00' },
    { id: 'm34', home: 'ECU', away: 'CUW', venue: 'Arrowhead',date: '2026-06-20', time: '20:00' },
    { id: 'm56', home: 'ECU', away: 'GER', venue: 'MetLife',  date: '2026-06-25', time: '16:00' },
    { id: 'm55', home: 'CUW', away: 'CIV', venue: 'Lincoln',  date: '2026-06-25', time: '16:00' },
  ],
  F: [
    { id: 'm11', home: 'NED', away: 'JPN', venue: 'ATT',      date: '2026-06-14', time: '16:00' },
    { id: 'm12', home: 'SWE', away: 'TUN', venue: 'BBVA',     date: '2026-06-14', time: '22:00' },
    { id: 'm35', home: 'NED', away: 'SWE', venue: 'NRG',      date: '2026-06-20', time: '13:00' },
    { id: 'm36', home: 'TUN', away: 'JPN', venue: 'BBVA',     date: '2026-06-21', time: '00:00' },
    { id: 'm57', home: 'JPN', away: 'SWE', venue: 'ATT',      date: '2026-06-25', time: '19:00' },
    { id: 'm58', home: 'TUN', away: 'NED', venue: 'Arrowhead',date: '2026-06-25', time: '19:00' },
  ],
  G: [
    { id: 'm16', home: 'BEL', away: 'EGY', venue: 'Lumen',    date: '2026-06-15', time: '15:00' },
    { id: 'm15', home: 'IRN', away: 'NZL', venue: 'SoFi',     date: '2026-06-15', time: '21:00' },
    { id: 'm39', home: 'BEL', away: 'IRN', venue: 'SoFi',     date: '2026-06-21', time: '15:00' },
    { id: 'm40', home: 'NZL', away: 'EGY', venue: 'BCPlace',  date: '2026-06-21', time: '21:00' },
    { id: 'm63', home: 'EGY', away: 'IRN', venue: 'Lumen',    date: '2026-06-26', time: '23:00' },
    { id: 'm64', home: 'NZL', away: 'BEL', venue: 'BCPlace',  date: '2026-06-26', time: '23:00' },
  ],
  H: [
    { id: 'm14', home: 'ESP', away: 'CPV', venue: 'Mercedes', date: '2026-06-15', time: '12:00' },
    { id: 'm13', home: 'KSA', away: 'URU', venue: 'HardRock', date: '2026-06-15', time: '18:00' },
    { id: 'm38', home: 'ESP', away: 'KSA', venue: 'Mercedes', date: '2026-06-21', time: '12:00' },
    { id: 'm37', home: 'URU', away: 'CPV', venue: 'HardRock', date: '2026-06-21', time: '18:00' },
    { id: 'm66', home: 'URU', away: 'ESP', venue: 'Akron',    date: '2026-06-26', time: '20:00' },
    { id: 'm65', home: 'CPV', away: 'KSA', venue: 'NRG',      date: '2026-06-26', time: '20:00' },
  ],
  I: [
    { id: 'm17', home: 'FRA', away: 'SEN', venue: 'MetLife',  date: '2026-06-16', time: '15:00' },
    { id: 'm18', home: 'IRQ', away: 'NOR', venue: 'Gillette', date: '2026-06-16', time: '18:00' },
    { id: 'm42', home: 'FRA', away: 'IRQ', venue: 'Lincoln',  date: '2026-06-22', time: '17:00' },
    { id: 'm41', home: 'NOR', away: 'SEN', venue: 'MetLife',  date: '2026-06-22', time: '20:00' },
    { id: 'm61', home: 'NOR', away: 'FRA', venue: 'Gillette', date: '2026-06-26', time: '15:00' },
    { id: 'm62', home: 'SEN', away: 'IRQ', venue: 'BMO',      date: '2026-06-26', time: '15:00' },
  ],
  J: [
    { id: 'm19', home: 'ARG', away: 'ALG', venue: 'Arrowhead',date: '2026-06-16', time: '21:00' },
    { id: 'm20', home: 'AUT', away: 'JOR', venue: 'Levis',    date: '2026-06-17', time: '00:00' },
    { id: 'm43', home: 'ARG', away: 'AUT', venue: 'ATT',      date: '2026-06-22', time: '13:00' },
    { id: 'm44', home: 'JOR', away: 'ALG', venue: 'Levis',    date: '2026-06-22', time: '23:00' },
    { id: 'm69', home: 'ALG', away: 'AUT', venue: 'Arrowhead',date: '2026-06-27', time: '22:00' },
    { id: 'm70', home: 'JOR', away: 'ARG', venue: 'ATT',      date: '2026-06-27', time: '22:00' },
  ],
  K: [
    { id: 'm23', home: 'POR', away: 'COD', venue: 'NRG',      date: '2026-06-17', time: '13:00' },
    { id: 'm24', home: 'UZB', away: 'COL', venue: 'Azteca',   date: '2026-06-17', time: '22:00' },
    { id: 'm47', home: 'POR', away: 'UZB', venue: 'NRG',      date: '2026-06-23', time: '13:00' },
    { id: 'm48', home: 'COL', away: 'COD', venue: 'Akron',    date: '2026-06-23', time: '22:00' },
    { id: 'm71', home: 'COL', away: 'POR', venue: 'HardRock', date: '2026-06-27', time: '19:30' },
    { id: 'm72', home: 'COD', away: 'UZB', venue: 'Mercedes', date: '2026-06-27', time: '19:30' },
  ],
  L: [
    { id: 'm22', home: 'ENG', away: 'CRO', venue: 'ATT',      date: '2026-06-17', time: '16:00' },
    { id: 'm21', home: 'GHA', away: 'PAN', venue: 'BMO',      date: '2026-06-17', time: '19:00' },
    { id: 'm45', home: 'ENG', away: 'GHA', venue: 'Gillette', date: '2026-06-23', time: '16:00' },
    { id: 'm46', home: 'PAN', away: 'CRO', venue: 'BMO',      date: '2026-06-23', time: '19:00' },
    { id: 'm67', home: 'PAN', away: 'ENG', venue: 'MetLife',  date: '2026-06-27', time: '17:00' },
    { id: 'm68', home: 'CRO', away: 'GHA', venue: 'Lincoln',  date: '2026-06-27', time: '17:00' },
  ],
};

export const ROUND_LABELS = {
  r32: 'Round of 32',
  r16: 'Round of 16',
  qf:  'Quarterfinals',
  sf:  'Semifinals',
  final: 'Final',
};

export const ALL_ROUNDS = ['r32', 'r16', 'qf', 'sf', 'final'];
