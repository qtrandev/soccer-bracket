import { getStore } from '@netlify/blobs';
import { RESERVED_SLUGS } from '../../src/data/reservedSlugs.js';
import { TEAMS, GROUPS, R32_MATCHES, R16_MATCHES, QF_MATCHES, SF_MATCHES, FINAL_MATCH } from '../../src/data/tournamentData.js';
import naughtyWords from 'naughty-words';

// Derive valid sets once at module load from the authoritative tournament data
const VALID_TEAM_CODES = new Set(Object.keys(TEAMS));
const VALID_MATCH_IDS = new Set(
  [...R32_MATCHES, ...R16_MATCHES, ...QF_MATCHES, ...SF_MATCHES, FINAL_MATCH].map(m => m.id)
);
const TEAM_GROUP = Object.fromEntries(
  Object.entries(GROUPS).flatMap(([g, { teams }]) => teams.map(t => [t, g]))
);
const VALID_GROUPS = new Set('ABCDEFGHIJKL'.split(''));

// ASCII-safe bad words from major Latin-script languages (slugs are [a-z0-9-] so non-ASCII can't appear)
const ASCII_ONLY = /^[a-z0-9]+$/i;
const BAD_WORDS = new Set(
  ['en','es','fr','de','pt','it','nl','pl','tr','sv','da','no']
    .flatMap(lang => (naughtyWords[lang] ?? []).filter(w => ASCII_ONLY.test(w)).map(w => w.toLowerCase()))
);

// Checks exact words AND hyphen-split bypass (cu-nt) AND stripped substring (f-u-c-k → fuck)
function containsProfanity(slug) {
  // Exact or whole-word match on each hyphen-separated part
  for (const part of slug.split('-')) {
    if (part && BAD_WORDS.has(part)) return true;
  }
  // Substring match on fully stripped slug — catches "cu-nt", "f-u-c-k", etc.
  // Minimum word length 4 to avoid short false positives (e.g. 'am' in Turkish)
  const stripped = slug.replace(/-/g, '');
  for (const word of BAD_WORDS) {
    if (word.length >= 4 && stripped.includes(word)) return true;
  }
  return false;
}

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  const { slug, bracket } = body ?? {};

  if (!slug || typeof slug !== 'string') return json({ error: 'missing_slug' }, 400);
  if (!/^[a-z0-9-]{2,60}$/.test(slug))  return json({ error: 'invalid_slug' }, 400);
  if (RESERVED_SLUGS.has(slug) || containsProfanity(slug)) return json({ error: 'reserved' }, 400);
  if (!bracket || typeof bracket !== 'object') return json({ error: 'missing_bracket' }, 400);
  if (JSON.stringify(bracket).length > 10_000) return json({ error: 'payload_too_large' }, 413);

  // Tournament-aware validation — reject data that can't be a real FIFA 2026 bracket
  const gp = bracket.groupPicks ?? {};
  if (typeof gp !== 'object' || Array.isArray(gp)) return json({ error: 'invalid_shape' }, 400);
  for (const k of Object.keys(gp)) {
    if (!VALID_GROUPS.has(k)) return json({ error: 'invalid_shape' }, 400);
  }
  for (const [k, v] of Object.entries(gp)) {
    if (!Array.isArray(v) || v.length > 4) return json({ error: 'invalid_shape' }, 400);
    const seen = new Set();
    for (const code of v) {
      if (!VALID_TEAM_CODES.has(code)) return json({ error: 'invalid_shape' }, 400);
      if (TEAM_GROUP[code] !== k) return json({ error: 'invalid_shape' }, 400);
      if (seen.has(code)) return json({ error: 'invalid_shape' }, 400);
      seen.add(code);
    }
  }

  const wc = bracket.wildcards ?? [];
  if (!Array.isArray(wc) || wc.length > 8) return json({ error: 'invalid_shape' }, 400);
  const wcSeen = new Set();
  const wcGroups = new Set();
  for (const code of wc) {
    if (!VALID_TEAM_CODES.has(code)) return json({ error: 'invalid_shape' }, 400);
    if (wcSeen.has(code)) return json({ error: 'invalid_shape' }, 400);
    const g = TEAM_GROUP[code];
    if (wcGroups.has(g)) return json({ error: 'invalid_shape' }, 400);
    wcSeen.add(code);
    wcGroups.add(g);
  }

  const kp = bracket.knockoutPicks ?? {};
  if (typeof kp !== 'object' || Array.isArray(kp)) return json({ error: 'invalid_shape' }, 400);
  for (const [k, v] of Object.entries(kp)) {
    if (!VALID_MATCH_IDS.has(k)) return json({ error: 'invalid_shape' }, 400);
    if (v !== null && !VALID_TEAM_CODES.has(v)) return json({ error: 'invalid_shape' }, 400);
  }

  try {
    // strong consistency ensures the read-after-write check is accurate across regions
    const store = getStore({ name: 'brackets', consistency: 'strong' });

    const existing = await store.get(slug, { type: 'json' });
    if (existing !== null) return json({ error: 'taken' }, 409);

    const payload = {
      version: 2,
      slug,
      createdAt: new Date().toISOString(),
      groupPicks:    bracket.groupPicks    ?? {},
      wildcards:     bracket.wildcards     ?? [],
      knockoutPicks: bracket.knockoutPicks ?? {},
    };

    await store.setJSON(slug, payload);

    return json({ ok: true, slug });
  } catch (err) {
    console.error('save-bracket error:', err?.message ?? err);
    return json({ error: 'server_error' }, 500);
  }
};
