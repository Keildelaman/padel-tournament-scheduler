// Cloudflare Pages Function: CORS proxy to padel-austria.at
// Deployed automatically when in /functions directory on Cloudflare Pages

interface Env {}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url)
  const path = url.searchParams.get('path')

  if (!path) {
    return new Response('Missing ?path= parameter', { status: 400 })
  }

  // Only allow proxying to padel-austria.at
  const targetUrl = `https://padel-austria.at${path}`

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PadelGaudi/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
      },
    })

    const html = await response.text()

    return new Response(html, {
      status: response.status,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300', // 5 min cache
      },
    })
  } catch (err) {
    return new Response(`Proxy error: ${err}`, { status: 502 })
  }
}
