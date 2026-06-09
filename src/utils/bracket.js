import {
  GROUPS, R32_MATCHES, R16_MATCHES, QF_MATCHES, SF_MATCHES, FINAL_MATCH,
} from '../data/tournamentData.js';
import { getStrength } from '../data/teamStrengths.js';

// Given group picks { A: ['MEX','KOR','CZE','RSA'], ... } (ordered 1st–4th)
// resolve a bracket slot like 'A1', 'B2', '3W1' into a team code.
export function resolveSlot(slot, groupPicks, wildcards) {
  if (!slot) return null;

  const groupMatch = slot.match(/^([A-L])([12])$/);
  if (groupMatch) {
    const [, letter, pos] = groupMatch;
    const picks = groupPicks[letter];
    if (!picks || picks.length < Number(pos)) return null;
    return picks[Number(pos) - 1];
  }

  const wildcardMatch = slot.match(/^3W(\d+)$/);
  if (wildcardMatch) {
    const idx = Number(wildcardMatch[1]) - 1;
    return wildcards?.[idx] ?? null;
  }

  return null;
}

// Derive the best 8 third-place teams from group picks.
// Autofill stores all 4 teams sorted (index 2 = 3rd place).
// Manual picks only store the 2 qualifiers, so we infer 3rd place as the
// strongest non-qualifier in each group, then rank all 12 and take the best 8.
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
  return candidates
    .sort((a, b) => getStrength(b, 'favorites') - getStrength(a, 'favorites'))
    .slice(0, 8);
}

// Build the full bracket state from picks.
// picks: { group: { A: ['MEX','KOR','CZE','RSA'], ... }, knockout: { 'r32-1': 'MEX', ... } }
// Returns an array of rounds, each an array of resolved match objects.
export function buildBracket(groupPicks, knockoutPicks, wildcards) {
  const resolvedWildcards = wildcards ?? deriveWildcards(groupPicks);

  const resolve = slot => resolveSlot(slot, groupPicks, resolvedWildcards);
  const winner = id => knockoutPicks?.[id] ?? null;

  const r32 = R32_MATCHES.map(m => ({
    ...m,
    team1: resolve(m.slot1),
    team2: resolve(m.slot2),
    winner: winner(m.id),
  }));

  const r16 = R16_MATCHES.map(m => {
    const [src1, src2] = m.src;
    return {
      ...m,
      team1: winner(src1),
      team2: winner(src2),
      winner: winner(m.id),
    };
  });

  const qf = QF_MATCHES.map(m => {
    const [src1, src2] = m.src;
    return {
      ...m,
      team1: winner(src1),
      team2: winner(src2),
      winner: winner(m.id),
    };
  });

  const sf = SF_MATCHES.map(m => {
    const [src1, src2] = m.src;
    return {
      ...m,
      team1: winner(src1),
      team2: winner(src2),
      winner: winner(m.id),
    };
  });

  const final = {
    ...FINAL_MATCH,
    team1: winner('sf-1'),
    team2: winner('sf-2'),
    winner: winner('final'),
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

export function formatMatchDate(dateStr, timeStr, venueKey) {
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
    // Times stored in ET (tournament times)
    const dt = new Date(`${dateStr}T${timeStr}:00-05:00`);
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
