import { getStore } from '@netlify/blobs';

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'invalid_json' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { slug, bracket } = body ?? {};

  if (!slug || typeof slug !== 'string') {
    return new Response(JSON.stringify({ error: 'missing_slug' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Validate slug format: only lowercase letters, digits, hyphens, max 60 chars
  if (!/^[a-z0-9-]{2,60}$/.test(slug)) {
    return new Response(JSON.stringify({ error: 'invalid_slug' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!bracket || typeof bracket !== 'object') {
    return new Response(JSON.stringify({ error: 'missing_bracket' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const store = getStore('brackets');

    // Check if slug is already taken
    const existing = await store.get(slug, { type: 'json' }).catch(() => null);
    if (existing !== null) {
      return new Response(JSON.stringify({ error: 'taken' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Save bracket (strip any injected fields, re-attach slug + timestamp)
    const payload = {
      version: 1,
      slug,
      createdAt: new Date().toISOString(),
      groupPicks: bracket.groupPicks ?? {},
      wildcards: bracket.wildcards ?? [],
      knockoutPicks: bracket.knockoutPicks ?? {},
    };

    await store.setJSON(slug, payload);

    return new Response(JSON.stringify({ ok: true, slug }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('save-bracket error:', err);
    return new Response(JSON.stringify({ error: 'server_error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

