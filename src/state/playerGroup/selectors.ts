import type { PlayerGroup, RegisteredPlayer, TournamentRecord } from '../../types'
import type { PlayerGroupState } from './actions'

// --- Phase 1: Basic lookups ---

export function getActiveGroup(state: PlayerGroupState): PlayerGroup | null {
  const id = state.index.activeGroupId
  if (!id) return null
  return state.groups[id] ?? null
}

export function getRegisteredPlayerByName(group: PlayerGroup, name: string): RegisteredPlayer | undefined {
  const lower = name.toLowerCase()
  return group.players.find(p => p.name.toLowerCase() === lower)
}

export function getNonArchivedPlayers(group: PlayerGroup): RegisteredPlayer[] {
  return group.players.filter(p => !p.archived)
}

// --- Phase 4: Stat computation ---

export interface PlayerOverviewStats {
  playerId: string
  name: string
  tournamentsPlayed: number
  totalMatches: number
  wins: number
  losses: number
  winRate: number
  lastActive: string | null
  archived: boolean
}

export interface PlayerDetailStats extends PlayerOverviewStats {
  pointsScored: number
  pointsConceded: number
  pointDifferential: number
  avgPointsPerMatch: number
  currentWinStreak: number
  bestWinStreak: number
  recentForm: ('W' | 'L')[]
  bestTournamentRank: number | null
  worstTournamentRank: number | null
}

export interface PartnerStats {
  partnerId: string
  partnerName: string
  matchesTogether: number
  winsTogether: number
  winRate: number
}

export interface OpponentStats {
  opponentId: string
  opponentName: string
  matchesAgainst: number
  winsAgainst: number
  winRate: number
}

export interface TournamentHistoryEntry {
  tournamentId: string
  date: string
  name: string
  rank: number
  totalPlayers: number
  wins: number
  losses: number
  points: number
  excluded: boolean
}

function getIncludedTournaments(group: PlayerGroup): TournamentRecord[] {
  return group.tournamentHistory.filter(t => !t.excluded)
}

function playerInMatch(playerId: string, match: { team1: { playerIds: [string, string] }; team2: { playerIds: [string, string] } }): boolean {
  return match.team1.playerIds.includes(playerId) || match.team2.playerIds.includes(playerId)
}

function didPlayerWin(playerId: string, match: { team1: { playerIds: [string, string]; score: number }; team2: { playerIds: [string, string]; score: number }; winner?: 1 | 2 }): boolean | null {
  const isTeam1 = match.team1.playerIds.includes(playerId)
  if (match.winner != null) {
    return match.winner === (isTeam1 ? 1 : 2)
  }
  const myScore = isTeam1 ? match.team1.score : match.team2.score
  const theirScore = isTeam1 ? match.team2.score : match.team1.score
  if (myScore > theirScore) return true
  if (myScore < theirScore) return false
  return null
}

export function getPlayerOverviewStats(group: PlayerGroup): PlayerOverviewStats[] {
  const tournaments = getIncludedTournaments(group)
  const playerMap = new Map<string, RegisteredPlayer>()
  for (const p of group.players) playerMap.set(p.id, p)

  return group.players.map(player => {
    let tournamentsPlayed = 0
    let totalMatches = 0
    let wins = 0
    let losses = 0
    let lastActive: string | null = null

    for (const t of tournaments) {
      if (!t.playerIds.includes(player.id)) continue
      tournamentsPlayed++
      if (!lastActive || t.date > lastActive) lastActive = t.date

      for (const match of t.matches) {
        if (!playerInMatch(player.id, match)) continue
        totalMatches++
        const won = didPlayerWin(player.id, match)
        if (won === true) wins++
        else if (won === false) losses++
      }
    }

    return {
      playerId: player.id,
      name: player.name,
      tournamentsPlayed,
      totalMatches,
      wins,
      losses,
      winRate: totalMatches > 0 ? wins / totalMatches : 0,
      lastActive,
      archived: player.archived,
    }
  })
}

export function getPlayerDetailStats(group: PlayerGroup, playerId: string): PlayerDetailStats | null {
  const player = group.players.find(p => p.id === playerId)
  if (!player) return null

  const tournaments = getIncludedTournaments(group)
  let tournamentsPlayed = 0
  let totalMatches = 0
  let wins = 0
  let losses = 0
  let pointsScored = 0
  let pointsConceded = 0
  let lastActive: string | null = null
  let bestTournamentRank: number | null = null
  let worstTournamentRank: number | null = null

  const allResults: ('W' | 'L')[] = []
  let currentWinStreak = 0
  let bestWinStreak = 0
  let streak = 0

  for (const t of tournaments) {
    if (!t.playerIds.includes(playerId)) continue
    tournamentsPlayed++
    if (!lastActive || t.date > lastActive) lastActive = t.date

    const snapshot = t.leaderboardSnapshot.find(s => s.playerId === playerId)
    if (snapshot) {
      if (bestTournamentRank === null || snapshot.rank < bestTournamentRank) bestTournamentRank = snapshot.rank
      if (worstTournamentRank === null || snapshot.rank > worstTournamentRank) worstTournamentRank = snapshot.rank
    }

    for (const match of t.matches) {
      if (!playerInMatch(playerId, match)) continue
      totalMatches++

      const isTeam1 = match.team1.playerIds.includes(playerId)
      const myScore = isTeam1 ? match.team1.score : match.team2.score
      const theirScore = isTeam1 ? match.team2.score : match.team1.score
      pointsScored += myScore
      pointsConceded += theirScore

      const won = didPlayerWin(playerId, match)
      if (won === true) {
        wins++
        streak++
        if (streak > bestWinStreak) bestWinStreak = streak
        allResults.push('W')
      } else if (won === false) {
        losses++
        streak = 0
        allResults.push('L')
      }
    }
  }

  // Current win streak: count from end of allResults
  currentWinStreak = 0
  for (let i = allResults.length - 1; i >= 0; i--) {
    if (allResults[i] === 'W') currentWinStreak++
    else break
  }

  return {
    playerId: player.id,
    name: player.name,
    tournamentsPlayed,
    totalMatches,
    wins,
    losses,
    winRate: totalMatches > 0 ? wins / totalMatches : 0,
    lastActive,
    archived: player.archived,
    pointsScored,
    pointsConceded,
    pointDifferential: pointsScored - pointsConceded,
    avgPointsPerMatch: totalMatches > 0 ? pointsScored / totalMatches : 0,
    currentWinStreak,
    bestWinStreak,
    recentForm: allResults.slice(-10),
    bestTournamentRank,
    worstTournamentRank,
  }
}

export function getPlayerPartnerStats(group: PlayerGroup, playerId: string): PartnerStats[] {
  const tournaments = getIncludedTournaments(group)
  const playerMap = new Map<string, RegisteredPlayer>()
  for (const p of group.players) playerMap.set(p.id, p)

  const partnerData = new Map<string, { matches: number; wins: number }>()

  for (const t of tournaments) {
    for (const match of t.matches) {
      if (!playerInMatch(playerId, match)) continue
      const isTeam1 = match.team1.playerIds.includes(playerId)
      const team = isTeam1 ? match.team1.playerIds : match.team2.playerIds
      const partnerId = team.find(id => id !== playerId)
      if (!partnerId) continue

      const data = partnerData.get(partnerId) ?? { matches: 0, wins: 0 }
      data.matches++
      const won = didPlayerWin(playerId, match)
      if (won === true) data.wins++
      partnerData.set(partnerId, data)
    }
  }

  return Array.from(partnerData.entries())
    .map(([partnerId, data]) => ({
      partnerId,
      partnerName: playerMap.get(partnerId)?.name ?? 'Unknown',
      matchesTogether: data.matches,
      winsTogether: data.wins,
      winRate: data.matches > 0 ? data.wins / data.matches : 0,
    }))
    .sort((a, b) => b.matchesTogether - a.matchesTogether)
}

export function getPlayerOpponentStats(group: PlayerGroup, playerId: string): OpponentStats[] {
  const tournaments = getIncludedTournaments(group)
  const playerMap = new Map<string, RegisteredPlayer>()
  for (const p of group.players) playerMap.set(p.id, p)

  const opponentData = new Map<string, { matches: number; wins: number }>()

  for (const t of tournaments) {
    for (const match of t.matches) {
      if (!playerInMatch(playerId, match)) continue
      const isTeam1 = match.team1.playerIds.includes(playerId)
      const opponents = isTeam1 ? match.team2.playerIds : match.team1.playerIds

      for (const oppId of opponents) {
        const data = opponentData.get(oppId) ?? { matches: 0, wins: 0 }
        data.matches++
        const won = didPlayerWin(playerId, match)
        if (won === true) data.wins++
        opponentData.set(oppId, data)
      }
    }
  }

  return Array.from(opponentData.entries())
    .map(([opponentId, data]) => ({
      opponentId,
      opponentName: playerMap.get(opponentId)?.name ?? 'Unknown',
      matchesAgainst: data.matches,
      winsAgainst: data.wins,
      winRate: data.matches > 0 ? data.wins / data.matches : 0,
    }))
    .sort((a, b) => b.matchesAgainst - a.matchesAgainst)
}

export function getPlayerTournamentHistory(group: PlayerGroup, playerId: string): TournamentHistoryEntry[] {
  return group.tournamentHistory
    .filter(t => t.playerIds.includes(playerId))
    .map(t => {
      const snapshot = t.leaderboardSnapshot.find(s => s.playerId === playerId)
      return {
        tournamentId: t.id,
        date: t.date,
        name: t.name,
        rank: snapshot?.rank ?? 0,
        totalPlayers: t.playerIds.length,
        wins: snapshot?.wins ?? 0,
        losses: snapshot?.losses ?? 0,
        points: snapshot?.points ?? 0,
        excluded: t.excluded,
      }
    })
    .sort((a, b) => b.date.localeCompare(a.date))
}
