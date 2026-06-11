import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const sharp = require('sharp');

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

// Mirror of og-square.js winnerSvg
function winnerSvg(championName, flagDataUri) {
  const nameLen = championName.length;
  const nameFontSize = nameLen >= 13 ? 75 : nameLen >= 9 ? 90 : 110;

  const ballCx = 370, ballCy = 275, ballR = 185;
  const flagW = 360, flagH = 240;
  const flagX = 655, flagY = ballCy - flagH / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1200" width="1200" height="1200">
  <rect width="1200" height="1200" fill="#091a0f"/>
  <radialGradient id="g" cx="50%" cy="95%" r="65%">
    <stop offset="0%" stop-color="#22c55e" stop-opacity="0.10"/>
    <stop offset="100%" stop-color="#22c55e" stop-opacity="0"/>
  </radialGradient>
  <rect width="1200" height="1200" fill="url(#g)"/>
  ${ballSvg(ballCx, ballCy, ballR)}
  <image href="${flagDataUri}" x="${flagX}" y="${flagY}" width="${flagW}" height="${flagH}" preserveAspectRatio="xMidYMid meet"/>
  <text x="600" y="575" font-family="Arial,Helvetica,sans-serif" font-size="${nameFontSize}" font-weight="900" fill="white" text-anchor="middle">${escapeXml(championName)}</text>
  ${trophySvg(600, 770, 0.70)}
  <text x="600" y="980" font-family="Arial,Helvetica,sans-serif" font-size="38" font-weight="700" fill="#22c55e" text-anchor="middle">World Cup Champion · 2026</text>
  <text x="600" y="1042" font-family="Arial,Helvetica,sans-serif" font-size="30" fill="#22c55e" fill-opacity="0.7" text-anchor="middle">Make your own bracket at bracketwebb.com</text>
  <text x="600" y="1095" font-family="Arial,Helvetica,sans-serif" font-size="26" fill="#22c55e" fill-opacity="0.4" text-anchor="middle">bracketwebb.com</text>
</svg>`;
}

const res = await fetch('https://flagcdn.com/w320/jp.png');
if (!res.ok) throw new Error('Failed to fetch Japan flag');
const buf = await res.arrayBuffer();
const flagDataUri = `data:image/png;base64,${arrayBufferToBase64(buf)}`;

await sharp(Buffer.from(winnerSvg('Japan', flagDataUri))).png().toFile('public/og-square-preview.png');
console.log('Generated: public/og-square-preview.png');
