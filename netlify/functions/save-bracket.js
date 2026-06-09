import { getStore } from '@netlify/blobs';

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
  if (!bracket || typeof bracket !== 'object') return json({ error: 'missing_bracket' }, 400);

  try {
    // strong consistency ensures the read-after-write check is accurate across regions
    const store = getStore({ name: 'brackets', consistency: 'strong' });

    const existing = await store.get(slug, { type: 'json' });
    if (existing !== null) return json({ error: 'taken' }, 409);

    const payload = {
      version: 1,
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
    return json({ error: 'server_error', detail: err?.message }, 500);
  }
};
