import sharp from 'sharp';
import { getStore } from '@netlify/blobs';
import { fontStyle, setupFonts } from './_font.js';

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

function winnerSvg(championName, flagDataUri) {
  const nameLen = championName.length;
  const nameFontSize = nameLen >= 13 ? 75 : nameLen >= 9 ? 90 : 110;

  const ballCx = 370, ballCy = 275, ballR = 185;
  const flagW = 360, flagH = 240;
  const flagX = 655, flagY = ballCy - flagH / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1200" width="1200" height="1200">
  ${fontStyle()}
  <rect width="1200" height="1200" fill="#091a0f"/>
  <radialGradient id="g" cx="50%" cy="95%" r="65%">
    <stop offset="0%" stop-color="#22c55e" stop-opacity="0.10"/>
    <stop offset="100%" stop-color="#22c55e" stop-opacity="0"/>
  </radialGradient>
  <rect width="1200" height="1200" fill="url(#g)"/>
  ${ballSvg(ballCx, ballCy, ballR)}
  <image href="${flagDataUri}" x="${flagX}" y="${flagY}" width="${flagW}" height="${flagH}" preserveAspectRatio="xMidYMid meet"/>
  <text x="600" y="575" font-family="Inter,Arial,sans-serif" font-size="${nameFontSize}" font-weight="900" fill="white" text-anchor="middle">${escapeXml(championName)}</text>
  ${trophySvg(600, 770, 0.70)}
  <text x="600" y="980" font-family="Inter,Arial,sans-serif" font-size="38" font-weight="700" fill="#22c55e" text-anchor="middle">World Cup Champion · 2026</text>
  <text x="600" y="1042" font-family="Inter,Arial,sans-serif" font-size="30" font-weight="400" fill="#22c55e" fill-opacity="0.7" text-anchor="middle">Make your own bracket at bracketwebb.com</text>
  <text x="600" y="1095" font-family="Inter,Arial,sans-serif" font-size="26" font-weight="400" fill="#22c55e" fill-opacity="0.4" text-anchor="middle">bracketwebb.com</text>
</svg>`;
}

function genericSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1200" width="1200" height="1200">
  ${fontStyle()}
  <rect width="1200" height="1200" fill="#091a0f"/>
  <radialGradient id="g" cx="50%" cy="58%" r="55%">
    <stop offset="0%" stop-color="#22c55e" stop-opacity="0.07"/>
    <stop offset="100%" stop-color="#22c55e" stop-opacity="0"/>
  </radialGradient>
  <rect width="1200" height="1200" fill="url(#g)"/>
  ${ballSvg(600, 375, 270)}
  ${trophySvg(600, 852, 0.88)}
  <text x="600" y="1075" font-family="Inter,Arial,sans-serif" font-size="48" font-weight="900" fill="white" text-anchor="middle">2026 FIFA World Cup</text>
  <text x="600" y="1150" font-family="Inter,Arial,sans-serif" font-size="30" font-weight="400" fill="#22c55e" fill-opacity="0.6" text-anchor="middle">bracketwebb.com</text>
</svg>`;
}

export default async (req) => {
  await setupFonts();
  const slug = new URL(req.url).searchParams.get('slug') ?? '';

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

  const png = await sharp(Buffer.from(svg ?? genericSvg())).png().toBuffer();

  return new Response(png, {
    status: 200,
    headers: {
      'content-type': 'image/png',
      'cache-control': 'public, max-age=300, stale-while-revalidate=60',
    },
  });
};
