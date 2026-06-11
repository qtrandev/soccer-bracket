import { getStore } from '@netlify/blobs';
import { RESERVED_SLUGS } from '../../src/data/reservedSlugs.js';
import naughtyWords from 'naughty-words';

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
  if (JSON.stringify(bracket).length > 50_000) return json({ error: 'payload_too_large' }, 413);

  // Shape validation — reject structurally invalid payloads
  const VALID_GROUPS = new Set('ABCDEFGHIJKL'.split(''));
  const TEAM_CODE = /^[A-Z]{2,3}$/;
  const MATCH_ID  = /^m\d{2,3}$/;

  const gp = bracket.groupPicks ?? {};
  if (typeof gp !== 'object' || Array.isArray(gp)) return json({ error: 'invalid_shape' }, 400);
  for (const [k, v] of Object.entries(gp)) {
    if (!VALID_GROUPS.has(k)) return json({ error: 'invalid_shape' }, 400);
    if (!Array.isArray(v) || v.length > 4) return json({ error: 'invalid_shape' }, 400);
    if (v.some(c => !TEAM_CODE.test(c))) return json({ error: 'invalid_shape' }, 400);
  }

  const wc = bracket.wildcards ?? [];
  if (!Array.isArray(wc) || wc.length > 8) return json({ error: 'invalid_shape' }, 400);
  if (wc.some(c => !TEAM_CODE.test(c))) return json({ error: 'invalid_shape' }, 400);

  const kp = bracket.knockoutPicks ?? {};
  if (typeof kp !== 'object' || Array.isArray(kp)) return json({ error: 'invalid_shape' }, 400);
  for (const [k, v] of Object.entries(kp)) {
    if (!MATCH_ID.test(k)) return json({ error: 'invalid_shape' }, 400);
    if (v !== null && !TEAM_CODE.test(v)) return json({ error: 'invalid_shape' }, 400);
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
