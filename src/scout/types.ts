export interface ScoutPlayer {
  name: string
  profileSlug: string
  playerId?: string
  ranking?: number
  points: number
  apn: number
  matchesPlayed: number
  matchesWon: number
  matchesLost: number
  winRate: number // 0-100
  tournamentHistory: ScoutTournamentResult[]
  partners: string[]
}

export interface ScoutTournamentResult {
  name: string
  date: string
  category: string
  pointsEarned: number
}

export interface ScoutTeam {
  rank: number
  player1: ScoutPlayer
  player2: ScoutPlayer
  teamPoints: number
  teamApn: number
}

export interface ScoutTournament {
  name: string
  date: string
  time: string
  location: string
  category: string
  teams: ScoutTeam[]
  uuid: string
}

export interface UpcomingTournament {
  name: string
  date: string
  uuid: string
}

export interface PlayerProfile {
  name: string
  slug: string
  upcomingTournaments: UpcomingTournament[]
}

export type ScoutLoadingState =
  | { phase: 'idle' }
  | { phase: 'loading-profile' }
  | { phase: 'loading-tournament' }
  | { phase: 'loading-players'; loaded: number; total: number }
  | { phase: 'done' }
  | { phase: 'error'; message: string }
