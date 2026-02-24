export interface RegisteredPlayer {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  archived: boolean
}

export interface MatchRecord {
  round: number
  court: number
  team1: { playerIds: [string, string]; score: number }
  team2: { playerIds: [string, string]; score: number }
  winner?: 1 | 2
}

export interface TournamentRecord {
  id: string
  date: string
  name: string
  config: {
    courts: number
    totalRounds: number
    scoringMode: string
    pointsPerMatch: number
    openEnded: boolean
  }
  playerIds: string[]
  matches: MatchRecord[]
  excluded: boolean
  leaderboardSnapshot: Array<{
    playerId: string
    rank: number
    points: number
    wins: number
    losses: number
    gamesPlayed: number
    pointDifferential: number
  }>
}

export interface PlayerGroup {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  players: RegisteredPlayer[]
  tournamentHistory: TournamentRecord[]
}

export interface PlayerGroupIndex {
  activeGroupId: string | null
  groupIds: string[]
}
