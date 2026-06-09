import { getStore } from '@netlify/blobs';

export default async (req) => {
  const url = new URL(req.url);
  const slug = url.searchParams.get('slug');

  if (!slug || !/^[a-z0-9-]{2,60}$/.test(slug)) {
    return new Response(JSON.stringify({ error: 'invalid_slug' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const store = getStore('brackets');
    const data = await store.get(slug, { type: 'json' });

    if (data === null) {
      return new Response(JSON.stringify({ error: 'not_found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' },
    });
  } catch (err) {
    console.error('get-bracket error:', err);
    return new Response(JSON.stringify({ error: 'server_error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const config = { path: '/api/get-bracket' };
