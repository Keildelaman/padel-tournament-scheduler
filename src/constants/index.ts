export const MIN_PLAYERS = 4
export const MAX_PLAYERS = 20
export const MIN_COURTS = 1
export const MAX_COURTS = 4
export const PLAYERS_PER_COURT = 4
export const MIN_ROUNDS = 1
export const MAX_ROUNDS = 30
export const DEFAULT_POINTS_PER_MATCH = 10
export const DEFAULT_TARGET_SCORE = 24
export const DEFAULT_MATCH_DURATION_MINUTES = 10
export const DEFAULT_TOURNAMENT_NAME = 'Padel Americano'

export const SCORING_PENALTIES = {
  partnerRepeat: 10,
  opponentRepeat: 3,
} as const

export const MONTE_CARLO_DEFAULT_ITERATIONS = 200

// Use backtracking (optimal) matching only when active players <= this threshold.
// Above this, greedy matching with shuffled input is used instead.
// 12 active players = 3 courts, ~10k backtrack branches (fast).
// 16 active players = 4 courts, ~2M branches (too slow even with budget cap).
export const OPTIMAL_ACTIVE_PLAYERS_THRESHOLD = 12

export const OPEN_ENDED_BATCH_SIZE = 30
export const OPEN_ENDED_EXTEND_THRESHOLD = 5
