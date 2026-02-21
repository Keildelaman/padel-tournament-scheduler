export interface Player {
  id: string
  name: string
}

export interface MatchAssignment {
  courtIndex: number
  team1: [string, string] // player IDs
  team2: [string, string] // player IDs
  score1?: number
  score2?: number
  winner?: 1 | 2
}

export interface Round {
  roundNumber: number
  matches: MatchAssignment[]
  pausedPlayerIds: string[]
  completed: boolean
}

export type ScoringMode = 'points' | 'winloss'

export interface ScoringConfig {
  mode: ScoringMode
  pointsPerMatch: number // total points distributed per match (e.g. 32)
}

export interface SetupDraft {
  name: string
  scoringMode: ScoringMode
  pointsPerMatch: number
  playerNames: string[]
  courts: number
  rounds: number
  openEnded: boolean
  courtNames?: string[]
}

export type TournamentPhase = 'setup' | 'playing' | 'finished'

export interface Tournament {
  id: string
  name: string
  players: Player[]
  courts: number
  totalRounds: number
  scoringConfig: ScoringConfig
  rounds: Round[]
  currentRound: number // 1-indexed
  phase: TournamentPhase
  createdAt: number
  openEnded?: boolean
  courtNames?: string[]
}
