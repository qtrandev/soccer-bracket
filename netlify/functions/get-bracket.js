import { getStore } from '@netlify/blobs';

const json = (data, status = 200, extra = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...extra },
  });

export default async (req) => {
  const url = new URL(req.url);
  const slug = url.searchParams.get('slug');

  if (!slug || !/^[a-z0-9-]{2,60}$/.test(slug)) return json({ error: 'invalid_slug' }, 400);

  try {
    // strong consistency ensures we see writes from any region immediately
    const store = getStore({ name: 'brackets', consistency: 'strong' });
    const data = await store.get(slug, { type: 'json' });

    if (data === null) return json({ error: 'not_found' }, 404);

    return json(data, 200, { 'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600' });
  } catch (err) {
    console.error('get-bracket error:', err?.message ?? err);
    return json({ error: 'server_error' }, 500);
  }
};
