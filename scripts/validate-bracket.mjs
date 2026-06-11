// Validation script for the official FIFA 2026 knockout structure.
// Run: node scripts/validate-bracket.mjs
import { THIRD_PLACE_ALLOCATION, THIRD_PLACE_HOSTS, resolveThirdPlaceSlots } from '../src/data/thirdPlaceAllocation.js';
import { R32_MATCHES, R16_MATCHES, QF_MATCHES, SF_MATCHES, FINAL_MATCH } from '../src/data/tournamentData.js';

let errors = 0;
const err = (m) => { errors++; console.error('FAIL:', m); };

// ---------- Allocation table checks ----------
const LETTERS = 'ABCDEFGHIJKL'.split('');

function* combos(arr, k, start = 0, cur = []) {
  if (cur.length === k) { yield cur.join(''); return; }
  for (let i = start; i <= arr.length - (k - cur.length); i++) {
    yield* combos(arr, k, i + 1, [...cur, arr[i]]);
  }
}

const expectedKeys = new Set(combos(LETTERS, 8));
const keys = Object.keys(THIRD_PLACE_ALLOCATION);
if (keys.length !== 495) err(`expected 495 entries, got ${keys.length}`);
if (expectedKeys.size !== 495) err(`combo generator broken: ${expectedKeys.size}`);
for (const k of keys) {
  if (!expectedKeys.has(k)) err(`unexpected/unsorted key ${k}`);
  expectedKeys.delete(k);
}
if (expectedKeys.size > 0) err(`missing keys: ${[...expectedKeys].slice(0,5).join(', ')}...`);

// host allowed-sets (which groups can go to which host)
const ALLOWED = [
  new Set('CEFHI'), // 1A (m79)
  new Set('EFGIJ'), // 1B (m85)
  new Set('BEFIJ'), // 1D (m81)
  new Set('ABCDF'), // 1E (m74)
  new Set('AEHIJ'), // 1G (m82)
  new Set('CDFGH'), // 1I (m77)
  new Set('DEIJL'), // 1K (m87)
  new Set('EHIJK'), // 1L (m80)
];
for (const [k, v] of Object.entries(THIRD_PLACE_ALLOCATION)) {
  if (v.length !== 8) { err(`${k}: value length ${v.length}`); continue; }
  if ([...v].sort().join('') !== k) err(`${k}: value '${v}' is not a permutation of key`);
  [...v].forEach((g, i) => {
    if (!ALLOWED[i].has(g)) err(`${k}: pos ${i} (1${'ABDEGIKL'[i]}) gets 3${g}, not in allowed set`);
  });
}
console.log(`Allocation table: ${errors === 0 ? 'OK' : errors + ' errors'}`);

// resolver sanity check
const sample = resolveThirdPlaceSlots(['E','F','G','H','I','J','K','L']);
const expectSample = { m79:'E', m85:'J', m81:'I', m74:'F', m82:'H', m77:'G', m87:'L', m80:'K' };
if (JSON.stringify(sample) !== JSON.stringify(expectSample)) {
  err(`resolver row-1 mismatch: got ${JSON.stringify(sample)}, expected ${JSON.stringify(expectSample)}`);
}

// ---------- Bracket structure checks ----------
const groups = 'ABCDEFGHIJKL'.split('');
const slotCount = {};
let thirdSlots = 0;
for (const m of R32_MATCHES) {
  for (const s of [m.slot1, m.slot2]) {
    if (s === '3RD') thirdSlots++;
    else slotCount[s] = (slotCount[s] ?? 0) + 1;
  }
}
if (thirdSlots !== 8) err(`expected 8 third-place slots, got ${thirdSlots}`);
for (const g of groups) {
  for (const pos of ['1', '2']) {
    const c = slotCount[g + pos] ?? 0;
    if (c !== 1) err(`slot ${g}${pos} appears ${c} times (expected 1)`);
  }
}

// official pairings spot-check (match-number -> slots)
const official = {
  m73:['A2','B2'], m74:['E1','3RD'], m75:['F1','C2'], m76:['C1','F2'],
  m77:['I1','3RD'], m78:['E2','I2'], m79:['A1','3RD'], m80:['L1','3RD'],
  m81:['D1','3RD'], m82:['G1','3RD'], m83:['K2','L2'], m84:['H1','J2'],
  m85:['B1','3RD'], m86:['J1','H2'], m87:['K1','3RD'], m88:['D2','G2'],
};
for (const m of R32_MATCHES) {
  const exp = official[m.id];
  if (!exp || exp[0] !== m.slot1 || exp[1] !== m.slot2) {
    err(`${m.id}: ${m.slot1} v ${m.slot2} != official ${JSON.stringify(exp)}`);
  }
}

// progression: every match consumed exactly once; sequential display pairing holds
function checkRound(name, round, prev) {
  const prevIds = prev.map(m => m.id);
  const used = new Set();
  round.forEach((m, i) => {
    if (m.src.length !== 2) err(`${m.id}: src length`);
    m.src.forEach(s => {
      if (!prevIds.includes(s)) err(`${m.id}: src ${s} not in previous round`);
      if (used.has(s)) err(`${m.id}: src ${s} used twice`);
      used.add(s);
    });
    if (m.src[0] !== prev[2*i].id || m.src[1] !== prev[2*i+1].id) {
      err(`${name}[${i}] ${m.id}: src ${m.src} breaks sequential display pairing (${prev[2*i].id},${prev[2*i+1].id})`);
    }
  });
  if (used.size !== prevIds.length) err(`${name}: not all previous matches consumed (${used.size} vs ${prevIds.length})`);
}
checkRound('R16', R16_MATCHES, R32_MATCHES);
checkRound('QF', QF_MATCHES, R16_MATCHES);
checkRound('SF', SF_MATCHES, QF_MATCHES);
checkRound('FINAL', [FINAL_MATCH], SF_MATCHES);

// official R16 feed check (match-number based, independent of display order)
const officialR16 = {
  m89:['m74','m77'], m90:['m73','m75'], m91:['m76','m78'], m92:['m79','m80'],
  m93:['m83','m84'], m94:['m81','m82'], m95:['m86','m88'], m96:['m85','m87'],
};
for (const m of R16_MATCHES) {
  const exp = officialR16[m.id];
  if (!exp || exp[0] !== m.src[0] || exp[1] !== m.src[1]) {
    err(`${m.id}: src ${m.src} != official ${JSON.stringify(exp)}`);
  }
}
const officialUp = {
  m97:['m89','m90'], m98:['m93','m94'], m99:['m91','m92'], m100:['m95','m96'],
  m101:['m97','m98'], m102:['m99','m100'], m104:['m101','m102'],
};
for (const m of [...QF_MATCHES, ...SF_MATCHES, FINAL_MATCH]) {
  const exp = officialUp[m.id];
  if (!exp || exp[0] !== m.src[0] || exp[1] !== m.src[1]) {
    err(`${m.id}: src ${m.src} != official ${JSON.stringify(exp)}`);
  }
}

// hosts referenced by resolver exist among 3RD matches
const thirdMatchIds = new Set(R32_MATCHES.filter(m => m.slot2 === '3RD').map(m => m.id));
for (const h of THIRD_PLACE_HOSTS) {
  if (!thirdMatchIds.has(h.matchId)) err(`THIRD_PLACE_HOSTS ${h.matchId} not in R32 third-slot matches`);
}

console.log(`Bracket structure: ${errors === 0 ? 'OK' : errors + ' errors'}`);
console.log(errors === 0 ? '\n✓ All checks passed!' : `\n✗ ${errors} error(s) found`);
process.exit(errors === 0 ? 0 : 1);
