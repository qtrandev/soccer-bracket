import { getStore } from '@netlify/blobs';

// Team code → display name (mirrors src/data/tournamentData.js)
const TEAM_NAMES = {
  MEX: 'Mexico',       KOR: 'South Korea',  CZE: 'Czechia',        RSA: 'South Africa',
  CAN: 'Canada',       SUI: 'Switzerland',  BIH: 'Bosnia & Herz.', QAT: 'Qatar',
  BRA: 'Brazil',       MAR: 'Morocco',      SCO: 'Scotland',       HAI: 'Haiti',
  USA: 'USA',          TUR: 'Türkiye',      AUS: 'Australia',      PAR: 'Paraguay',
  GER: 'Germany',      ECU: 'Ecuador',      CIV: "Côte d'Ivoire",  CUW: 'Curaçao',
  NED: 'Netherlands',  JPN: 'Japan',        SWE: 'Sweden',         TUN: 'Tunisia',
  BEL: 'Belgium',      IRN: 'Iran',         EGY: 'Egypt',          NZL: 'New Zealand',
  ESP: 'Spain',        URU: 'Uruguay',      KSA: 'Saudi Arabia',   CPV: 'Cabo Verde',
  FRA: 'France',       SEN: 'Senegal',      NOR: 'Norway',         IRQ: 'Iraq',
  ARG: 'Argentina',    AUT: 'Austria',      ALG: 'Algeria',        JOR: 'Jordan',
  POR: 'Portugal',     COL: 'Colombia',     COD: 'DR Congo',       UZB: 'Uzbekistan',
  ENG: 'England',      CRO: 'Croatia',      GHA: 'Ghana',          PAN: 'Panama',
};

// Paths that are app routes or static files — never treat as bracket slugs
const SKIP = new Set([
  'new', 'favicon.ico', 'robots.txt', 'sitemap.xml',
  'og.png', 'apple-touch-icon.png', 'ball.svg', 'og.svg',
]);

function escapeAttr(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export default async function handler(request, context) {
  const { pathname } = new URL(request.url);
  const slug = pathname.slice(1); // strip leading /

  // Skip static assets, known app routes, and anything that looks like a file
  if (!slug || SKIP.has(slug) || slug.includes('.') || slug.includes('/')) {
    return context.next();
  }

  // Must match the same slug pattern the save function enforces
  if (!/^[a-z0-9-]{2,60}$/.test(slug)) return context.next();

  try {
    const store = getStore({ name: 'brackets' });
    const data = await store.get(slug, { type: 'json' });

    // Bracket doesn't exist — let the React app render its own not-found state
    if (!data) return context.next();

    const champion = data.knockoutPicks?.['m104'] ?? data.knockoutPicks?.final;
    const championName = champion ? (TEAM_NAMES[champion] ?? champion) : null;

    const title = championName
      ? `${slug}'s bracket: ${championName} wins the World Cup`
      : `${slug}'s 2026 World Cup bracket`;

    const description = championName
      ? `${slug} picks ${championName} to win the 2026 FIFA World Cup. Make your own predictions on BracketWebb!`
      : `Check out ${slug}'s 2026 FIFA World Cup bracket on BracketWebb. Make your own predictions!`;

    const canonicalUrl = `https://bracketwebb.com/${encodeURIComponent(slug)}`;

    // Fetch the underlying response — the /* redirect serves index.html
    const res = await context.next();
    const html = await res.text();

    const modified = html
      .replace(/(<meta property="og:title" content=")[^"]*(")/,       `$1${escapeAttr(title)}$2`)
      .replace(/(<meta property="og:description" content=")[^"]*(")/,  `$1${escapeAttr(description)}$2`)
      .replace(/(<meta property="og:url" content=")[^"]*(")/,          `$1${escapeAttr(canonicalUrl)}$2`)
      .replace(/(<meta name="twitter:title" content=")[^"]*(")/,       `$1${escapeAttr(title)}$2`)
      .replace(/(<meta name="twitter:description" content=")[^"]*(")/,  `$1${escapeAttr(description)}$2`)
      .replace(/(<link rel="canonical" href=")[^"]*(")/,               `$1${escapeAttr(canonicalUrl)}$2`);

    const headers = new Headers(res.headers);
    headers.set('content-type', 'text/html; charset=utf-8');
    // Brackets are immutable once saved — cache the OG page for 5 minutes
    headers.set('cache-control', 'public, max-age=300, stale-while-revalidate=60');

    return new Response(modified, { status: res.status, headers });
  } catch {
    // Never break the site — always fall through on any error
    return context.next();
  }
}

export const config = { path: '/:slug' };
