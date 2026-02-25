import { createContext, useContext, useReducer, useEffect, type ReactNode, type Dispatch } from 'react'
import type { TournamentState } from './actions'
import type { TournamentAction } from './actions'
import { tournamentReducer, initialState } from './reducer'
import { saveState, loadState } from './persistence'

interface TournamentContextValue {
  state: TournamentState
  dispatch: Dispatch<TournamentAction>
}

const TournamentContext = createContext<TournamentContextValue | null>(null)

export function TournamentProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(tournamentReducer, initialState, () => {
    const saved = loadState()
    return saved ?? initialState
  })

  // Persist on every state change
  useEffect(() => {
    saveState(state)
  }, [state])

  // Sync browser tab title
  useEffect(() => {
    if (state.tournament && state.tournament.phase === 'playing') {
      document.title = `Round ${state.viewingRound} - ${state.tournament.name}`
    } else if (state.tournament && state.tournament.phase === 'finished') {
      document.title = `Results - ${state.tournament.name}`
    } else {
      document.title = 'PadelGaudi \u2014 Padel Tournament Scheduler'
    }
  }, [state.tournament, state.viewingRound])

  return (
    <TournamentContext.Provider value={{ state, dispatch }}>
      {children}
    </TournamentContext.Provider>
  )
}

export function useTournament() {
  const ctx = useContext(TournamentContext)
  if (!ctx) throw new Error('useTournament must be used within TournamentProvider')
  return ctx
}
