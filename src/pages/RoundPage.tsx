import { useState, useMemo, useEffect } from 'react'
import { useTournament, isRoundComplete } from '../state'
import { ProgressBar, Modal } from '../components/shared'
import { CourtCard } from '../components/round/CourtCard'
import { PauseList } from '../components/round/PauseList'
import { RoundControls } from '../components/round/RoundControls'
import { RoundStats } from '../components/round/RoundStats'
import { generateAdditionalRounds } from '../algorithm'
import { OPEN_ENDED_EXTEND_THRESHOLD, OPEN_ENDED_BATCH_SIZE } from '../constants'
import type { Round } from '../types'

export function RoundPage() {
  const { state, dispatch } = useTournament()
  const [showFinishModal, setShowFinishModal] = useState(false)
  const tournament = state.tournament

  // Auto-extend rounds for open-ended tournaments
  useEffect(() => {
    if (!tournament || !tournament.openEnded) return
    const remaining = tournament.totalRounds - tournament.currentRound
    if (remaining < OPEN_ENDED_EXTEND_THRESHOLD) {
      const playerIds = tournament.players.map(p => p.id)
      const existingGenerated = tournament.rounds.map(r => ({
        roundNumber: r.roundNumber,
        matches: r.matches.map(m => ({
          courtIndex: m.courtIndex,
          team1: m.team1,
          team2: m.team2,
        })),
        pausedPlayerIds: r.pausedPlayerIds,
      }))

      const additional = generateAdditionalRounds(
        playerIds,
        tournament.courts,
        existingGenerated,
        OPEN_ENDED_BATCH_SIZE,
      )

      const newRounds: Round[] = additional.map(gr => ({
        roundNumber: gr.roundNumber,
        matches: gr.matches.map(gm => ({
          courtIndex: gm.courtIndex,
          team1: gm.team1,
          team2: gm.team2,
        })),
        pausedPlayerIds: gr.pausedPlayerIds,
        completed: false,
      }))

      dispatch({ type: 'EXTEND_ROUNDS', payload: { newRounds } })
    }
  }, [tournament?.currentRound, tournament?.openEnded, tournament?.totalRounds])

  if (!tournament) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No tournament in progress.</p>
        <button
          className="mt-3 text-primary hover:underline"
          onClick={() => dispatch({ type: 'NAVIGATE_PAGE', payload: { page: 'setup' } })}
        >
          Go to Setup
        </button>
      </div>
    )
  }

  const round = tournament.rounds[state.viewingRound - 1]
  if (!round) return null

  const playerNames = useMemo(() => {
    const map: Record<string, string> = {}
    for (const p of tournament.players) map[p.id] = p.name
    return map
  }, [tournament.players])

  const roundComplete = isRoundComplete(tournament, state.viewingRound)
  const isLastRound = !tournament.openEnded && state.viewingRound === tournament.totalRounds
  const completedRounds = tournament.rounds.filter(r => r.completed).length

  const handleSetScore = (courtIndex: number, score1: number, score2: number) => {
    dispatch({
      type: 'SET_SCORE',
      payload: { roundNumber: state.viewingRound, courtIndex, score1, score2 },
    })
  }

  const handleSetWinner = (courtIndex: number, winner: 1 | 2) => {
    dispatch({
      type: 'SET_WINLOSS',
      payload: { roundNumber: state.viewingRound, courtIndex, winner },
    })
  }

  const handleClearScore = (courtIndex: number) => {
    dispatch({
      type: 'CLEAR_MATCH_SCORES',
      payload: { roundNumber: state.viewingRound, courtIndex },
    })
  }

  const handleComplete = () => {
    dispatch({ type: 'COMPLETE_ROUND', payload: { roundNumber: state.viewingRound } })
  }

  const handleFinish = () => {
    if (roundComplete && !round.completed) {
      dispatch({ type: 'COMPLETE_ROUND', payload: { roundNumber: state.viewingRound } })
    }
    dispatch({ type: 'FINISH_TOURNAMENT' })
    setShowFinishModal(false)
  }

  return (
    <div className="space-y-6">
      {tournament.openEnded ? (
        <div className="text-sm text-gray-500 font-medium">
          {completedRounds} round{completedRounds !== 1 ? 's' : ''} completed
        </div>
      ) : (
        <ProgressBar current={completedRounds} total={tournament.totalRounds} />
      )}

      <PauseList
        playerNames={round.pausedPlayerIds.map(id => playerNames[id] ?? '?')}
      />

      {/* Courts grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {round.matches.map(match => (
          <CourtCard
            key={match.courtIndex}
            match={match}
            scoringConfig={tournament.scoringConfig}
            playerNames={playerNames}
            courtLabel={tournament.courtNames?.[match.courtIndex] || `Court ${match.courtIndex + 1}`}
            onSetScore={(s1, s2) => handleSetScore(match.courtIndex, s1, s2)}
            onSetWinner={(w) => handleSetWinner(match.courtIndex, w)}
            onClearScore={() => handleClearScore(match.courtIndex)}
            disabled={round.completed}
          />
        ))}
      </div>

      <RoundControls
        roundNumber={state.viewingRound}
        totalRounds={tournament.totalRounds}
        isComplete={roundComplete}
        isConfirmed={round.completed}
        isLastRound={isLastRound}
        openEnded={tournament.openEnded}
        onPrev={() => dispatch({ type: 'NAVIGATE_ROUND', payload: { roundNumber: state.viewingRound - 1 } })}
        onNext={() => {
          if (roundComplete && !round.completed) handleComplete()
          dispatch({ type: 'NAVIGATE_ROUND', payload: { roundNumber: state.viewingRound + 1 } })
        }}
        onFinish={() => setShowFinishModal(true)}
      />

      <RoundStats tournament={tournament} />

      <Modal
        open={showFinishModal}
        onClose={() => setShowFinishModal(false)}
        title="Finish Tournament?"
        confirmText="Finish"
        onConfirm={handleFinish}
      >
        <p>This will end the tournament and show final results. Are you sure?</p>
      </Modal>
    </div>
  )
}
