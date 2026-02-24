import type { ScheduleConfig, GeneratedSchedule, GeneratedRound, GenerationInfo, PauseState } from '../types'
import { selectPausedPlayers, updatePauseState } from './pauseRotation'
import { formPartnerPairs, formPartnerPairsOptimal } from './partnerMatching'
import { assignOpponents } from './opponentAssignment'
import { scoreArrangement } from './scoring'
import { createEmptyHistory, updateHistory } from './history'
import { PLAYERS_PER_COURT, OPTIMAL_ACTIVE_PLAYERS_THRESHOLD } from '../constants'

export { scoreArrangement } from './scoring'
export { computeFairnessMetrics } from './metrics'
export { createEmptyHistory, updateHistory } from './history'

/** Mutable stats accumulator threaded through generation calls. */
interface GenStats {
  budgetExhaustedCount: number
  totalBacktrackCalls: number
}

/**
 * Pre-compute the full tournament schedule.
 * For each round: select pauses -> form partner pairs -> assign to courts -> update history.
 *
 * When useOptimal=true, uses backtracking for optimal partner matching (slower but better).
 * When randomize=true, uses random tiebreaking for exploring different solutions.
 */
export function generateSchedule(
  config: ScheduleConfig,
  options?: { randomize?: boolean; useOptimal?: boolean },
  stats?: GenStats,
): GeneratedSchedule {
  const { playerIds, courts, totalRounds } = config
  const effectiveCourts = Math.min(courts, Math.floor(playerIds.length / PLAYERS_PER_COURT))
  const randomize = options?.randomize ?? false
  const useOptimal = options?.useOptimal ?? false

  let pauseState: PauseState = {
    pauseCount: {},
    gamesPlayed: {},
    lastPausedRound: {},
  }
  for (const id of playerIds) {
    pauseState.pauseCount[id] = 0
    pauseState.gamesPlayed[id] = 0
    pauseState.lastPausedRound[id] = 0
  }

  let history = createEmptyHistory(playerIds)
  const rounds: GeneratedRound[] = []

  for (let r = 1; r <= totalRounds; r++) {
    const pausedIds = selectPausedPlayers(playerIds, effectiveCourts, r, pauseState)
    const activeIds = playerIds.filter(id => !pausedIds.includes(id))

    let pairs: [string, string][]
    if (useOptimal) {
      const result = formPartnerPairsOptimal(activeIds, history, randomize)
      pairs = result.pairs
      if (stats) {
        stats.totalBacktrackCalls += result.iterations
        if (result.exhausted) stats.budgetExhaustedCount++
      }
    } else {
      pairs = formPartnerPairs(activeIds, history, randomize)
    }
    const matches = assignOpponents(pairs, history, randomize)

    rounds.push({
      roundNumber: r,
      matches,
      pausedPlayerIds: pausedIds,
    })

    pauseState = updatePauseState(pauseState, pausedIds, activeIds, r)
    history = updateHistory(history, matches)
  }

  return { rounds }
}

/**
 * Monte Carlo: generate K random schedules, return the best-scored one.
 * Adaptively disables optimal matching for large configs (>12 active players).
 */
export function generateScheduleMonteCarlo(
  config: ScheduleConfig,
  iterations: number,
): GeneratedSchedule {
  const start = performance.now()

  const { playerIds, courts } = config
  const effectiveCourts = Math.min(courts, Math.floor(playerIds.length / PLAYERS_PER_COURT))
  const activePlayers = effectiveCourts * PLAYERS_PER_COURT
  const useOptimal = activePlayers <= OPTIMAL_ACTIVE_PLAYERS_THRESHOLD
  const optimalDisabledReason = !useOptimal
    ? `${activePlayers} active players > ${OPTIMAL_ACTIVE_PLAYERS_THRESHOLD} threshold`
    : null

  const stats: GenStats = { budgetExhaustedCount: 0, totalBacktrackCalls: 0 }

  // First iteration: deterministic greedy (baseline)
  let bestSchedule = generateSchedule(config, undefined, stats)
  let bestCost = totalScheduleCost(bestSchedule, config.playerIds)

  for (let i = 1; i < iterations; i++) {
    const shuffled = { ...config, playerIds: shuffle([...config.playerIds]) }
    const candidate = generateSchedule(shuffled, { randomize: true, useOptimal }, stats)
    const cost = totalScheduleCost(candidate, config.playerIds)
    if (cost < bestCost) {
      bestSchedule = candidate
      bestCost = cost
    }
  }

  const elapsedMs = Math.round(performance.now() - start)

  bestSchedule.info = {
    method: 'montecarlo',
    iterations,
    useOptimal,
    optimalDisabledReason,
    budgetExhaustedCount: stats.budgetExhaustedCount,
    totalBacktrackCalls: stats.totalBacktrackCalls,
    elapsedMs,
  }

  return bestSchedule
}

/**
 * Generate additional rounds continuing from an existing schedule.
 * Rebuilds history/pause state from existing rounds, then generates more.
 */
export function generateAdditionalRounds(
  playerIds: string[],
  courts: number,
  existingRounds: GeneratedRound[],
  count: number,
  options?: { randomize?: boolean; useOptimal?: boolean },
  stats?: GenStats,
): GeneratedRound[] {
  const effectiveCts = Math.min(courts, Math.floor(playerIds.length / PLAYERS_PER_COURT))
  const randomize = options?.randomize ?? false
  const useOptimal = options?.useOptimal ?? false

  // Rebuild pause state from existing rounds
  let pauseState: PauseState = {
    pauseCount: {},
    gamesPlayed: {},
    lastPausedRound: {},
  }
  for (const id of playerIds) {
    pauseState.pauseCount[id] = 0
    pauseState.gamesPlayed[id] = 0
    pauseState.lastPausedRound[id] = 0
  }

  let history = createEmptyHistory(playerIds)

  for (const round of existingRounds) {
    const pausedIds = round.pausedPlayerIds
    const activeIds = playerIds.filter(id => !pausedIds.includes(id))
    pauseState = updatePauseState(pauseState, pausedIds, activeIds, round.roundNumber)
    history = updateHistory(history, round.matches)
  }

  // Generate new rounds
  const startRound = existingRounds.length + 1
  const newRounds: GeneratedRound[] = []

  for (let r = startRound; r < startRound + count; r++) {
    const pausedIds = selectPausedPlayers(playerIds, effectiveCts, r, pauseState)
    const activeIds = playerIds.filter(id => !pausedIds.includes(id))

    let pairs: [string, string][]
    if (useOptimal) {
      const result = formPartnerPairsOptimal(activeIds, history, randomize)
      pairs = result.pairs
      if (stats) {
        stats.totalBacktrackCalls += result.iterations
        if (result.exhausted) stats.budgetExhaustedCount++
      }
    } else {
      pairs = formPartnerPairs(activeIds, history, randomize)
    }
    const matches = assignOpponents(pairs, history, randomize)

    newRounds.push({
      roundNumber: r,
      matches,
      pausedPlayerIds: pausedIds,
    })

    pauseState = updatePauseState(pauseState, pausedIds, activeIds, r)
    history = updateHistory(history, matches)
  }

  return newRounds
}

/**
 * Monte Carlo variant: generate K candidate extensions, return the best one.
 * Adaptively disables optimal matching for large configs.
 */
export function generateAdditionalRoundsMonteCarlo(
  playerIds: string[],
  courts: number,
  existingRounds: GeneratedRound[],
  count: number,
  iterations: number,
): { rounds: GeneratedRound[]; info: GenerationInfo } {
  const start = performance.now()

  const effectiveCourts = Math.min(courts, Math.floor(playerIds.length / PLAYERS_PER_COURT))
  const activePlayers = effectiveCourts * PLAYERS_PER_COURT
  const useOptimal = activePlayers <= OPTIMAL_ACTIVE_PLAYERS_THRESHOLD
  const optimalDisabledReason = !useOptimal
    ? `${activePlayers} active players > ${OPTIMAL_ACTIVE_PLAYERS_THRESHOLD} threshold`
    : null

  const stats: GenStats = { budgetExhaustedCount: 0, totalBacktrackCalls: 0 }

  // Baseline: deterministic greedy
  let bestRounds = generateAdditionalRounds(playerIds, courts, existingRounds, count, undefined, stats)
  let bestCost = totalExtensionCost(bestRounds, playerIds, existingRounds)

  for (let i = 1; i < iterations; i++) {
    const candidate = generateAdditionalRounds(
      shuffle([...playerIds]), courts, existingRounds, count,
      { randomize: true, useOptimal },
      stats,
    )
    const cost = totalExtensionCost(candidate, playerIds, existingRounds)
    if (cost < bestCost) {
      bestRounds = candidate
      bestCost = cost
    }
  }

  const elapsedMs = Math.round(performance.now() - start)

  return {
    rounds: bestRounds,
    info: {
      method: 'montecarlo',
      iterations,
      useOptimal,
      optimalDisabledReason,
      budgetExhaustedCount: stats.budgetExhaustedCount,
      totalBacktrackCalls: stats.totalBacktrackCalls,
      elapsedMs,
    },
  }
}

function totalExtensionCost(
  newRounds: GeneratedRound[],
  playerIds: string[],
  existingRounds: GeneratedRound[],
): number {
  // Build history from existing rounds first
  let history = createEmptyHistory(playerIds)
  for (const round of existingRounds) {
    history = updateHistory(history, round.matches)
  }

  // Score only the new rounds (against the full history)
  let cost = 0
  for (const round of newRounds) {
    cost += scoreArrangement(round.matches, history)
    history = updateHistory(history, round.matches)
  }
  return cost
}

export function totalScheduleCost(schedule: GeneratedSchedule, playerIds: string[]): number {
  let history = createEmptyHistory(playerIds)
  let cost = 0

  for (const round of schedule.rounds) {
    cost += scoreArrangement(round.matches, history)
    history = updateHistory(history, round.matches)
  }

  return cost
}

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
