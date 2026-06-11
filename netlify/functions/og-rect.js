import { Resvg } from '@resvg/resvg-js';
import { getStore } from '@netlify/blobs';
import { setupFonts } from './_font.js';

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

const TEAM_ISO2 = {
  MEX: 'mx', KOR: 'kr', CZE: 'cz', RSA: 'za',
  CAN: 'ca', SUI: 'ch', BIH: 'ba', QAT: 'qa',
  BRA: 'br', MAR: 'ma', SCO: 'gb-sct', HAI: 'ht',
  USA: 'us', TUR: 'tr', AUS: 'au', PAR: 'py',
  GER: 'de', ECU: 'ec', CIV: 'ci', CUW: 'cw',
  NED: 'nl', JPN: 'jp', SWE: 'se', TUN: 'tn',
  BEL: 'be', IRN: 'ir', EGY: 'eg', NZL: 'nz',
  ESP: 'es', URU: 'uy', KSA: 'sa', CPV: 'cv',
  FRA: 'fr', SEN: 'sn', NOR: 'no', IRQ: 'iq',
  ARG: 'ar', AUT: 'at', ALG: 'dz', JOR: 'jo',
  POR: 'pt', COL: 'co', COD: 'cd', UZB: 'uz',
  ENG: 'gb-eng', CRO: 'hr', GHA: 'gh', PAN: 'pa',
};

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function ballSvg(cx, cy, radius) {
  const s = radius / 95;
  return `<g transform="translate(${cx},${cy}) scale(${s}) translate(-100,-100)">
    <defs>
      <clipPath id="ballClip">
        <circle cx="100" cy="100" r="94"/>
      </clipPath>
      <radialGradient id="ballGrad" cx="38%" cy="32%" r="65%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="55%" stop-color="#e4e4e4"/>
        <stop offset="100%" stop-color="#b8b8b8"/>
      </radialGradient>
    </defs>
    <circle cx="100" cy="100" r="95" fill="url(#ballGrad)"/>
    <g clip-path="url(#ballClip)">
      <polygon points="100,60 138,88 124,132 76,132 62,88" fill="#111"/>
      <g transform="translate(100,100)">
        <ellipse cx="0" cy="-72" rx="22" ry="14" transform="rotate(36)" fill="#111"/>
        <ellipse cx="0" cy="-72" rx="22" ry="14" transform="rotate(108)" fill="#111"/>
        <ellipse cx="0" cy="-72" rx="22" ry="14" transform="rotate(180)" fill="#111"/>
        <ellipse cx="0" cy="-72" rx="22" ry="14" transform="rotate(252)" fill="#111"/>
        <ellipse cx="0" cy="-72" rx="22" ry="14" transform="rotate(324)" fill="#111"/>
      </g>
    </g>
    <circle cx="100" cy="100" r="95" fill="none" stroke="#aaa" stroke-width="2"/>
    <ellipse cx="72" cy="60" rx="16" ry="10" fill="white" fill-opacity="0.4" transform="rotate(-30,72,60)"/>
  </g>`;
}

function trophySvg(cx, cy, scale) {
  return `<g transform="translate(${cx},${cy}) scale(${scale})">
    <path d="M -130,-100 L -155,30 Q -130,120 0,135 Q 130,120 155,30 L 130,-100 Z" fill="#d97706"/>
    <path d="M -90,-60 Q -60,0 -75,90" fill="none" stroke="#fbbf24" stroke-width="14" stroke-linecap="round" opacity="0.5"/>
    <path d="M -155,30 Q -205,25 -205,80 Q -205,135 -155,125" fill="none" stroke="#d97706" stroke-width="22" stroke-linecap="round"/>
    <path d="M 155,30 Q 205,25 205,80 Q 205,135 155,125" fill="none" stroke="#d97706" stroke-width="22" stroke-linecap="round"/>
    <rect x="-20" y="135" width="40" height="60" fill="#d97706"/>
    <rect x="-90" y="193" width="180" height="35" rx="8" fill="#d97706"/>
    <polygon points="0,-120 14,-98 40,-98 20,-80 28,-55 0,-70 -28,-55 -20,-80 -40,-98 -14,-98" fill="#fde68a"/>
  </g>`;
}

function bracketSvg(xStart) {
  const t1 = 165, t2 = 245;
  const b1 = 385, b2 = 465;
  const sfY1 = (t1 + t2) / 2;
  const sfY2 = (b1 + b2) / 2;
  const finY = (sfY1 + sfY2) / 2;
  const x0 = xStart, x1 = x0 + 100, x2 = x1 + 120, x3 = x2 + 110, x4 = x3 + 100;
  const xT = x4 + 55;
  const dim = 'stroke="#22c55e" stroke-opacity="0.35"';
  const mid = 'stroke="#22c55e" stroke-opacity="0.65"';
  const bright = 'stroke="#22c55e" stroke-opacity="1"';
  return `
    <line x1="${x0}" y1="${t1}" x2="${x1}" y2="${t1}" ${dim} stroke-width="2"/>
    <line x1="${x0}" y1="${t2}" x2="${x1}" y2="${t2}" ${dim} stroke-width="2"/>
    <line x1="${x0}" y1="${b1}" x2="${x1}" y2="${b1}" ${dim} stroke-width="2"/>
    <line x1="${x0}" y1="${b2}" x2="${x1}" y2="${b2}" ${dim} stroke-width="2"/>
    <line x1="${x1}" y1="${t1}" x2="${x1}" y2="${t2}" ${dim} stroke-width="2"/>
    <line x1="${x1}" y1="${b1}" x2="${x1}" y2="${b2}" ${dim} stroke-width="2"/>
    <line x1="${x1}" y1="${sfY1}" x2="${x2}" y2="${sfY1}" ${mid} stroke-width="2.5"/>
    <line x1="${x1}" y1="${sfY2}" x2="${x2}" y2="${sfY2}" ${mid} stroke-width="2.5"/>
    <line x1="${x2}" y1="${sfY1}" x2="${x3}" y2="${sfY1}" ${mid} stroke-width="2.5"/>
    <line x1="${x2}" y1="${sfY2}" x2="${x3}" y2="${sfY2}" ${mid} stroke-width="2.5"/>
    <line x1="${x3}" y1="${sfY1}" x2="${x3}" y2="${sfY2}" ${mid} stroke-width="2.5"/>
    <line x1="${x3}" y1="${finY}" x2="${x4}" y2="${finY}" ${bright} stroke-width="3"/>
    <circle cx="${x4}" cy="${finY}" r="5" fill="#22c55e"/>
    <circle cx="${x0}" cy="${t1}" r="4" fill="#22c55e" fill-opacity="0.35"/>
    <circle cx="${x0}" cy="${t2}" r="4" fill="#22c55e" fill-opacity="0.35"/>
    <circle cx="${x0}" cy="${b1}" r="4" fill="#22c55e" fill-opacity="0.35"/>
    <circle cx="${x0}" cy="${b2}" r="4" fill="#22c55e" fill-opacity="0.35"/>
    ${trophySvg(xT, finY, 0.26)}`;
}

function genericSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <rect width="1200" height="630" fill="#091a0f"/>
  <radialGradient id="glow" cx="65%" cy="50%" r="50%">
    <stop offset="0%" stop-color="#22c55e" stop-opacity="0.07"/>
    <stop offset="100%" stop-color="#22c55e" stop-opacity="0"/>
  </radialGradient>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <circle cx="620" cy="315" r="420" fill="none" stroke="#22c55e" stroke-width="1" stroke-opacity="0.07"/>
  ${ballSvg(215, 205, 142)}
  <text x="68" y="432" font-family="DejaVu Sans,sans-serif" font-size="78" font-weight="700" fill="white">BracketWebb</text>
  <text x="68" y="480" font-family="DejaVu Sans,sans-serif" font-size="28" font-weight="400" fill="#6b7280">2026 FIFA World Cup Bracket</text>
  <line x1="68" y1="510" x2="590" y2="510" stroke="#22c55e" stroke-width="3"/>
  <text x="68" y="547" font-family="DejaVu Sans,sans-serif" font-size="21" font-weight="400" fill="#22c55e">Pick your winners · Share your bracket · Who takes the trophy?</text>
  <text x="68" y="607" font-family="DejaVu Sans,sans-serif" font-size="20" font-weight="400" fill="#22c55e" fill-opacity="0.4">bracketwebb.com</text>
  ${bracketSvg(645)}
</svg>`;
}

function winnerSvg(championName, flagDataUri) {
  const nameLen = championName.length;
  const nameFontSize = nameLen >= 14 ? 56 : nameLen >= 9 ? 72 : nameLen >= 6 ? 86 : 100;

  const flagW = 210, flagH = 140;
  const flagX = 385, flagY = 95;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <rect width="1200" height="630" fill="#091a0f"/>
  <radialGradient id="glow" cx="65%" cy="50%" r="50%">
    <stop offset="0%" stop-color="#22c55e" stop-opacity="0.07"/>
    <stop offset="100%" stop-color="#22c55e" stop-opacity="0"/>
  </radialGradient>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <circle cx="620" cy="315" r="420" fill="none" stroke="#22c55e" stroke-width="1" stroke-opacity="0.07"/>
  ${ballSvg(215, 205, 142)}
  <image href="${flagDataUri}" x="${flagX}" y="${flagY}" width="${flagW}" height="${flagH}" preserveAspectRatio="xMidYMid meet"/>
  <text x="68" y="420" font-family="DejaVu Sans,sans-serif" font-size="${nameFontSize}" font-weight="700" fill="white">${escapeXml(championName)}</text>
  <text x="68" y="478" font-family="DejaVu Sans,sans-serif" font-size="30" font-weight="700" fill="#22c55e">World Cup Champion · 2026</text>
  <line x1="68" y1="508" x2="590" y2="508" stroke="#22c55e" stroke-width="3"/>
  <text x="68" y="545" font-family="DejaVu Sans,sans-serif" font-size="21" font-weight="400" fill="#22c55e" fill-opacity="0.7">Make your own bracket at bracketwebb.com</text>
  <text x="68" y="607" font-family="DejaVu Sans,sans-serif" font-size="20" font-weight="400" fill="#22c55e" fill-opacity="0.4">bracketwebb.com</text>
  ${bracketSvg(645)}
</svg>`;
}

export default async (req) => {
  const slug = new URL(req.url).searchParams.get('slug') ?? '';
  const fontFiles = await setupFonts();

  let svg = null;

  if (slug && /^[a-z0-9-]{2,60}$/.test(slug)) {
    try {
      const store = getStore({ name: 'brackets' });
      const data = await store.get(slug, { type: 'json' });

      if (data) {
        const code = data.knockoutPicks?.['m104'] ?? data.knockoutPicks?.final ?? null;
        const name = code ? (TEAM_NAMES[code] ?? null) : null;

        if (code && name) {
          const iso2 = TEAM_ISO2[code];
          let flagDataUri = null;

          if (iso2) {
            try {
              const res = await fetch(`https://flagcdn.com/w320/${iso2}.png`);
              if (res.ok) {
                const buf = await res.arrayBuffer();
                flagDataUri = `data:image/png;base64,${arrayBufferToBase64(buf)}`;
              }
            } catch { /* fall through to generic */ }
          }

          if (flagDataUri) {
            svg = winnerSvg(name, flagDataUri);
          }
        }
      }
    } catch { /* fall through to generic */ }
  }

  const resvg = new Resvg(svg ?? genericSvg(), {
    font: {
      loadSystemFonts: false,
      fontFiles,
      defaultFontFamily: 'DejaVu Sans',
    },
  });
  const png = resvg.render().asPng();

  return new Response(png, {
    status: 200,
    headers: {
      'content-type': 'image/png',
      'cache-control': 'public, max-age=300, stale-while-revalidate=60',
    },
  });
};
