import type { FairnessMetrics } from '../../types'
import { useT } from '../../i18n'

interface FairnessCardsProps {
  metrics: FairnessMetrics
}

interface MetricDisplay {
  labelKey: string
  value: string
  level: 'good' | 'warn' | 'bad'
  tooltipKey: string
}

export function FairnessCards({ metrics }: FairnessCardsProps) {
  const { t } = useT()

  const items: MetricDisplay[] = [
    {
      labelKey: 'fairness.gamesPlayedStdDev',
      value: metrics.gamesPlayedStdDev.toFixed(2),
      level: metrics.gamesPlayedStdDev <= 0.5 ? 'good' : metrics.gamesPlayedStdDev <= 1 ? 'warn' : 'bad',
      tooltipKey: 'fairness.gamesPlayedStdDevTooltip',
    },
    {
      labelKey: 'fairness.pauseCountStdDev',
      value: metrics.pauseCountStdDev.toFixed(2),
      level: metrics.pauseCountStdDev <= 0.5 ? 'good' : metrics.pauseCountStdDev <= 1 ? 'warn' : 'bad',
      tooltipKey: 'fairness.pauseCountStdDevTooltip',
    },
    {
      labelKey: 'fairness.maxPauseGap',
      value: String(metrics.maxPauseGap),
      level: metrics.maxPauseGap <= 1 ? 'good' : metrics.maxPauseGap <= 2 ? 'warn' : 'bad',
      tooltipKey: 'fairness.maxPauseGapTooltip',
    },
    {
      labelKey: 'fairness.maxGamesGap',
      value: String(metrics.maxGamesGap),
      level: metrics.maxGamesGap <= 1 ? 'good' : metrics.maxGamesGap <= 2 ? 'warn' : 'bad',
      tooltipKey: 'fairness.maxGamesGapTooltip',
    },
    {
      labelKey: 'fairness.partnerVariety',
      value: (metrics.partnerVarietyIndex * 100).toFixed(0) + '%',
      level: metrics.partnerVarietyIndex >= 0.8 ? 'good' : metrics.partnerVarietyIndex >= 0.6 ? 'warn' : 'bad',
      tooltipKey: 'fairness.partnerVarietyTooltip',
    },
    {
      labelKey: 'fairness.opponentVariety',
      value: (metrics.opponentVarietyIndex * 100).toFixed(0) + '%',
      level: metrics.opponentVarietyIndex >= 0.8 ? 'good' : metrics.opponentVarietyIndex >= 0.6 ? 'warn' : 'bad',
      tooltipKey: 'fairness.opponentVarietyTooltip',
    },
    {
      labelKey: 'fairness.partnerSpread',
      value: String(metrics.maxPartnerGap),
      level: metrics.maxPartnerGap <= 1 ? 'good' : metrics.maxPartnerGap <= 2 ? 'warn' : 'bad',
      tooltipKey: 'fairness.partnerSpreadTooltip',
    },
    {
      labelKey: 'fairness.opponentSpread',
      value: String(metrics.maxOpponentGap),
      level: metrics.maxOpponentGap <= 1 ? 'good' : metrics.maxOpponentGap <= 3 ? 'warn' : 'bad',
      tooltipKey: 'fairness.opponentSpreadTooltip',
    },
  ]

  const colorMap = {
    good: 'text-fair-good border-fair-good/40 bg-emerald-950/40',
    warn: 'text-fair-warn border-fair-warn/40 bg-amber-950/40',
    bad: 'text-fair-bad border-fair-bad/40 bg-red-950/40',
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {items.map(item => (
        <div key={item.labelKey} className={`relative group rounded-lg border p-3 text-center ${colorMap[item.level]}`}>
          <div className="absolute top-1.5 right-1.5">
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-white/10 text-[10px] font-bold cursor-help opacity-60 group-hover:opacity-100 transition-opacity">?</span>
          </div>
          <div className="invisible group-hover:visible absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-56 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg z-10 font-normal text-left">
            {t(item.tooltipKey)}
            <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800" />
          </div>
          <div className="text-xl font-bold tabular-nums">{item.value}</div>
          <div className="text-xs mt-1 opacity-80">{t(item.labelKey)}</div>
        </div>
      ))}
    </div>
  )
}
