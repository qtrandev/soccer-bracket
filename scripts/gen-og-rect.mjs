import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const sharp = require('sharp');

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

// Same ball + trophy helpers as og-square edge function
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

// Bracket line helper: 4-slot visual (2 semis → final → trophy)
// Slots at y positions: t1, t2 (top semi) and b1, b2 (bottom semi)
// All lines in the right panel starting at xStart
function bracketSvg(xStart) {
  const t1 = 165, t2 = 245;   // top semi team slots
  const b1 = 385, b2 = 465;   // bottom semi team slots
  const sfY1 = (t1 + t2) / 2; // 205 — top SF midpoint
  const sfY2 = (b1 + b2) / 2; // 425 — bottom SF midpoint
  const finY = (sfY1 + sfY2) / 2; // 315 — final
  const x0 = xStart;           // slot left edge  645
  const x1 = x0 + 100;         // slot right / R1 vertical  745
  const x2 = x1 + 120;         // SF line end  865
  const x3 = x2 + 110;         // F vertical  975
  const x4 = x3 + 100;         // trophy line end  1075
  const xT = x4 + 55;          // trophy centre  1130

  const dim = 'stroke="#22c55e" stroke-opacity="0.35"';
  const mid = 'stroke="#22c55e" stroke-opacity="0.65"';
  const bright = 'stroke="#22c55e" stroke-opacity="1"';

  return `
    <!-- Team slot lines -->
    <line x1="${x0}" y1="${t1}" x2="${x1}" y2="${t1}" ${dim} stroke-width="2"/>
    <line x1="${x0}" y1="${t2}" x2="${x1}" y2="${t2}" ${dim} stroke-width="2"/>
    <line x1="${x0}" y1="${b1}" x2="${x1}" y2="${b1}" ${dim} stroke-width="2"/>
    <line x1="${x0}" y1="${b2}" x2="${x1}" y2="${b2}" ${dim} stroke-width="2"/>

    <!-- R1 verticals -->
    <line x1="${x1}" y1="${t1}" x2="${x1}" y2="${t2}" ${dim} stroke-width="2"/>
    <line x1="${x1}" y1="${b1}" x2="${x1}" y2="${b2}" ${dim} stroke-width="2"/>

    <!-- SF lines -->
    <line x1="${x1}" y1="${sfY1}" x2="${x2}" y2="${sfY1}" ${mid} stroke-width="2.5"/>
    <line x1="${x1}" y1="${sfY2}" x2="${x2}" y2="${sfY2}" ${mid} stroke-width="2.5"/>

    <!-- SF slots -->
    <line x1="${x2}" y1="${sfY1}" x2="${x3}" y2="${sfY1}" ${mid} stroke-width="2.5"/>
    <line x1="${x2}" y1="${sfY2}" x2="${x3}" y2="${sfY2}" ${mid} stroke-width="2.5"/>

    <!-- Final vertical -->
    <line x1="${x3}" y1="${sfY1}" x2="${x3}" y2="${sfY2}" ${mid} stroke-width="2.5"/>

    <!-- Final line to trophy -->
    <line x1="${x3}" y1="${finY}" x2="${x4}" y2="${finY}" ${bright} stroke-width="3"/>

    <!-- Junction dot -->
    <circle cx="${x4}" cy="${finY}" r="5" fill="#22c55e"/>

    <!-- Team slot dots -->
    <circle cx="${x0}" cy="${t1}" r="4" fill="#22c55e" fill-opacity="0.35"/>
    <circle cx="${x0}" cy="${t2}" r="4" fill="#22c55e" fill-opacity="0.35"/>
    <circle cx="${x0}" cy="${b1}" r="4" fill="#22c55e" fill-opacity="0.35"/>
    <circle cx="${x0}" cy="${b2}" r="4" fill="#22c55e" fill-opacity="0.35"/>

    ${trophySvg(xT, finY, 0.26)}
  `;
}

// --- Japan winner preview ---
const flagRes = await fetch('https://flagcdn.com/w320/jp.png');
if (!flagRes.ok) throw new Error('Failed to fetch Japan flag');
const flagBuf = await flagRes.arrayBuffer();
const flagDataUri = `data:image/png;base64,${arrayBufferToBase64(flagBuf)}`;

const flagW = 210, flagH = 140;
const flagX = 385, flagY = 95;
const nameFontSize = 100; // "Japan" = 5 chars

const winnerSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <rect width="1200" height="630" fill="#091a0f"/>
  <radialGradient id="glow" cx="65%" cy="50%" r="50%">
    <stop offset="0%" stop-color="#22c55e" stop-opacity="0.07"/>
    <stop offset="100%" stop-color="#22c55e" stop-opacity="0"/>
  </radialGradient>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <circle cx="620" cy="315" r="420" fill="none" stroke="#22c55e" stroke-width="1" stroke-opacity="0.07"/>

  ${ballSvg(215, 205, 142)}

  <image href="${flagDataUri}" x="${flagX}" y="${flagY}" width="${flagW}" height="${flagH}" preserveAspectRatio="xMidYMid meet"/>

  <text x="68" y="420" font-family="Arial,Helvetica,sans-serif" font-size="${nameFontSize}" font-weight="900" fill="white" letter-spacing="-1">Japan</text>
  <text x="68" y="478" font-family="Arial,Helvetica,sans-serif" font-size="30" font-weight="700" fill="#22c55e">World Cup Champion · 2026</text>
  <line x1="68" y1="508" x2="590" y2="508" stroke="#22c55e" stroke-width="3"/>
  <text x="68" y="545" font-family="Arial,Helvetica,sans-serif" font-size="21" fill="#22c55e" fill-opacity="0.7">Make your own bracket at bracketwebb.com</text>
  <text x="68" y="607" font-family="Arial,Helvetica,sans-serif" font-size="20" fill="#22c55e" fill-opacity="0.4">bracketwebb.com</text>

  ${bracketSvg(645)}
</svg>`;

await sharp(Buffer.from(winnerSvg)).png().toFile('public/og-rect-winner-preview.png');
console.log('Generated: public/og-rect-winner-preview.png');

// --- Generic (no winner) ---
const genericSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <rect width="1200" height="630" fill="#091a0f"/>
  <radialGradient id="glow2" cx="65%" cy="50%" r="50%">
    <stop offset="0%" stop-color="#22c55e" stop-opacity="0.07"/>
    <stop offset="100%" stop-color="#22c55e" stop-opacity="0"/>
  </radialGradient>
  <rect width="1200" height="630" fill="url(#glow2)"/>
  <circle cx="620" cy="315" r="420" fill="none" stroke="#22c55e" stroke-width="1" stroke-opacity="0.07"/>

  ${ballSvg(215, 205, 142)}

  <text x="68" y="432" font-family="Arial,Helvetica,sans-serif" font-size="78" font-weight="900" fill="white" letter-spacing="-1">BracketWebb</text>
  <text x="68" y="480" font-family="Arial,Helvetica,sans-serif" font-size="28" fill="#6b7280">2026 FIFA World Cup Bracket</text>
  <line x1="68" y1="510" x2="590" y2="510" stroke="#22c55e" stroke-width="3"/>
  <text x="68" y="547" font-family="Arial,Helvetica,sans-serif" font-size="21" fill="#22c55e">Pick your winners · Share your bracket · Who takes the trophy?</text>
  <text x="68" y="607" font-family="Arial,Helvetica,sans-serif" font-size="20" fill="#22c55e" fill-opacity="0.4">bracketwebb.com</text>

  ${bracketSvg(645)}
</svg>`;

await sharp(Buffer.from(genericSvg)).png().toFile('public/og.png');
console.log('Generated: public/og.png');
