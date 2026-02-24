import type { Tournament, ScoringMode, PlayerStats, LeaderboardEntry, RoundResult } from '../types'

function usesPointScoring(mode: ScoringMode): boolean {
  return mode === 'points' || mode === 'pointsToWin' || mode === 'timed'
}

export function getPlayerStats(tournament: Tournament): PlayerStats[] {
  const statsMap = new Map<string, PlayerStats>()

  for (const player of tournament.players) {
    statsMap.set(player.id, {
      playerId: player.id,
      playerName: player.name,
      points: 0,
      wins: 0,
      losses: 0,
      gamesPlayed: 0,
      gamesPaused: 0,
      pointDifferential: 0,
      roundResults: [],
    })
  }

  for (const round of tournament.rounds) {
    // Mark paused players
    for (const pid of round.pausedPlayerIds) {
      const stats = statsMap.get(pid)!
      stats.gamesPaused++
      stats.roundResults.push({ roundNumber: round.roundNumber, paused: true })
    }

    for (const match of round.matches) {
      const allIds = [...match.team1, ...match.team2]

      for (const pid of allIds) {
        const stats = statsMap.get(pid)!
        stats.gamesPlayed++

        const isTeam1 = match.team1.includes(pid)
        const partnerId = isTeam1
          ? match.team1.find(id => id !== pid)!
          : match.team2.find(id => id !== pid)!
        const opponentIds: [string, string] = isTeam1 ? match.team2 : match.team1

        const roundResult: RoundResult = {
          roundNumber: round.roundNumber,
          paused: false,
          courtIndex: match.courtIndex,
          partnerId,
          opponentIds,
        }

        if (usesPointScoring(tournament.scoringConfig.mode)) {
          if (match.score1 != null && match.score2 != null) {
            const myScore = isTeam1 ? match.score1 : match.score2
            const theirScore = isTeam1 ? match.score2 : match.score1
            stats.points += myScore
            stats.pointDifferential += myScore - theirScore
            roundResult.pointsScored = myScore
            roundResult.pointsConceded = theirScore

            if (myScore > theirScore) {
              stats.wins++
              roundResult.won = true
            } else if (myScore < theirScore) {
              stats.losses++
              roundResult.won = false
            }
          }
        } else {
          // Win/loss mode
          if (match.winner != null) {
            const myTeam = isTeam1 ? 1 : 2
            if (match.winner === myTeam) {
              stats.wins++
              stats.points += 1
              roundResult.won = true
            } else {
              stats.losses++
              roundResult.won = false
            }
          }
        }

        stats.roundResults.push(roundResult)
      }
    }
  }

  return Array.from(statsMap.values())
}

export function getLeaderboard(tournament: Tournament): LeaderboardEntry[] {
  const stats = getPlayerStats(tournament)

  // Sort: Points desc -> Wins desc -> Point differential desc -> Head-to-head -> Alphabetical
  stats.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.wins !== a.wins) return b.wins - a.wins
    if (b.pointDifferential !== a.pointDifferential) return b.pointDifferential - a.pointDifferential
    return a.playerName.localeCompare(b.playerName)
  })

  return stats.map((s, i) => ({ ...s, rank: i + 1 }))
}

export function isRoundComplete(tournament: Tournament, roundNumber: number): boolean {
  const round = tournament.rounds.find(r => r.roundNumber === roundNumber)
  if (!round) return false

  if (usesPointScoring(tournament.scoringConfig.mode)) {
    return round.matches.every(m => m.score1 != null && m.score2 != null)
  }
  return round.matches.every(m => m.winner != null)
}

export function canAdvanceRound(tournament: Tournament, roundNumber: number): boolean {
  if (tournament.openEnded) return isRoundComplete(tournament, roundNumber)
  return isRoundComplete(tournament, roundNumber) && roundNumber < tournament.totalRounds
}

export function getPartnerMatrix(tournament: Tournament): { matrix: number[][]; playerIds: string[] } {
  const playerIds = tournament.players.map(p => p.id)
  const n = playerIds.length
  const idIdx = new Map(playerIds.map((id, i) => [id, i]))
  const matrix = Array.from({ length: n }, () => new Array(n).fill(0))

  for (const round of tournament.rounds) {
    for (const match of round.matches) {
      const [a, b] = match.team1.map(id => idIdx.get(id)!)
      const [c, d] = match.team2.map(id => idIdx.get(id)!)
      matrix[a][b]++; matrix[b][a]++
      matrix[c][d]++; matrix[d][c]++
    }
  }
  return { matrix, playerIds }
}

export function getOpponentMatrix(tournament: Tournament): { matrix: number[][]; playerIds: string[] } {
  const playerIds = tournament.players.map(p => p.id)
  const n = playerIds.length
  const idIdx = new Map(playerIds.map((id, i) => [id, i]))
  const matrix = Array.from({ length: n }, () => new Array(n).fill(0))

  for (const round of tournament.rounds) {
    for (const match of round.matches) {
      for (const a of match.team1) {
        for (const b of match.team2) {
          const ai = idIdx.get(a)!
          const bi = idIdx.get(b)!
          matrix[ai][bi]++; matrix[bi][ai]++
        }
      }
    }
  }
  return { matrix, playerIds }
}
