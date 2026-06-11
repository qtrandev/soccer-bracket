import { getStore } from '@netlify/blobs';
import { autofillBracket } from '../../src/utils/autofill.js';

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

  const { slug } = body ?? {};
  if (!slug || !/^[a-z0-9-]{2,60}$/.test(slug)) return json({ error: 'invalid_slug' }, 400);

  try {
    const store = getStore({ name: 'brackets', consistency: 'strong' });
    const data = await store.get(slug, { type: 'json' });

    if (data === null) return json({ error: 'not_found' }, 404);

    // Already v2 — return it as-is so the client can use it
    if (data.version === 2) return json({ ok: true, migrated: false, bracket: data });

    // Migrate v1 → v2: keep original group picks, re-simulate knockout
    const savedGroupPicks = data.groupPicks ?? {};
    const oldChampion = data.knockoutPicks?.final ?? null;

    const { wildcards, knockoutPicks } = autofillBracket('favorites', oldChampion, savedGroupPicks);

    const payload = {
      version: 2,
      slug: data.slug ?? slug,
      createdAt: data.createdAt,
      groupPicks: savedGroupPicks,
      wildcards,
      knockoutPicks,
    };

    await store.setJSON(slug, payload);

    return json({ ok: true, migrated: true, bracket: payload });
  } catch (err) {
    console.error('migrate-bracket error:', err?.message ?? err);
    return json({ error: 'server_error' }, 500);
  }
};
