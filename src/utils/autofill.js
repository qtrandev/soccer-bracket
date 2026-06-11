import { GROUPS, GROUP_LETTERS, R32_MATCHES, R16_MATCHES, QF_MATCHES, SF_MATCHES, FINAL_MATCH } from '../data/tournamentData.js';
import { getStrength } from '../data/teamStrengths.js';
import { buildBracket, deriveWildcards } from './bracket.js';

function stronger(team1, team2, strategy, chaosRolls, forcedChampion) {
  if (!team1) return team2;
  if (!team2) return team1;
  // Forced champion beats everyone
  if (forcedChampion) {
    if (team1 === forcedChampion) return team1;
    if (team2 === forcedChampion) return team2;
  }
  if (strategy === 'chaos') {
    // use pre-rolled values so picks are stable (not re-randomized on render)
    const key = [team1, team2].sort().join('-');
    return chaosRolls[key] ?? team1;
  }
  return getStrength(team1, strategy) >= getStrength(team2, strategy) ? team1 : team2;
}

// Pre-roll all matchup outcomes for chaos mode so they're deterministic for this autofill
function rollChaos(allTeams) {
  const rolls = {};
  for (let i = 0; i < allTeams.length; i++) {
    for (let j = i + 1; j < allTeams.length; j++) {
      const key = [allTeams[i], allTeams[j]].sort().join('-');
      rolls[key] = Math.random() < 0.5 ? allTeams[i] : allTeams[j];
    }
  }
  return rolls;
}

export function autofillBracket(strategy, forcedChampion = null, existingGroupPicks = null) {
  const allTeamCodes = Object.keys(
    Object.fromEntries(GROUP_LETTERS.flatMap(l => GROUPS[l].teams.map(t => [t, 1])))
  );
  const chaosRolls = strategy === 'chaos' ? rollChaos(allTeamCodes) : {};

  // ── 1. Fill group picks (sort all 4 by strength), or use provided picks ──
  const groupPicks = existingGroupPicks ?? (() => {
    const picks = {};
    for (const letter of GROUP_LETTERS) {
      const teams = [...GROUPS[letter].teams];
      const randomRank = strategy === 'chaos'
        ? Object.fromEntries(teams.map(t => [t, Math.random()]))
        : null;
      teams.sort((a, b) => {
        if (forcedChampion) {
          if (a === forcedChampion) return -1;
          if (b === forcedChampion) return 1;
        }
        return strategy === 'chaos'
          ? randomRank[b] - randomRank[a]
          : getStrength(b, strategy) - getStrength(a, strategy);
      });
      picks[letter] = teams;
    }
    return picks;
  })();

  // ── 2. Derive wildcards ──
  const wildcards = deriveWildcards(groupPicks);

  // ── 3. Simulate knockout round by round ──
  const knockoutPicks = {};
  const rounds = [
    { key: 'r32', matches: R32_MATCHES },
    { key: 'r16', matches: R16_MATCHES },
    { key: 'qf',  matches: QF_MATCHES },
    { key: 'sf',  matches: SF_MATCHES },
    { key: 'final', matches: [FINAL_MATCH] },
  ];

  for (const { matches } of rounds) {
    // Rebuild bracket with picks so far to resolve team slots
    const state = buildBracket(groupPicks, knockoutPicks, wildcards);
    const allResolved = {
      ...Object.fromEntries(state.r32.map(m => [m.id, m])),
      ...Object.fromEntries(state.r16.map(m => [m.id, m])),
      ...Object.fromEntries(state.qf.map(m => [m.id, m])),
      ...Object.fromEntries(state.sf.map(m => [m.id, m])),
      [state.final.id]: state.final,
    };

    for (const match of matches) {
      const resolved = allResolved[match.id];
      if (resolved?.team1 && resolved?.team2) {
        knockoutPicks[match.id] = stronger(resolved.team1, resolved.team2, strategy, chaosRolls, forcedChampion);
      }
    }
  }

  return { groupPicks, wildcards, knockoutPicks };
}

export const STRATEGIES = [
  {
    id: 'favorites',
    icon: '📊',
    label: 'Odds Favorites',
    desc: 'Best teams advance every round. Argentina, France, England go deep.',
    color: 'border-blue-500/40 bg-blue-500/10 hover:border-blue-400/60',
    accent: 'text-blue-400',
  },
  {
    id: 'southamerica',
    icon: '🌎',
    label: 'South America Reigns',
    desc: 'Back CONMEBOL. Argentina, Brazil, Uruguay dominate the bracket.',
    color: 'border-yellow-500/40 bg-yellow-500/10 hover:border-yellow-400/60',
    accent: 'text-yellow-400',
  },
  {
    id: 'europe',
    icon: '🦁',
    label: 'European Giants',
    desc: 'France, England, Germany, Portugal — Europe takes the trophy.',
    color: 'border-purple-500/40 bg-purple-500/10 hover:border-purple-400/60',
    accent: 'text-purple-400',
  },
  {
    id: 'hosts',
    icon: '🇺🇸',
    label: 'Host Nation Spirit',
    desc: 'USA, Mexico, Canada get the home-crowd boost. Embrace the hosts.',
    color: 'border-red-500/40 bg-red-500/10 hover:border-red-400/60',
    accent: 'text-red-400',
  },
  {
    id: 'chaos',
    icon: '🎲',
    label: 'Chaos Mode',
    desc: 'Fully random. Upsets everywhere. Maximum drama.',
    color: 'border-emerald-500/40 bg-emerald-500/10 hover:border-emerald-400/60',
    accent: 'text-emerald-400',
  },
];
