import { Button } from '../shared'
import { useT } from '../../i18n'

interface RoundControlsProps {
  roundNumber: number
  totalRounds: number
  isComplete: boolean
  isConfirmed: boolean
  isLastRound: boolean
  openEnded?: boolean
  onPrev: () => void
  onNext: () => void
  onFinish: () => void
}

export function RoundControls({
  roundNumber, totalRounds, isComplete, isConfirmed, isLastRound, openEnded,
  onPrev, onNext, onFinish,
}: RoundControlsProps) {
  const { t } = useT()
  const totalPart = openEnded ? '' : t('roundControls.roundOf', { n: totalRounds })

  return (
    <div className="flex items-center justify-between gap-3">
      <Button
        variant="secondary"
        onClick={onPrev}
        disabled={roundNumber <= 1}
      >
        {t('roundControls.previous')}
      </Button>

      <span className="text-sm text-text-muted font-medium">
        {t('roundControls.round', { current: roundNumber, total: totalPart })}
      </span>

      <div className="flex gap-2">
        {(openEnded || !isLastRound) && (
          <Button
            variant="secondary"
            onClick={onNext}
            disabled={!isComplete && !isConfirmed}
          >
            {t('roundControls.next')}
          </Button>
        )}
        {(isLastRound || (openEnded && isComplete)) && (
          <Button variant="primary" onClick={onFinish}>
            {t('roundControls.finishTournament')}
          </Button>
        )}
      </div>
    </div>
  )
}
