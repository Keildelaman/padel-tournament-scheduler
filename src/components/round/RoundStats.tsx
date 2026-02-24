import { useState } from 'react'
import type { Tournament } from '../../types'
import { getLeaderboard } from '../../state/selectors'
import { useT } from '../../i18n'

interface RoundStatsProps {
  tournament: Tournament
}

export function RoundStats({ tournament }: RoundStatsProps) {
  const { t } = useT()
  const [open, setOpen] = useState(false)
  const leaderboard = getLeaderboard(tournament)

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-2 flex items-center justify-between text-sm font-medium text-text hover:bg-primary/5 transition-colors"
      >
        <span>{t('roundStats.standings')}</span>
        <span className="text-text-muted">{open ? '\u2212' : '+'}</span>
      </button>
      {open && (
        <div className="px-4 pb-3">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-text-muted bg-surface-alt/30">
                <th className="text-left py-1">{t('roundStats.rank')}</th>
                <th className="text-left py-1">{t('roundStats.name')}</th>
                <th className="text-right py-1">{t('roundStats.points')}</th>
                <th className="text-right py-1">{t('roundStats.wins')}</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map(entry => (
                <tr key={entry.playerId} className="border-t border-border">
                  <td className="py-1 text-text-muted">{entry.rank}</td>
                  <td className="py-1 font-medium">{entry.playerName}</td>
                  <td className="py-1 text-right tabular-nums">{entry.points}</td>
                  <td className="py-1 text-right tabular-nums">{entry.wins}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
