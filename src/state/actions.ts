import type { Player, ScoringConfig, Round } from '../types'

export type Page = 'setup' | 'round' | 'leaderboard' | 'players' | 'playerDetail' | 'playerGroups' | 'simulator' | 'tournamentResult' | 'scout'

export type TournamentAction =
  | { type: 'START_TOURNAMENT'; payload: { name: string; players: Player[]; courts: number; totalRounds: number; scoringConfig: ScoringConfig; rounds: Round[]; openEnded?: boolean; courtNames?: string[] } }
  | { type: 'SET_SCORE'; payload: { roundNumber: number; courtIndex: number; score1: number; score2: number } }
  | { type: 'SET_WINLOSS'; payload: { roundNumber: number; courtIndex: number; winner: 1 | 2 } }
  | { type: 'COMPLETE_ROUND'; payload: { roundNumber: number } }
  | { type: 'NAVIGATE_ROUND'; payload: { roundNumber: number } }
  | { type: 'FINISH_TOURNAMENT' }
  | { type: 'NAVIGATE_PAGE'; payload: { page: Page } }
  | { type: 'RESET_TOURNAMENT' }
  | { type: 'RESTORE_STATE'; payload: TournamentState }
  | { type: 'EXTEND_ROUNDS'; payload: { newRounds: Round[] } }
  | { type: 'SAVE_SETUP_DRAFT'; payload: import('../types').SetupDraft }
  | { type: 'CLEAR_MATCH_SCORES'; payload: { roundNumber: number; courtIndex: number } }
  | { type: 'VIEW_PLAYER_DETAIL'; payload: { playerId: string } }
  | { type: 'VIEW_TOURNAMENT_RESULT'; payload: { tournamentId: string } }
  | { type: 'ADD_EQUALIZER_ROUND'; payload: { round: Round } }

export interface TournamentState {
  tournament: import('../types').Tournament | null
  currentPage: Page
  viewingRound: number
  setupDraft: import('../types').SetupDraft | null
  viewingPlayerId: string | null
  viewingTournamentId: string | null
}
