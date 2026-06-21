// Proxies ESPN's unofficial FIFA World Cup scoreboard API.
// Returns a map keyed by "HOME-AWAY" team codes (e.g. "MEX-RSA").
// Cached 30 s on the CDN so live matches stay fresh without hammering ESPN.


const ESPN = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard';

function dateStr(d) {
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}

function datesFrom() {
  const dates = [];
  const today = new Date();
  // rolling window: 2 days back → 10 days ahead — extra day catches midnight-boundary games
  const start = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000);
  const end   = new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000);
  for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(dateStr(new Date(d)));
  }
  return dates;
}

function parseEvents(events, into) {
  for (const event of events ?? []) {
    const comp = event.competitions?.[0];
    if (!comp) continue;
    const home = comp.competitors?.find(c => c.homeAway === 'home');
    const away = comp.competitors?.find(c => c.homeAway === 'away');
    if (!home || !away) continue;
    const status = comp.status?.type ?? {};
    const homeCode = home.team.abbreviation.toUpperCase();
    const awayCode = away.team.abbreviation.toUpperCase();
    const homeScore = home.score != null ? Number(home.score) : null;
    const awayScore = away.score != null ? Number(away.score) : null;

    // Goals only (scoringPlay=true excludes yellow/red cards)
    const goals = (comp.details ?? [])
      .filter(d => d.scoringPlay)
      .map(d => ({
        side: d.team?.id === home.team.id ? 'home' : 'away',
        name: d.athletesInvolved?.[0]?.shortName ?? '',
        min:  d.clock?.displayValue ?? '',
        og:   d.ownGoal     ?? false,
        pk:   d.penaltyKick ?? false,
      }));

    // Yellow / red cards
    const cards = (comp.details ?? [])
      .filter(d => !d.scoringPlay && d.type?.text?.toLowerCase().includes('card'))
      .map(d => ({
        side: d.team?.id === home.team.id ? 'home' : 'away',
        type: d.type.text.toLowerCase().includes('red') ? 'red' : 'yellow',
      }));

    // Substitutions
    const subs = (comp.details ?? [])
      .filter(d => !d.scoringPlay && d.type?.text?.toLowerCase().includes('substitution'))
      .map(d => ({
        side: d.team?.id === home.team.id ? 'home' : 'away',
        on:  d.athletesInvolved?.[0]?.shortName ?? '',
        off: d.athletesInvolved?.[1]?.shortName ?? '',
        min: d.clock?.displayValue ?? '',
      }));

    // VAR / video review events
    const varReviews = (comp.details ?? [])
      .filter(d => !d.scoringPlay && (
        d.type?.text?.toLowerCase().includes('var') ||
        d.type?.text?.toLowerCase().includes('video review')
      ))
      .map(d => ({ side: d.team?.id === home.team.id ? 'home' : 'away', min: d.clock?.displayValue ?? '' }));

    // Per-team possession + shot stats (null when not yet available, e.g. pre-game)
    const sv = (arr, name) => {
      const v = arr?.find(s => s.name === name)?.displayValue;
      return v != null ? parseFloat(v) : null;
    };
    const hp = sv(home.statistics, 'possessionPct');
    const stats = hp != null ? {
      home: { poss: Math.round(hp),                                         shots: sv(home.statistics, 'totalShots') ?? 0, sog: sv(home.statistics, 'shotsOnTarget') ?? 0, corners: sv(home.statistics, 'wonCorners') ?? 0, fouls: sv(home.statistics, 'foulsCommitted') ?? 0 },
      away: { poss: Math.round(sv(away.statistics, 'possessionPct') ?? 0), shots: sv(away.statistics, 'totalShots') ?? 0, sog: sv(away.statistics, 'shotsOnTarget') ?? 0, corners: sv(away.statistics, 'wonCorners') ?? 0, fouls: sv(away.statistics, 'foulsCommitted') ?? 0 },
    } : null;

    const kit    = c => (c && c !== '000000') ? `#${c}` : null;
    const homeKit    = kit(home.team.color);
    const awayKit    = kit(away.team.color);
    const homeAltKit = kit(home.team.alternateColor);
    const awayAltKit = kit(away.team.alternateColor);

    const base = {
      state:      status.state      ?? 'pre',
      completed:  status.completed  ?? false,
      detail:     status.detail     ?? '',
      broadcast:  (comp.broadcasts?.[0]?.names ?? []).slice(0, 3),
      oddsDetail: comp.odds?.[0]?.details ?? null,
      goals,
      cards,
      subs,
      varReviews,
      stats,
    };

    // Store under both orderings so our home/away assignment never has to match ESPN's
    into[`${homeCode}-${awayCode}`] = { ...base, homeScore, awayScore, homeKit, awayKit, homeAltKit, awayAltKit };
    into[`${awayCode}-${homeCode}`] = {
      ...base,
      homeScore: awayScore,
      awayScore: homeScore,
      homeKit: awayKit,
      awayKit: homeKit,
      homeAltKit: awayAltKit,
      awayAltKit: homeAltKit,
      goals: goals.map(g => ({ ...g, side: g.side === 'home' ? 'away' : 'home' })),
      cards: cards.map(c => ({ ...c, side: c.side === 'home' ? 'away' : 'home' })),
      subs:  subs.map(s  => ({ ...s,  side: s.side  === 'home' ? 'away' : 'home' })),
      varReviews: varReviews.map(v => ({ ...v, side: v.side === 'home' ? 'away' : 'home' })),
      stats: stats ? { home: stats.away, away: stats.home } : null,
    };
  }
}

const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });

export default async () => {
  try {
    const dates = datesFrom();
    const scores = {};
    // sequential fetch — avoids holding multiple large ESPN responses in memory at once
    for (const d of dates) {
      const data = await fetch(`${ESPN}?dates=${d}`)
        .then(r => r.ok ? r.json() : null)
        .catch(() => null);
      if (data?.events) parseEvents(data.events, scores);
    }

    return json(scores, 200, {
      'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30',
    });
  } catch (err) {
    console.error('scores error:', err?.message ?? err);
    return json({ error: 'server_error' }, 500);
  }
};
