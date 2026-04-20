export function GET() {
  const key = process.env.INDEXNOW_KEY;
  if (!key || key.toLowerCase().includes('replace_me')) {
    return new Response('IndexNow key is not configured.', {
      status: 404,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  }

  return new Response(key, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
