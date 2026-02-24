import type { TournamentAction, TournamentState } from './actions'
import { generateId } from '../utils/ids'
import { OPEN_ENDED_BATCH_SIZE } from '../constants'

export const initialState: TournamentState = {
  tournament: null,
  currentPage: 'setup',
  viewingRound: 1,
  setupDraft: null,
  viewingPlayerId: null,
}

export function tournamentReducer(state: TournamentState, action: TournamentAction): TournamentState {
  switch (action.type) {
    case 'START_TOURNAMENT': {
      const { name, players, courts, totalRounds, scoringConfig, rounds, openEnded, courtNames } = action.payload
      const effectiveRounds = openEnded ? OPEN_ENDED_BATCH_SIZE : totalRounds

      return {
        tournament: {
          id: generateId(),
          name,
          players,
          courts,
          totalRounds: effectiveRounds,
          scoringConfig,
          rounds,
          currentRound: 1,
          phase: 'playing',
          createdAt: Date.now(),
          openEnded: openEnded || false,
          courtNames,
        },
        currentPage: 'round',
        viewingRound: 1,
        setupDraft: null,
      }
    }

    case 'SET_SCORE': {
      if (!state.tournament) return state
      const { roundNumber, courtIndex, score1, score2 } = action.payload
      const rounds = state.tournament.rounds.map(r => {
        if (r.roundNumber !== roundNumber) return r
        return {
          ...r,
          matches: r.matches.map(m => {
            if (m.courtIndex !== courtIndex) return m
            return { ...m, score1, score2 }
          }),
        }
      })
      return { ...state, tournament: { ...state.tournament, rounds } }
    }

    case 'SET_WINLOSS': {
      if (!state.tournament) return state
      const { roundNumber, courtIndex, winner } = action.payload
      const rounds = state.tournament.rounds.map(r => {
        if (r.roundNumber !== roundNumber) return r
        return {
          ...r,
          matches: r.matches.map(m => {
            if (m.courtIndex !== courtIndex) return m
            return { ...m, winner }
          }),
        }
      })
      return { ...state, tournament: { ...state.tournament, rounds } }
    }

    case 'COMPLETE_ROUND': {
      if (!state.tournament) return state
      const { roundNumber } = action.payload
      const rounds = state.tournament.rounds.map(r =>
        r.roundNumber === roundNumber ? { ...r, completed: true } : r
      )
      const nextRound = state.tournament.openEnded
        ? roundNumber + 1
        : Math.min(roundNumber + 1, state.tournament.totalRounds)
      return {
        ...state,
        tournament: { ...state.tournament, rounds, currentRound: nextRound },
        viewingRound: nextRound,
      }
    }

    case 'NAVIGATE_ROUND': {
      return { ...state, viewingRound: action.payload.roundNumber }
    }

    case 'FINISH_TOURNAMENT': {
      if (!state.tournament) return state
      return {
        ...state,
        tournament: { ...state.tournament, phase: 'finished' },
        currentPage: 'leaderboard',
      }
    }

    case 'NAVIGATE_PAGE': {
      return { ...state, currentPage: action.payload.page }
    }

    case 'RESET_TOURNAMENT': {
      return { ...initialState }
    }

    case 'RESTORE_STATE': {
      return action.payload
    }

    case 'EXTEND_ROUNDS': {
      if (!state.tournament) return state
      const { newRounds } = action.payload
      return {
        ...state,
        tournament: {
          ...state.tournament,
          rounds: [...state.tournament.rounds, ...newRounds],
          totalRounds: state.tournament.totalRounds + newRounds.length,
        },
      }
    }

    case 'CLEAR_MATCH_SCORES': {
      if (!state.tournament) return state
      const { roundNumber, courtIndex } = action.payload
      const rounds = state.tournament.rounds.map(r => {
        if (r.roundNumber !== roundNumber) return r
        return {
          ...r,
          matches: r.matches.map(m => {
            if (m.courtIndex !== courtIndex) return m
            return { ...m, score1: undefined, score2: undefined, winner: undefined }
          }),
        }
      })
      return { ...state, tournament: { ...state.tournament, rounds } }
    }

    case 'SAVE_SETUP_DRAFT': {
      return { ...state, setupDraft: action.payload }
    }

    case 'VIEW_PLAYER_DETAIL': {
      return { ...state, currentPage: 'playerDetail', viewingPlayerId: action.payload.playerId }
    }

    default:
      return state
  }
}
