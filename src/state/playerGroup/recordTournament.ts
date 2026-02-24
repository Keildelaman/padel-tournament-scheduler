import type { Tournament, LeaderboardEntry, TournamentRecord, MatchRecord } from '../../types'

export function buildTournamentRecord(tournament: Tournament, leaderboard: LeaderboardEntry[]): TournamentRecord {
  const matches: MatchRecord[] = []

  for (const round of tournament.rounds) {
    for (const match of round.matches) {
      matches.push({
        round: round.roundNumber,
        court: match.courtIndex,
        team1: {
          playerIds: match.team1,
          score: match.score1 ?? 0,
        },
        team2: {
          playerIds: match.team2,
          score: match.score2 ?? 0,
        },
        winner: match.winner,
      })
    }
  }

  return {
    id: tournament.id,
    date: new Date().toISOString(),
    name: tournament.name,
    config: {
      courts: tournament.courts,
      totalRounds: tournament.totalRounds,
      scoringMode: tournament.scoringConfig.mode,
      pointsPerMatch: tournament.scoringConfig.pointsPerMatch,
      openEnded: tournament.openEnded ?? false,
    },
    playerIds: tournament.players.map(p => p.id),
    matches,
    excluded: false,
    leaderboardSnapshot: leaderboard.map(e => ({
      playerId: e.playerId,
      rank: e.rank,
      points: e.points,
      wins: e.wins,
      losses: e.losses,
      gamesPlayed: e.gamesPlayed,
      pointDifferential: e.pointDifferential,
    })),
  }
}
