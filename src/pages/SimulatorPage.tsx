import { useState, useCallback } from 'react'
import { Card, Button, NumberInput, GenerationInfoBar } from '../components/shared'
import { HeatmapGrid } from '../components/simulator/HeatmapGrid'
import { FairnessCards } from '../components/simulator/FairnessCards'
import { SchedulePreview } from '../components/simulator/SchedulePreview'
import { generateSchedule, generateScheduleMonteCarlo, computeFairnessMetrics } from '../algorithm'
import { buildMatrices } from '../algorithm/metrics'
import { MIN_PLAYERS, MAX_PLAYERS, MIN_COURTS, MAX_COURTS, MIN_ROUNDS, MAX_ROUNDS, MONTE_CARLO_DEFAULT_ITERATIONS } from '../constants'
import { effectiveCourts } from '../utils/validation'
import { useT } from '../i18n'
import type { SimulatorResult, GeneratedSchedule } from '../types'

export function SimulatorPage() {
  const { t } = useT()
  const [playerCount, setPlayerCount] = useState(8)
  const [courts, setCourts] = useState(2)
  const [rounds, setRounds] = useState(10)
  const [mode, setMode] = useState<'greedy' | 'montecarlo'>('greedy')
  const [iterations, setIterations] = useState(MONTE_CARLO_DEFAULT_ITERATIONS)
  const [result, setResult] = useState<SimulatorResult | null>(null)
  const [running, setRunning] = useState(false)

  const eCourts = effectiveCourts(playerCount, courts)

  const runSimulation = useCallback(() => {
    setRunning(true)
    // Use setTimeout to let the UI update before heavy computation
    setTimeout(() => {
      const playerIds = Array.from({ length: playerCount }, (_, i) => String(i))
      const playerLabels = Array.from({ length: playerCount }, (_, i) => `P${i + 1}`)
      const config = { playerIds, courts: eCourts, totalRounds: rounds }

      let schedule: GeneratedSchedule
      if (mode === 'montecarlo') {
        schedule = generateScheduleMonteCarlo(config, iterations)
      } else {
        const start = performance.now()
        schedule = generateSchedule(config)
        schedule.info = {
          method: 'greedy',
          iterations: 1,
          useOptimal: false,
          optimalDisabledReason: null,
          budgetExhaustedCount: 0,
          totalBacktrackCalls: 0,
          elapsedMs: Math.round(performance.now() - start),
        }
      }

      const metrics = computeFairnessMetrics(schedule, playerIds)
      const { partnerMatrix, opponentMatrix } = buildMatrices(schedule, playerIds)

      setResult({ schedule, metrics, partnerMatrix, opponentMatrix, playerLabels })
      setRunning(false)
    }, 10)
  }, [playerCount, courts, rounds, mode, iterations, eCourts])

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold border-l-4 border-primary pl-3">{t('simulator.title')}</h2>

      {/* Config Panel */}
      <Card>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <NumberInput label={t('simulator.players')} value={playerCount} onChange={setPlayerCount} min={MIN_PLAYERS} max={MAX_PLAYERS} />
          <NumberInput label={t('simulator.courts')} value={courts} onChange={setCourts} min={MIN_COURTS} max={MAX_COURTS} />
          <NumberInput label={t('simulator.rounds')} value={rounds} onChange={setRounds} min={MIN_ROUNDS} max={MAX_ROUNDS} />
          {mode === 'montecarlo' && (
            <NumberInput label={t('simulator.iterations')} value={iterations} onChange={setIterations} min={10} max={1000} />
          )}
        </div>
        <div className="flex items-center gap-4 mt-4">
          <div className="flex gap-1 bg-surface-input rounded-lg p-1">
            <div className="relative group">
              <button
                onClick={() => setMode('greedy')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  mode === 'greedy' ? 'bg-primary-light text-white shadow-md' : 'text-text-muted hover:text-text'
                }`}
              >
                {t('simulator.greedy')}
              </button>
              <div className="invisible group-hover:visible absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg z-10 font-normal">
                {t('simulator.greedyTooltip')}
                <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800" />
              </div>
            </div>
            <div className="relative group">
              <button
                onClick={() => setMode('montecarlo')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  mode === 'montecarlo' ? 'bg-primary-light text-white shadow-md' : 'text-text-muted hover:text-text'
                }`}
              >
                {t('simulator.monteCarlo')}
              </button>
              <div className="invisible group-hover:visible absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg z-10 font-normal">
                {t('simulator.monteCarloTooltip')}
                <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800" />
              </div>
            </div>
          </div>
          <Button onClick={runSimulation} disabled={running}>
            {running ? t('simulator.running') : t('simulator.runSimulation')}
          </Button>
        </div>
        <p className="text-xs text-text-muted mt-2">
          {t('simulator.courtInfo', { courts: eCourts, playing: eCourts * 4, sitting: Math.max(0, playerCount - eCourts * 4) })}
        </p>
      </Card>

      {result && (
        <>
          {/* Fairness Metrics */}
          <FairnessCards metrics={result.metrics} />

          {result.schedule.info && (
            <GenerationInfoBar info={result.schedule.info} />
          )}

          {/* Heatmaps side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <HeatmapGrid
                matrix={result.partnerMatrix}
                labels={result.playerLabels}
                colorLow="#1e3a5f"
                colorHigh="#1d4ed8"
                title={t('simulator.partnerFrequency')}
              />
            </Card>
            <Card>
              <HeatmapGrid
                matrix={result.opponentMatrix}
                labels={result.playerLabels}
                colorLow="#3b1c1c"
                colorHigh="#dc2626"
                title={t('simulator.opponentFrequency')}
              />
            </Card>
          </div>

          {/* Schedule preview */}
          <Card padding={false}>
            <SchedulePreview schedule={result.schedule} playerLabels={result.playerLabels} />
          </Card>
        </>
      )}
    </div>
  )
}
