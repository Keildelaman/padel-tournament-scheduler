import { useState, useMemo, useRef } from 'react'
import {
  usePlayerGroup, useTournament,
  getPlayerDetailStats, getPlayerPartnerStats,
  getPlayerOpponentStats, getPlayerTournamentHistory,
} from '../state'
import { Card, Button, Badge } from '../components/shared'
import { useT } from '../i18n'
import { formatDate } from '../utils/dates'

export function PlayerDetailPage() {
  const { pgState, pgDispatch, activeGroup } = usePlayerGroup()
  const { state, dispatch } = useTournament()
  const { t } = useT()

  const playerId = state.viewingPlayerId
  const player = activeGroup?.players.find(p => p.id === playerId) ?? null

  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState(player?.name ?? '')
  const nameInputRef = useRef<HTMLInputElement>(null)

  const detailStats = useMemo(() => {
    if (!activeGroup || !playerId) return null
    return getPlayerDetailStats(activeGroup, playerId)
  }, [activeGroup, playerId])

  const partnerStats = useMemo(() => {
    if (!activeGroup || !playerId) return []
    return getPlayerPartnerStats(activeGroup, playerId)
  }, [activeGroup, playerId])

  const opponentStats = useMemo(() => {
    if (!activeGroup || !playerId) return []
    return getPlayerOpponentStats(activeGroup, playerId)
  }, [activeGroup, playerId])

  const tournamentHistory = useMemo(() => {
    if (!activeGroup || !playerId) return []
    return getPlayerTournamentHistory(activeGroup, playerId)
  }, [activeGroup, playerId])

  if (!player || !detailStats) {
    return (
      <div className="text-center py-12 text-text-muted">
        <button
          className="text-accent hover:underline hover:text-accent-light"
          onClick={() => dispatch({ type: 'NAVIGATE_PAGE', payload: { page: 'players' } })}
        >
          {t('players.backToList')}
        </button>
      </div>
    )
  }

  const handleStartRename = () => {
    setNameValue(player.name)
    setEditingName(true)
    setTimeout(() => nameInputRef.current?.focus(), 0)
  }

  const handleFinishRename = () => {
    const trimmed = nameValue.trim()
    if (trimmed && trimmed !== player.name) {
      pgDispatch({ type: 'PG_RENAME_PLAYER', payload: { playerId: player.id, name: trimmed } })
    }
    setEditingName(false)
  }

  const bestPartner = partnerStats.filter(p => p.matchesTogether >= 3).sort((a, b) => b.winRate - a.winRate)[0] ?? null

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back nav */}
      <button
        className="text-sm text-accent hover:underline hover:text-accent-light flex items-center gap-1"
        onClick={() => dispatch({ type: 'NAVIGATE_PAGE', payload: { page: 'players' } })}
      >
        <span>&larr;</span> {t('players.backToList')}
      </button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            {editingName ? (
              <input
                ref={nameInputRef}
                type="text"
                value={nameValue}
                onChange={e => setNameValue(e.target.value)}
                onBlur={handleFinishRename}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleFinishRename()
                  if (e.key === 'Escape') setEditingName(false)
                }}
                className="text-2xl font-bold bg-transparent border-b-2 border-border-focus text-text focus:outline-none"
              />
            ) : (
              <>
                <h2 className="text-2xl font-bold">{player.name}</h2>
                <button
                  onClick={handleStartRename}
                  className="text-text-muted hover:text-text transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
                  </svg>
                </button>
              </>
            )}
            {player.archived && <Badge color="gray">{t('players.archived')}</Badge>}
          </div>
          <p className="text-sm text-text-muted">
            {t('players.memberSince', { date: formatDate(player.createdAt) })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {player.archived ? (
            <Button variant="secondary" onClick={() => pgDispatch({ type: 'PG_UNARCHIVE_PLAYER', payload: { playerId: player.id } })} className="!py-1.5 !text-sm">
              {t('players.unarchive')}
            </Button>
          ) : (
            <Button variant="secondary" onClick={() => pgDispatch({ type: 'PG_ARCHIVE_PLAYER', payload: { playerId: player.id } })} className="!py-1.5 !text-sm">
              {t('players.archive')}
            </Button>
          )}
        </div>
      </div>

      {/* Quick stat badges */}
      <div className="flex flex-wrap gap-3">
        <Badge color="blue">{detailStats.tournamentsPlayed} {t('players.tournaments')}</Badge>
        <Badge color="green">{detailStats.totalMatches} {t('players.matches')}</Badge>
        <Badge color={detailStats.winRate >= 0.5 ? 'green' : 'gray'}>
          {detailStats.totalMatches > 0 ? `${Math.round(detailStats.winRate * 100)}% ${t('players.winRate')}` : '-'}
        </Badge>
      </div>

      {/* Performance Summary */}
      <Card>
        <h3 className="text-lg font-bold mb-4">{t('players.performance')}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-text-muted block">{t('players.winRate')}</span>
            <span className="text-lg font-bold">
              {t('players.record', {
                wins: detailStats.wins,
                losses: detailStats.losses,
                rate: detailStats.totalMatches > 0 ? Math.round(detailStats.winRate * 100) : 0,
              })}
            </span>
          </div>
          <div>
            <span className="text-text-muted block">{t('players.pointsScored')}</span>
            <span className="text-lg font-bold tabular-nums">{detailStats.pointsScored}</span>
          </div>
          <div>
            <span className="text-text-muted block">{t('players.pointsConceded')}</span>
            <span className="text-lg font-bold tabular-nums">{detailStats.pointsConceded}</span>
          </div>
          <div>
            <span className="text-text-muted block">{t('players.pointDiff')}</span>
            <span className={`text-lg font-bold tabular-nums ${detailStats.pointDifferential > 0 ? 'text-emerald-400' : detailStats.pointDifferential < 0 ? 'text-red-400' : ''}`}>
              {detailStats.pointDifferential > 0 ? '+' : ''}{detailStats.pointDifferential}
            </span>
          </div>
          <div>
            <span className="text-text-muted block">{t('players.bestFinish')}</span>
            <span className="text-lg font-bold tabular-nums">
              {detailStats.bestTournamentRank != null ? `#${detailStats.bestTournamentRank}` : '-'}
            </span>
          </div>
          <div>
            <span className="text-text-muted block">{t('players.worstFinish')}</span>
            <span className="text-lg font-bold tabular-nums">
              {detailStats.worstTournamentRank != null ? `#${detailStats.worstTournamentRank}` : '-'}
            </span>
          </div>
          <div>
            <span className="text-text-muted block">{t('players.currentStreak')}</span>
            <span className="text-lg font-bold tabular-nums">{detailStats.currentWinStreak}W</span>
          </div>
          <div>
            <span className="text-text-muted block">{t('players.bestStreak')}</span>
            <span className="text-lg font-bold tabular-nums">{detailStats.bestWinStreak}W</span>
          </div>
          <div>
            <span className="text-text-muted block">{t('players.recentForm')}</span>
            <div className="flex gap-1 mt-1">
              {detailStats.recentForm.length > 0 ? detailStats.recentForm.map((r, i) => (
                <span
                  key={i}
                  className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                    r === 'W' ? 'bg-emerald-900/60 text-emerald-400' : 'bg-red-900/60 text-red-400'
                  }`}
                >
                  {r}
                </span>
              )) : <span className="text-text-muted">-</span>}
            </div>
          </div>
        </div>
      </Card>

      {/* Partnership Stats */}
      {partnerStats.length > 0 && (
        <Card>
          <h3 className="text-lg font-bold mb-3">{t('players.partners')}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-3 py-2 font-medium text-text-muted">{t('players.name')}</th>
                  <th className="px-3 py-2 font-medium text-text-muted">{t('players.matchesTogether')}</th>
                  <th className="px-3 py-2 font-medium text-text-muted">{t('players.winRate')}</th>
                </tr>
              </thead>
              <tbody>
                {partnerStats.map(p => (
                  <tr key={p.partnerId} className="border-b border-border/30">
                    <td className="px-3 py-2">
                      <span className="flex items-center gap-2">
                        {p.partnerName}
                        {bestPartner?.partnerId === p.partnerId && <Badge color="gold">Best</Badge>}
                      </span>
                    </td>
                    <td className="px-3 py-2 tabular-nums">{p.matchesTogether}</td>
                    <td className="px-3 py-2 tabular-nums">{Math.round(p.winRate * 100)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Opponent Stats */}
      {opponentStats.length > 0 && (
        <Card>
          <h3 className="text-lg font-bold mb-3">{t('players.opponents')}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-3 py-2 font-medium text-text-muted">{t('players.name')}</th>
                  <th className="px-3 py-2 font-medium text-text-muted">{t('players.matchesAgainst')}</th>
                  <th className="px-3 py-2 font-medium text-text-muted">{t('players.winRate')}</th>
                </tr>
              </thead>
              <tbody>
                {opponentStats.map(o => (
                  <tr key={o.opponentId} className="border-b border-border/30">
                    <td className="px-3 py-2">{o.opponentName}</td>
                    <td className="px-3 py-2 tabular-nums">{o.matchesAgainst}</td>
                    <td className="px-3 py-2 tabular-nums">{Math.round(o.winRate * 100)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tournament History */}
      <Card>
        <h3 className="text-lg font-bold mb-3">{t('players.tournamentHistory')}</h3>
        {tournamentHistory.length === 0 ? (
          <p className="text-text-muted text-sm">{t('players.noHistory')}</p>
        ) : (
          <div className="space-y-2">
            {tournamentHistory.map(th => (
              <div
                key={th.tournamentId}
                className={`flex items-center justify-between gap-3 p-3 rounded-lg bg-white/[0.02] ${th.excluded ? 'opacity-50' : ''}`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${th.excluded ? 'line-through' : ''}`}>{th.name}</span>
                    {th.excluded && <Badge color="gray">{t('players.excluded')}</Badge>}
                  </div>
                  <div className="text-xs text-text-muted flex gap-3 mt-0.5">
                    <span>{formatDate(th.date)}</span>
                    <span>{t('players.rank', { rank: th.rank, total: th.totalPlayers })}</span>
                    <span>{th.wins}W-{th.losses}L</span>
                    <span>{th.points}pts</span>
                  </div>
                </div>
                <button
                  onClick={() => pgDispatch({ type: 'PG_TOGGLE_TOURNAMENT_EXCLUDED', payload: { tournamentId: th.tournamentId } })}
                  className={`p-1.5 rounded transition-colors shrink-0 ${
                    th.excluded
                      ? 'text-text-muted hover:text-accent hover:bg-white/5'
                      : 'text-text-muted hover:text-yellow-400 hover:bg-yellow-500/10'
                  }`}
                  title={th.excluded ? t('players.unarchive') : t('players.excluded')}
                >
                  {th.excluded ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H4.598a.75.75 0 00-.75.75v3.634a.75.75 0 001.5 0v-2.033l.312.312a7 7 0 0011.712-3.138.75.75 0 00-1.06-.18zm-9.624-2.848a5.5 5.5 0 019.201-2.466l.312.311H12.77a.75.75 0 000 1.5h3.634a.75.75 0 00.75-.75V3.537a.75.75 0 00-1.5 0v2.033l-.312-.312A7 7 0 003.63 8.396a.75.75 0 001.06.18z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                    </svg>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
