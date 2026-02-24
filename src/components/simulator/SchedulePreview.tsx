import { useState } from 'react'
import type { GeneratedSchedule } from '../../types'
import { useT } from '../../i18n'

interface SchedulePreviewProps {
  schedule: GeneratedSchedule
  playerLabels: string[]
}

export function SchedulePreview({ schedule, playerLabels }: SchedulePreviewProps) {
  const { t } = useT()
  const [open, setOpen] = useState(false)

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-3 flex items-center justify-between text-sm font-medium text-text hover:bg-primary/5 transition-colors"
      >
        <span>{t('schedulePreview.title', { n: schedule.rounds.length })}</span>
        <span className="text-text-muted">{open ? '\u2212' : '+'}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3 text-xs font-mono">
          {schedule.rounds.map(round => (
            <div key={round.roundNumber}>
              <div className="font-semibold text-text-muted mb-1">{t('schedulePreview.round', { n: round.roundNumber })}</div>
              {round.matches.map(match => (
                <div key={match.courtIndex} className="ml-4 text-text-muted">
                  {t('schedulePreview.court', { n: match.courtIndex + 1 })}{' '}
                  <span className="text-team-blue">{playerLabels[parseInt(match.team1[0])] ?? match.team1[0]} & {playerLabels[parseInt(match.team1[1])] ?? match.team1[1]}</span>
                  {' '}{t('schedulePreview.vs')}{' '}
                  <span className="text-team-red">{playerLabels[parseInt(match.team2[0])] ?? match.team2[0]} & {playerLabels[parseInt(match.team2[1])] ?? match.team2[1]}</span>
                </div>
              ))}
              {round.pausedPlayerIds.length > 0 && (
                <div className="ml-4 text-yellow-600">
                  {t('schedulePreview.paused')} {round.pausedPlayerIds.map(id => playerLabels[parseInt(id)] ?? id).join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
