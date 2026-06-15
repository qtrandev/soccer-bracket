// Proxies ESPN's unofficial FIFA World Cup scoreboard API.
// Returns a map keyed by "HOME-AWAY" team codes (e.g. "MEX-RSA").
// Cached 30 s on the CDN so live matches stay fresh without hammering ESPN.

const ESPN = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard';
const TOURNAMENT_START = '2026-06-11';

function dateStr(d) {
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}

function datesFrom(startIso) {
  const dates = [];
  const start = new Date(startIso + 'T00:00:00Z');
  const today = new Date();
  // fetch up through tomorrow so in-progress matches on late dates are caught
  const end = new Date(today.getTime() + 24 * 60 * 60 * 1000);
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
    const base = {
      state: status.state ?? 'pre',       // 'pre' | 'in' | 'post'
      completed: status.completed ?? false,
      detail: status.detail ?? '',         // "82'", "HT", "Final", "FT"
      broadcast: (comp.broadcasts?.[0]?.names ?? []).slice(0, 3), // US networks only
      oddsDetail: comp.odds?.[0]?.details ?? null,                 // e.g. "ESP -1200"
    };
    // Store under both orderings so our home/away assignment never has to match ESPN's
    into[`${homeCode}-${awayCode}`] = { ...base, homeScore, awayScore };
    into[`${awayCode}-${homeCode}`] = { ...base, homeScore: awayScore, awayScore: homeScore };
  }
}

const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });

export default async () => {
  try {
    const dates = datesFrom(TOURNAMENT_START);
    const results = await Promise.all(
      dates.map(d =>
        fetch(`${ESPN}?dates=${d}`)
          .then(r => (r.ok ? r.json() : null))
          .catch(() => null)
      )
    );

    const scores = {};
    for (const data of results) {
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
