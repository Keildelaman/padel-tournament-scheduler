import { useState } from 'react'
import type { LeaderboardEntry, Tournament } from '../../types'
import { Badge } from '../shared'
import { useT } from '../../i18n'

interface LeaderboardTableProps {
  entries: LeaderboardEntry[]
  tournament: Tournament
}

export function LeaderboardTable({ entries, tournament }: LeaderboardTableProps) {
  const { t } = useT()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const playerMap = new Map(tournament.players.map(p => [p.id, p.name]))

  const rankBadge = (rank: number) => {
    if (rank === 1) return <Badge color="gold">{t('table.1st')}</Badge>
    if (rank === 2) return <Badge color="silver">{t('table.2nd')}</Badge>
    if (rank === 3) return <Badge color="bronze">{t('table.3rd')}</Badge>
    return <span className="text-text-muted text-sm">{rank}</span>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-text-muted text-xs uppercase tracking-wide bg-surface-alt/50">
            <th className="text-left py-3 px-2">{t('table.rank')}</th>
            <th className="text-left py-3 px-2">{t('table.player')}</th>
            <th className="text-right py-3 px-2">{t('table.points')}</th>
            <th className="text-right py-3 px-2">{t('table.wins')}</th>
            <th className="text-right py-3 px-2">{t('table.losses')}</th>
            <th className="text-right py-3 px-2 hidden sm:table-cell">{t('table.played')}</th>
            <th className="text-right py-3 px-2 hidden sm:table-cell">{t('table.paused')}</th>
            <th className="text-right py-3 px-2 hidden md:table-cell">{t('table.diff')}</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(entry => (
            <>
              <tr
                key={entry.playerId}
                onClick={() => setExpandedId(expandedId === entry.playerId ? null : entry.playerId)}
                className="border-b border-border hover:bg-surface-alt cursor-pointer"
              >
                <td className="py-3 px-2">{rankBadge(entry.rank)}</td>
                <td className="py-3 px-2 font-medium">{entry.playerName}</td>
                <td className="py-3 px-2 text-right tabular-nums font-semibold">{entry.points}</td>
                <td className="py-3 px-2 text-right tabular-nums text-emerald-400">{entry.wins}</td>
                <td className="py-3 px-2 text-right tabular-nums text-rose-400">{entry.losses}</td>
                <td className="py-3 px-2 text-right tabular-nums hidden sm:table-cell">{entry.gamesPlayed}</td>
                <td className="py-3 px-2 text-right tabular-nums hidden sm:table-cell">{entry.gamesPaused}</td>
                <td className="py-3 px-2 text-right tabular-nums hidden md:table-cell">
                  <span className={entry.pointDifferential > 0 ? 'text-emerald-400' : entry.pointDifferential < 0 ? 'text-rose-400' : ''}>
                    {entry.pointDifferential > 0 ? '+' : ''}{entry.pointDifferential}
                  </span>
                </td>
              </tr>
              {expandedId === entry.playerId && (
                <tr key={`${entry.playerId}-detail`}>
                  <td colSpan={8} className="px-4 py-3 bg-surface-alt">
                    <div className="text-xs space-y-1">
                      {entry.roundResults.map(rr => (
                        <div key={rr.roundNumber} className="flex items-center gap-2">
                          <span className="text-text-muted w-12">R{rr.roundNumber}:</span>
                          {rr.paused ? (
                            <Badge color="yellow">{t('table.paused_badge')}</Badge>
                          ) : (
                            <>
                              <span>{t('table.with')} {playerMap.get(rr.partnerId!) ?? '?'}</span>
                              <span className="text-text-muted">{t('table.vs')}</span>
                              <span>{rr.opponentIds?.map(id => playerMap.get(id) ?? '?').join(' & ')}</span>
                              {rr.won != null && (
                                <Badge color={rr.won ? 'green' : 'red'}>{rr.won ? t('table.wins') : t('table.losses')}</Badge>
                              )}
                              {rr.pointsScored != null && (
                                <span className="text-text-muted tabular-nums">{rr.pointsScored}-{rr.pointsConceded}</span>
                              )}
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  )
}
