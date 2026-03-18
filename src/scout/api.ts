const PADEL_AUSTRIA_BASE = 'https://padel-austria.at'

/**
 * Fetch HTML from padel-austria.at through our CORS proxy.
 * Dev: Vite proxies /api/proxy to padel-austria.at
 * Prod: Cloudflare Pages Function handles /api/proxy
 */
async function fetchHtml(path: string): Promise<string> {
  const url = `/api/proxy?path=${encodeURIComponent(path)}`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Fehler beim Laden von ${path}: ${res.status} ${res.statusText}`)
  }
  return res.text()
}

export async function fetchTournamentHtml(uuid: string): Promise<string> {
  return fetchHtml(`/ranked/tournaments/${uuid}`)
}

export async function fetchPlayerHtml(slug: string): Promise<string> {
  return fetchHtml(`/players/${slug}`)
}

export function getPlayerProfileUrl(slug: string): string {
  return `${PADEL_AUSTRIA_BASE}/players/${slug}`
}

export function getTournamentUrl(uuid: string): string {
  return `${PADEL_AUSTRIA_BASE}/ranked/tournaments/${uuid}`
}
