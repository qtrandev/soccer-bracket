import {
  GROUPS, R32_MATCHES, R16_MATCHES, QF_MATCHES, SF_MATCHES, FINAL_MATCH,
} from '../data/tournamentData.js';
import { getStrength } from '../data/teamStrengths.js';
import { resolveThirdPlaceSlots } from '../data/thirdPlaceAllocation.js';

// Given group picks { A: ['MEX','KOR','CZE','RSA'], ... } (ordered 1st–4th)
// resolve a bracket slot like 'A1' or 'B2' into a team code.
// '3RD' slots are resolved per-match in buildBracket via Annex C.
export function resolveSlot(slot, groupPicks) {
  if (!slot) return null;

  const groupMatch = slot.match(/^([A-L])([12])$/);
  if (groupMatch) {
    const [, letter, pos] = groupMatch;
    const picks = groupPicks[letter];
    if (!picks || picks.length < Number(pos)) return null;
    return picks[Number(pos) - 1];
  }

  return null;
}

// Returns the group letter (A–L) that a team code belongs to.
function groupOfTeam(code) {
  for (const [letter, group] of Object.entries(GROUPS)) {
    if (group.teams.includes(code)) return letter;
  }
  return null;
}

// Derive the best 8 third-place teams from group picks (one per group).
// Autofill stores all 4 teams sorted (index 2 = 3rd place).
// Manual picks only store the 2 qualifiers, so we infer 3rd place as the
// strongest non-qualifier in each group, then rank all 12 and take the best 8.
// Annex C requires exactly one third-placed team per qualifying group,
// so the returned array always has teams from 8 distinct groups.
export function deriveWildcards(groupPicks) {
  const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
  const candidates = letters.map(l => {
    const picks = groupPicks[l] ?? [];
    if (picks.length >= 3) return picks[2]; // autofill: already sorted, index 2 = 3rd
    // manual picks: infer 3rd place as the strongest non-qualifier
    const nonQualifiers = (GROUPS[l]?.teams ?? []).filter(t => !picks.includes(t));
    if (nonQualifiers.length === 0) return null;
    return nonQualifiers.reduce((best, t) =>
      getStrength(t, 'favorites') >= getStrength(best, 'favorites') ? t : best
    );
  }).filter(Boolean);
  // Sort by strength, take best 8 (each from a different group by construction)
  return candidates
    .sort((a, b) => getStrength(b, 'favorites') - getStrength(a, 'favorites'))
    .slice(0, 8);
}

// Build the full bracket state from picks.
// Returns resolved match objects with team1/team2/winner fields.
export function buildBracket(groupPicks, knockoutPicks, wildcards) {
  const resolvedWildcards = wildcards ?? deriveWildcards(groupPicks);

  const resolve = slot => resolveSlot(slot, groupPicks);
  const winner = id => knockoutPicks?.[id] ?? null;

  // Build Annex C third-place slot mapping (matchId -> group letter)
  const wcByGroup = Object.fromEntries(
    resolvedWildcards.map(c => [groupOfTeam(c), c]).filter(([g]) => g != null)
  );
  const thirdGroups = Object.keys(wcByGroup);
  const thirdSlots = thirdGroups.length === 8 ? resolveThirdPlaceSlots(thirdGroups) : null;

  const r32 = R32_MATCHES.map(m => {
    const resolveTeam = slot => {
      if (slot === '3RD') {
        if (!thirdSlots) return null;
        const group = thirdSlots[m.id];
        return group ? (wcByGroup[group] ?? null) : null;
      }
      return resolve(slot);
    };
    return {
      ...m,
      team1: resolveTeam(m.slot1),
      team2: resolveTeam(m.slot2),
      winner: winner(m.id),
    };
  });

  const r16 = R16_MATCHES.map(m => ({
    ...m,
    team1: winner(m.src[0]),
    team2: winner(m.src[1]),
    winner: winner(m.id),
  }));

  const qf = QF_MATCHES.map(m => ({
    ...m,
    team1: winner(m.src[0]),
    team2: winner(m.src[1]),
    winner: winner(m.id),
  }));

  const sf = SF_MATCHES.map(m => ({
    ...m,
    team1: winner(m.src[0]),
    team2: winner(m.src[1]),
    winner: winner(m.id),
  }));

  const final = {
    ...FINAL_MATCH,
    team1: winner(FINAL_MATCH.src[0]),
    team2: winner(FINAL_MATCH.src[1]),
    winner: winner(FINAL_MATCH.id),
  };

  return { r32, r16, qf, sf, final };
}

// Count how many groups have at least 2 teams picked (valid group picks).
export function countCompletedGroups(groupPicks) {
  return Object.values(groupPicks).filter(picks => picks && picks.length >= 2).length;
}

// Count how many knockout picks have been made.
export function countKnockoutPicks(knockoutPicks) {
  return Object.values(knockoutPicks ?? {}).filter(Boolean).length;
}

export function formatMatchDate(dateStr, timeStr) {
  if (!dateStr) return '';
  try {
    const dt = new Date(`${dateStr}T${timeStr ?? '00:00'}:00`);
    return dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

export function formatMatchTime(dateStr, timeStr) {
  if (!dateStr || !timeStr) return '';
  try {
    // Times stored in ET (tournament times) — June/July = EDT = -04:00
    const dt = new Date(`${dateStr}T${timeStr}:00-04:00`);
    return dt.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
  } catch {
    return timeStr;
  }
}
