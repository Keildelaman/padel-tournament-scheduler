import { useState, useMemo, useEffect, useRef } from 'react'
import { useTournament, usePlayerGroup, isRoundComplete, getLeaderboard, buildTournamentRecord } from '../state'
import { ProgressBar, Modal } from '../components/shared'
import { CourtCard } from '../components/round/CourtCard'
import { PauseList } from '../components/round/PauseList'
import { RoundControls } from '../components/round/RoundControls'
import { RoundStats } from '../components/round/RoundStats'
import { RoundTimer } from '../components/round/RoundTimer'
import { generateAdditionalRoundsMonteCarlo } from '../algorithm'
import { OPEN_ENDED_EXTEND_THRESHOLD, OPEN_ENDED_BATCH_SIZE, MONTE_CARLO_DEFAULT_ITERATIONS, DEFAULT_MATCH_DURATION_MINUTES } from '../constants'
import { useT } from '../i18n'
import type { Round } from '../types'

export function RoundPage() {
  const { state, dispatch } = useTournament()
  const { pgState, pgDispatch } = usePlayerGroup()
  const { t } = useT()
  const [showFinishModal, setShowFinishModal] = useState(false)
  const [excludeFromRegistry, setExcludeFromRegistry] = useState(false)
  const [extending, setExtending] = useState(false)
  const extendingRef = useRef(false)
  const tournament = state.tournament

  // Auto-extend rounds for open-ended tournaments
  useEffect(() => {
    if (!tournament || !tournament.openEnded || extendingRef.current) return
    const remaining = tournament.totalRounds - tournament.currentRound
    if (remaining < OPEN_ENDED_EXTEND_THRESHOLD) {
      extendingRef.current = true
      setExtending(true)
      setTimeout(() => {
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

        const { rounds: additional } = generateAdditionalRoundsMonteCarlo(
          playerIds,
          tournament.courts,
          existingGenerated,
          OPEN_ENDED_BATCH_SIZE,
          MONTE_CARLO_DEFAULT_ITERATIONS,
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
        setExtending(false)
        extendingRef.current = false
      }, 10)
    }
  }, [tournament?.currentRound, tournament?.openEnded, tournament?.totalRounds])

  if (!tournament) {
    return (
      <div className="text-center py-12 text-text-muted">
        <p>{t('round.noTournament')}</p>
        <button
          className="mt-3 text-accent hover:underline hover:text-accent-light"
          onClick={() => dispatch({ type: 'NAVIGATE_PAGE', payload: { page: 'setup' } })}
        >
          {t('round.goToSetup')}
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
    // Record to player group before finishing
    if (pgState.index.activeGroupId && tournament) {
      const leaderboard = getLeaderboard(tournament)
      const record = buildTournamentRecord(tournament, leaderboard)
      record.excluded = excludeFromRegistry
      pgDispatch({ type: 'PG_ADD_TOURNAMENT_RECORD', payload: { record } })
    }
    dispatch({ type: 'FINISH_TOURNAMENT' })
    setShowFinishModal(false)
  }

  return (
    <div className="space-y-6">
      {tournament.openEnded ? (
        <div className="text-sm text-text-muted font-medium">
          {t('round.roundsCompleted', { n: completedRounds })}
        </div>
      ) : (
        <ProgressBar current={completedRounds} total={tournament.totalRounds} />
      )}

      {tournament.scoringConfig.mode === 'timed' && (
        <RoundTimer
          durationMinutes={tournament.scoringConfig.matchDurationMinutes ?? DEFAULT_MATCH_DURATION_MINUTES}
          roundNumber={state.viewingRound}
          disabled={round.completed}
        />
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
            courtLabel={tournament.courtNames?.[match.courtIndex] || t('round.court', { n: match.courtIndex + 1 })}
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

      {extending && (
        <p className="text-sm text-text-muted animate-pulse text-center">{t('round.extending')}</p>
      )}

      <RoundStats tournament={tournament} />

      <Modal
        open={showFinishModal}
        onClose={() => setShowFinishModal(false)}
        title={t('round.finishTitle')}
        confirmText={t('round.finishConfirm')}
        onConfirm={handleFinish}
      >
        <p>{t('round.finishMessage')}</p>
        {pgState.index.activeGroupId && (
          <>
            <label className="flex items-center gap-2 mt-4 text-sm text-text cursor-pointer">
              <input
                type="checkbox"
                checked={excludeFromRegistry}
                onChange={e => setExcludeFromRegistry(e.target.checked)}
                className="accent-primary"
              />
              {t('round.excludeFromRegistry')}
            </label>
            <p className="text-xs text-text-muted mt-1">{t('round.excludeHint')}</p>
          </>
        )}
      </Modal>
    </div>
  )
}
