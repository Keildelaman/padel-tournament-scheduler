import type { GenerationInfo } from '../../types'
import { useT } from '../../i18n'

interface GenerationInfoBarProps {
  info: GenerationInfo
}

export function GenerationInfoBar({ info }: GenerationInfoBarProps) {
  const { t } = useT()

  const method = info.method === 'montecarlo'
    ? t('gen.montecarlo', { n: info.iterations })
    : t('gen.greedy')

  const matching = info.useOptimal
    ? t('gen.optimalMatching')
    : t('gen.greedyMatching')

  const matchingDetail = !info.useOptimal && info.optimalDisabledReason
    ? ` (${t('gen.optimalDisabled', { reason: info.optimalDisabledReason })})`
    : info.useOptimal && info.budgetExhaustedCount > 0
      ? ` (${t('gen.budgetHits', { n: info.budgetExhaustedCount })})`
      : info.useOptimal
        ? ` (${t('gen.noBudgetHits')})`
        : ''

  return (
    <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs text-text-muted font-mono">
      <span>{t('gen.elapsed', { ms: info.elapsedMs })}</span>
      <span className="text-text-muted/50">|</span>
      <span>{method}</span>
      <span className="text-text-muted/50">|</span>
      <span>{matching}{matchingDetail}</span>
    </div>
  )
}
