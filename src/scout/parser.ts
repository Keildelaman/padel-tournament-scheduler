import type { ScoutPlayer, ScoutTournamentResult, UpcomingTournament } from './types'

// ── Tournament page ────────────────────────────────────────────────

type ParsedTeamRow = {
  rank: number
  player1Name: string
  player1Slug: string
  player2Name: string
  player2Slug: string
  teamPoints: number
  teamApn: number
}

export function parseTournamentPage(html: string): {
  name: string
  date: string
  time: string
  location: string
  category: string
  teams: ParsedTeamRow[]
} {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const bodyText = doc.body.textContent ?? ''

  const heading = doc.querySelector('h1, h2')?.textContent?.trim() ?? 'Unknown Tournament'

  // Date: "24. März 2026" or "24.03.2026"
  const dateMatch = bodyText.match(
    /(\d{1,2}\.\s*(?:Jänner|Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember)\s*\d{4})/i
  ) ?? bodyText.match(/(\d{1,2}\.\d{1,2}\.\d{4})/)
  const date = dateMatch?.[1] ?? ''

  // Time: "18:30 - 23:00"
  const timeMatch = bodyText.match(/(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/)
  const time = timeMatch ? `${timeMatch[1]} - ${timeMatch[2]}` : ''

  const categoryMatch = bodyText.match(/(Starter|Advanced|Newcomer|Open|Mixed)/i)
  const category = categoryMatch?.[1] ?? ''

  const locationMatch = bodyText.match(/(PADELDOME[^,\n]*|Padeldome[^,\n]*|PD\s+\S+)/i)
  const location = locationMatch?.[1]?.trim() ?? ''

  // ── Split main teams from waitlist ───
  // The waitlist is marked by text "Warteliste" in the page.
  // We collect all player links, then stop when we hit the waitlist boundary.
  const allElements = Array.from(doc.body.querySelectorAll('*'))

  // Find the waitlist boundary element
  let waitlistBoundary: Element | null = null
  for (const el of allElements) {
    const text = el.textContent?.trim() ?? ''
    // Match "Warteliste" or "Warteliste (8)" etc - but only on elements whose OWN text includes it
    if (el.children.length === 0 || el.childNodes.length <= 3) {
      if (/Warteliste/i.test(text) && text.length < 30) {
        waitlistBoundary = el
        break
      }
    }
  }

  // Collect player links that come BEFORE the waitlist boundary
  const playerLinks = doc.querySelectorAll('a[href*="/players/"]')
  const mainPlayerPairs: { name: string; slug: string }[] = []

  for (const link of playerLinks) {
    // If we have a waitlist boundary, skip links that are inside/after it
    if (waitlistBoundary && (waitlistBoundary.contains(link) || isAfterInDOM(waitlistBoundary, link))) {
      continue
    }

    const href = link.getAttribute('href') ?? ''
    const slugMatch = href.match(/\/players\/([a-z0-9äöüß-]+)/i)
    if (slugMatch) {
      mainPlayerPairs.push({
        name: link.textContent?.trim() ?? '',
        slug: slugMatch[1].toLowerCase(),
      })
    }
  }

  // Pair up into teams (2 players per team)
  const teams: ParsedTeamRow[] = []
  for (let i = 0; i + 1 < mainPlayerPairs.length; i += 2) {
    teams.push({
      rank: Math.floor(i / 2) + 1,
      player1Name: mainPlayerPairs[i].name,
      player1Slug: mainPlayerPairs[i].slug,
      player2Name: mainPlayerPairs[i + 1].name,
      player2Slug: mainPlayerPairs[i + 1].slug,
      teamPoints: 0,
      teamApn: 0,
    })
  }

  // Try to extract APN/points from table rows containing player links
  const rows = doc.querySelectorAll('tr, [class*="row"], [class*="team"]')
  let teamIdx = 0
  rows.forEach(row => {
    if (waitlistBoundary && (waitlistBoundary.contains(row) || isAfterInDOM(waitlistBoundary, row))) return
    const links = row.querySelectorAll('a[href*="/players/"]')
    if (links.length >= 2 && teamIdx < teams.length) {
      const text = row.textContent ?? ''
      // APN uses comma as decimal in German: "1,235"
      const apnMatch = text.match(/\b(\d)[,.](\d{3})\b/)
      if (apnMatch) teams[teamIdx].teamApn = parseFloat(`${apnMatch[1]}.${apnMatch[2]}`)

      // Points: a larger number (team ranking points)
      const nums = [...text.matchAll(/\b(\d{2,5})\b/g)].map(m => parseInt(m[1]))
      const pointsCandidate = nums.find(n => n >= 10)
      if (pointsCandidate) teams[teamIdx].teamPoints = pointsCandidate

      teamIdx++
    }
  })

  return { name: heading, date, time, location, category, teams }
}

/** Check if `a` appears before `b` in document order. */
function isAfterInDOM(reference: Element, target: Element): boolean {
  const pos = reference.compareDocumentPosition(target)
  // DOCUMENT_POSITION_FOLLOWING = 4
  return (pos & 4) !== 0
}

// ── Player profile page ────────────────────────────────────────────

export function parsePlayerPage(html: string, name: string, slug: string): ScoutPlayer {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const bodyText = doc.body.textContent ?? ''

  // Player ID: "#1008537"
  const idMatch = bodyText.match(/#(\d{5,})/)
  const playerId = idMatch ? `#${idMatch[1]}` : undefined

  // Ranking: "Platz: 1216" or "Platz:1216"
  const rankMatch = bodyText.match(/Platz[:\s]+(\d+)/i)
  const ranking = rankMatch ? parseInt(rankMatch[1]) : undefined

  // Points: "Punkte: 2740" or "Punkte:2.740"
  const pointsMatch = bodyText.match(/Punkte[:\s]+([\d.]+)/i)
  const points = pointsMatch ? parseInt(pointsMatch[1].replace(/\./g, '')) : 0

  // Match stats - exact German labels from padel-austria.at:
  // "Matches Gespielt" "Matches Gewonnen" "Matches Verloren" "Effektivität"
  const matchesPlayed = extractNumber(bodyText, /Matches\s+Gespielt\D*?(\d+)/i)
  const matchesWon = extractNumber(bodyText, /Matches\s+Gewonnen\D*?(\d+)/i)
  const matchesLost = extractNumber(bodyText, /Matches\s+Verloren\D*?(\d+)/i)

  // Effektivität: "38,37%" (German comma decimal)
  const effMatch = bodyText.match(/Effektivit[äa]t\D*?([\d,]+)%/i)
  const winRate = effMatch
    ? parseFloat(effMatch[1].replace(',', '.'))
    : (matchesPlayed > 0 ? (matchesWon / matchesPlayed) * 100 : 0)

  // APN: "1,000" or "2,234" (German format with comma)
  const apnMatch = bodyText.match(/APN\D{0,5}?(\d[,.]?\d{3})/i)
  const apn = apnMatch ? parseFloat(apnMatch[1].replace(',', '.')) : 1.0

  // Tournament history from "Zusammensetzung der Punkte" table
  const tournamentHistory: ScoutTournamentResult[] = []
  const tableRows = doc.querySelectorAll('tr')
  tableRows.forEach(row => {
    const cells = row.querySelectorAll('td')
    if (cells.length >= 3) {
      const rowText = row.textContent ?? ''
      const dateInRow = rowText.match(/(\d{1,2}\.\d{1,2}\.\d{4})/)
      if (!dateInRow) return

      const link = row.querySelector('a')
      const tournamentName = link?.textContent?.trim() ?? ''
      if (!tournamentName || /^\d+$/.test(tournamentName)) return

      const catInRow = rowText.match(/(Starter|Advanced|Newcomer|Mixed|Open)/i)
      // Points earned: first standalone number in the row
      const ptsMatch = rowText.match(/^\s*(\d+)\s/)
        ?? rowText.match(/(\d+)\s/)
      const pts = ptsMatch ? parseInt(ptsMatch[1]) : 0

      tournamentHistory.push({
        name: tournamentName,
        date: dateInRow[1],
        category: catInRow?.[1] ?? '',
        pointsEarned: pts,
      })
    }
  })

  // Partners: collect all linked player names
  const partners: string[] = []
  doc.querySelectorAll('a[href*="/players/"]').forEach(link => {
    const pName = link.textContent?.trim()
    if (pName && pName !== name && !partners.includes(pName)) {
      partners.push(pName)
    }
  })

  return {
    name,
    profileSlug: slug,
    playerId,
    ranking,
    points,
    apn,
    matchesPlayed,
    matchesWon,
    matchesLost,
    winRate: Math.round(winRate * 100) / 100,
    tournamentHistory,
    partners,
  }
}

// ── Player profile: upcoming tournaments ───────────────────────────

export function parseUpcomingTournaments(html: string): UpcomingTournament[] {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const tournaments: UpcomingTournament[] = []

  // Upcoming tournaments are linked as /ranked/tournaments/UUID
  const links = doc.querySelectorAll('a[href*="/ranked/tournaments/"]')
  links.forEach(link => {
    const href = link.getAttribute('href') ?? ''
    const uuid = extractTournamentUuid(href)
    if (!uuid) return

    const name = link.textContent?.trim() ?? ''
    if (!name) return

    // Try to find date near this link
    const parent = link.closest('tr, div, li, section') ?? link.parentElement
    const parentText = parent?.textContent ?? ''
    const dateMatch = parentText.match(
      /(\w{2}\.\s*\d{1,2}\.\d{2}\.\d{4}[^)]*)/i
    ) ?? parentText.match(/(\d{1,2}\.\d{1,2}\.\d{4}[^)]*)/i)
    const date = dateMatch?.[1]?.trim() ?? ''

    tournaments.push({ name, date, uuid })
  })

  return tournaments
}

// ── Name → slug conversion ─────────────────────────────────────────

/**
 * Convert a display name to a padel-austria.at profile slug.
 * "Manuel Keilman" → "keilman-manuel"
 * "Hans-Peter Gaube" → "gaube-hans-peter"
 */
export function nameToSlug(displayName: string): string {
  const parts = displayName.trim().split(/\s+/)
  if (parts.length < 2) return parts[0]?.toLowerCase() ?? ''

  const lastName = parts[parts.length - 1]
  const firstName = parts.slice(0, -1).join('-')

  return `${lastName}-${firstName}`
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9-]/g, '')
}

// ── UUID extraction ────────────────────────────────────────────────

export function extractTournamentUuid(input: string): string | null {
  const match = input.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i)
  return match ? match[1] : null
}

// ── Helpers ─────────────────────────────────────────────────────────

function extractNumber(text: string, pattern: RegExp): number {
  const match = text.match(pattern)
  return match ? parseInt(match[1]) : 0
}
