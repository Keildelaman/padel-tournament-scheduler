import { Badge } from '../shared'
import { useT } from '../../i18n'

interface PauseListProps {
  playerNames: string[]
}

export function PauseList({ playerNames }: PauseListProps) {
  const { t } = useT()

  if (playerNames.length === 0) return null

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm text-text-muted">{t('pause.sittingOut')}</span>
      {playerNames.map(name => (
        <Badge key={name} color="yellow">{name}</Badge>
      ))}
    </div>
  )
}
