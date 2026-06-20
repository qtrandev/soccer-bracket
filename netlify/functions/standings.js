// Proxies ESPN's FIFA World Cup group standings.
// Returns a flat map keyed by team code: { MEX: { pts, gd, gp }, ... }

const ESPN_STANDINGS = 'https://site.api.espn.com/apis/v2/sports/soccer/fifa.world/standings';

const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });

export default async () => {
  try {
    const res = await fetch(ESPN_STANDINGS);
    if (!res.ok) return json({}, 200);
    const data = await res.json();

    const standings = {};
    for (const group of data.children ?? []) {
      for (const entry of group.standings?.entries ?? []) {
        const code = entry.team?.abbreviation?.toUpperCase();
        if (!code) continue;
        const sm = {};
        for (const s of entry.stats ?? []) sm[s.name] = s.value ?? 0;
        standings[code] = {
          pts: Math.round(sm.points ?? 0),
          gd:  Math.round(sm.pointDifferential ?? 0),
          gp:  Math.round(sm.gamesPlayed ?? 0),
        };
      }
    }

    return json(standings, 200, {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
    });
  } catch (err) {
    console.error('standings error:', err?.message ?? err);
    return json({}, 200);
  }
};
