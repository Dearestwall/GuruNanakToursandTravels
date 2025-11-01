// Netlify Function: GET /.netlify/functions/proxy?url=https://api.example.com/data
export async function handler(event) {
  const origin = event.headers.origin || '';
  const allowed = ['https://dearestwall.github.io', 'https://dearestwall.github.io/GuruNanakToursandTravels'];
  const allowOrigin = allowed.includes(origin) ? origin : 'https://dearestwall.github.io';

  const url = event.queryStringParameters?.url;
  if (!url) {
    return {
      statusCode: 400,
      headers: {
        'access-control-allow-origin': allowOrigin,
        'access-control-allow-methods': 'GET,OPTIONS',
      },
      body: JSON.stringify({ error: 'Missing url parameter' }),
    };
  }

  try {
    const upstream = await fetch(url, { headers: { 'accept': 'application/json' } });
    const body = await upstream.text();
    return {
      statusCode: upstream.status,
      headers: {
        'content-type': upstream.headers.get('content-type') || 'application/json',
        'access-control-allow-origin': allowOrigin,
        'access-control-allow-methods': 'GET,OPTIONS',
      },
      body,
    };
  } catch (e) {
    return {
      statusCode: 502,
      headers: {
        'access-control-allow-origin': allowOrigin,
        'access-control-allow-methods': 'GET,OPTIONS',
      },
      body: JSON.stringify({ error: 'Upstream fetch failed' }),
    };
  }
}
