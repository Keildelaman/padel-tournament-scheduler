import { useState, useCallback } from 'react'
import type { ScoutTournament, ScoutTeam, ScoutPlayer, ScoutLoadingState, PlayerProfile, UpcomingTournament } from './types'
import { fetchTournamentHtml, fetchPlayerHtml } from './api'
import { parseTournamentPage, parsePlayerPage, parseUpcomingTournaments, extractTournamentUuid, nameToSlug } from './parser'

const STORAGE_KEY = 'padelgaudi-scout'
const PROFILE_KEY = 'padelgaudi-scout-profile'

function loadCachedTournament(): ScoutTournament | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function saveCachedTournament(data: ScoutTournament) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch { /* ignore */ }
}

function loadCachedProfile(): PlayerProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function saveCachedProfile(data: PlayerProfile) {
  try { localStorage.setItem(PROFILE_KEY, JSON.stringify(data)) } catch { /* ignore */ }
}

export function useScout() {
  const [tournament, setTournament] = useState<ScoutTournament | null>(loadCachedTournament)
  const [profile, setProfile] = useState<PlayerProfile | null>(loadCachedProfile)
  const [loadingState, setLoadingState] = useState<ScoutLoadingState>({ phase: 'idle' })

  /** Search for a player by name, load their profile and upcoming tournaments. */
  const searchPlayer = useCallback(async (input: string) => {
    const slug = nameToSlug(input)
    if (!slug) {
      setLoadingState({ phase: 'error', message: 'Bitte gib einen Namen ein (z.B. "Manuel Keilman").' })
      return
    }

    try {
      setLoadingState({ phase: 'loading-profile' })

      const html = await fetchPlayerHtml(slug)
      const upcoming = parseUpcomingTournaments(html)

      // Extract the display name from the HTML if possible
      const doc = new DOMParser().parseFromString(html, 'text/html')
      const h1 = doc.querySelector('h1, h2')?.textContent?.trim()
      const displayName = h1 || input.trim()

      const result: PlayerProfile = {
        name: displayName,
        slug,
        upcomingTournaments: upcoming,
      }

      setProfile(result)
      saveCachedProfile(result)
      setTournament(null)
      setLoadingState({ phase: 'done' })
    } catch {
      setLoadingState({
        phase: 'error',
        message: `Spieler "${input}" nicht gefunden. Probiere den vollen Namen (Vorname Nachname).`,
      })
    }
  }, [])

  /** Load a specific tournament by UUID. */
  const loadTournament = useCallback(async (uuid: string) => {
    try {
      setLoadingState({ phase: 'loading-tournament' })

      const tournamentHtml = await fetchTournamentHtml(uuid)
      const parsed = parseTournamentPage(tournamentHtml)

      if (parsed.teams.length === 0) {
        setLoadingState({ phase: 'error', message: 'Keine Teams gefunden. Ist die Turnier-URL korrekt?' })
        return
      }

      const totalPlayers = parsed.teams.length * 2
      setLoadingState({ phase: 'loading-players', loaded: 0, total: totalPlayers })

      // Fetch player profiles in pairs (2 at a time per team)
      const teams: ScoutTeam[] = []
      let loadedCount = 0

      for (const team of parsed.teams) {
        const [p1Html, p2Html] = await Promise.all([
          fetchPlayerHtml(team.player1Slug).catch(() => ''),
          fetchPlayerHtml(team.player2Slug).catch(() => ''),
        ])

        const player1 = p1Html
          ? parsePlayerPage(p1Html, team.player1Name, team.player1Slug)
          : createEmptyPlayer(team.player1Name, team.player1Slug)
        const player2 = p2Html
          ? parsePlayerPage(p2Html, team.player2Name, team.player2Slug)
          : createEmptyPlayer(team.player2Name, team.player2Slug)

        teams.push({
          rank: team.rank,
          player1,
          player2,
          teamPoints: team.teamPoints,
          teamApn: team.teamApn,
        })

        loadedCount += 2
        setLoadingState({ phase: 'loading-players', loaded: loadedCount, total: totalPlayers })
      }

      const result: ScoutTournament = {
        name: parsed.name,
        date: parsed.date,
        time: parsed.time,
        location: parsed.location,
        category: parsed.category,
        teams,
        uuid,
      }

      setTournament(result)
      saveCachedTournament(result)
      setLoadingState({ phase: 'done' })
    } catch (err) {
      setLoadingState({ phase: 'error', message: `Fehler: ${err instanceof Error ? err.message : String(err)}` })
    }
  }, [])

  /** Handle any input: name, URL, or UUID. */
  const search = useCallback(async (input: string) => {
    const trimmed = input.trim()
    if (!trimmed) return

    // If it looks like a UUID or URL, load tournament directly
    const uuid = extractTournamentUuid(trimmed)
    if (uuid) {
      await loadTournament(uuid)
      return
    }

    // Otherwise treat as player name
    await searchPlayer(trimmed)
  }, [loadTournament, searchPlayer])

  const clear = useCallback(() => {
    setTournament(null)
    setProfile(null)
    setLoadingState({ phase: 'idle' })
    try {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(PROFILE_KEY)
    } catch { /* ignore */ }
  }, [])

  const backToProfile = useCallback(() => {
    setTournament(null)
    try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
    setLoadingState({ phase: 'done' })
  }, [])

  return { tournament, profile, loadingState, search, loadTournament, backToProfile, clear }
}

function createEmptyPlayer(name: string, slug: string): ScoutPlayer {
  return {
    name,
    profileSlug: slug,
    points: 0,
    apn: 1.0,
    matchesPlayed: 0,
    matchesWon: 0,
    matchesLost: 0,
    winRate: 0,
    tournamentHistory: [],
    partners: [],
  }
}
