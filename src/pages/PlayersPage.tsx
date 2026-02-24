import { useState, useMemo } from 'react'
import { usePlayerGroup, useTournament, getPlayerOverviewStats } from '../state'
import type { PlayerOverviewStats } from '../state'
import { Card, Button, Modal } from '../components/shared'
import { useT } from '../i18n'
import { formatDate } from '../utils/dates'

type SortKey = 'name' | 'tournamentsPlayed' | 'totalMatches' | 'winRate' | 'lastActive'
type SortDir = 'asc' | 'desc'

export function PlayersPage() {
  const { pgState, pgDispatch, activeGroup } = usePlayerGroup()
  const { dispatch } = useTournament()
  const { t } = useT()

  const [search, setSearch] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [addPlayerName, setAddPlayerName] = useState('')
  const [showAddInput, setShowAddInput] = useState(false)

  const stats = useMemo(() => {
    if (!activeGroup) return []
    return getPlayerOverviewStats(activeGroup)
  }, [activeGroup])

  const filtered = useMemo(() => {
    let list = stats
    if (!showArchived) list = list.filter(s => !s.archived)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(s => s.name.toLowerCase().includes(q))
    }
    list.sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'name': cmp = a.name.localeCompare(b.name); break
        case 'tournamentsPlayed': cmp = a.tournamentsPlayed - b.tournamentsPlayed; break
        case 'totalMatches': cmp = a.totalMatches - b.totalMatches; break
        case 'winRate': cmp = a.winRate - b.winRate; break
        case 'lastActive': cmp = (a.lastActive ?? '').localeCompare(b.lastActive ?? ''); break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
    return list
  }, [stats, showArchived, search, sortKey, sortDir])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir(key === 'name' ? 'asc' : 'desc')
    }
  }

  const handleAddPlayer = () => {
    const name = addPlayerName.trim()
    if (!name) return
    pgDispatch({ type: 'PG_REGISTER_PLAYER', payload: { name } })
    setAddPlayerName('')
    setShowAddInput(false)
  }

  const deletePlayer = filtered.find(s => s.playerId === deleteTarget)

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <span className="text-text-muted/30 ml-1">&#8597;</span>
    return <span className="ml-1">{sortDir === 'asc' ? '&#9650;' : '&#9660;'}</span>
  }

  if (!activeGroup) {
    return (
      <div className="text-center py-12 text-text-muted">
        <p>{t('players.noPlayers')}</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold border-l-4 border-accent pl-3">{t('players.title')}</h2>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t('players.search')}
          className="flex-1 min-w-[200px] px-4 py-2.5 border border-border rounded-lg text-base bg-surface-input text-text focus:outline-none focus:border-border-focus focus:ring-1 focus:ring-border-focus"
        />
        <label className="flex items-center gap-2 text-sm text-text-muted cursor-pointer">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={e => setShowArchived(e.target.checked)}
            className="accent-primary"
          />
          {t('players.showArchived')}
        </label>
        {showAddInput ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={addPlayerName}
              onChange={e => setAddPlayerName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleAddPlayer()
                if (e.key === 'Escape') { setShowAddInput(false); setAddPlayerName('') }
              }}
              placeholder={t('players.addPlayerPlaceholder')}
              className="px-3 py-2 border border-border rounded-lg text-sm bg-surface-input text-text focus:outline-none focus:border-border-focus focus:ring-1 focus:ring-border-focus"
              autoFocus
            />
            <Button onClick={handleAddPlayer} disabled={!addPlayerName.trim()} className="!py-2 !text-sm">
              {t('players.addPlayer')}
            </Button>
          </div>
        ) : (
          <Button variant="secondary" onClick={() => setShowAddInput(true)} className="!py-2 !text-sm">
            {t('players.addPlayer')}
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="text-text-muted text-center py-8">{t('players.noPlayers')}</p>
      ) : (
        <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  {([
                    ['name', t('players.name')],
                    ['tournamentsPlayed', t('players.tournaments')],
                    ['totalMatches', t('players.matches')],
                    ['winRate', t('players.winRate')],
                    ['lastActive', t('players.lastActive')],
                  ] as [SortKey, string][]).map(([key, label]) => (
                    <th
                      key={key}
                      onClick={() => handleSort(key)}
                      className="px-4 py-3 font-medium text-text-muted cursor-pointer hover:text-text transition-colors select-none whitespace-nowrap"
                    >
                      {label}
                      <SortIcon col={key} />
                    </th>
                  ))}
                  <th className="px-4 py-3 w-20" />
                </tr>
              </thead>
              <tbody>
                {filtered.map(player => (
                  <tr
                    key={player.playerId}
                    onClick={() => dispatch({ type: 'VIEW_PLAYER_DETAIL', payload: { playerId: player.playerId } })}
                    className={`border-b border-border/40 cursor-pointer transition-colors hover:bg-white/[0.03] ${
                      player.archived ? 'opacity-50' : ''
                    }`}
                  >
                    <td className="px-4 py-3 font-medium">
                      <span className="flex items-center gap-2">
                        {player.name}
                        {player.archived && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-gray-700/50 text-gray-400">{t('players.archived')}</span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums">{player.tournamentsPlayed}</td>
                    <td className="px-4 py-3 tabular-nums">{player.totalMatches}</td>
                    <td className="px-4 py-3 tabular-nums">
                      {player.totalMatches > 0 ? `${Math.round(player.winRate * 100)}%` : '-'}
                    </td>
                    <td className="px-4 py-3 text-text-muted">
                      {player.lastActive ? formatDate(player.lastActive) : t('players.never')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        {player.archived ? (
                          <button
                            onClick={() => pgDispatch({ type: 'PG_UNARCHIVE_PLAYER', payload: { playerId: player.playerId } })}
                            className="p-1 text-text-muted hover:text-accent rounded hover:bg-white/5 transition-colors"
                            title={t('players.unarchive')}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                              <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H4.598a.75.75 0 00-.75.75v3.634a.75.75 0 001.5 0v-2.033l.312.312a7 7 0 0011.712-3.138.75.75 0 00-1.06-.18zm-9.624-2.848a5.5 5.5 0 019.201-2.466l.312.311H12.77a.75.75 0 000 1.5h3.634a.75.75 0 00.75-.75V3.537a.75.75 0 00-1.5 0v2.033l-.312-.312A7 7 0 003.63 8.396a.75.75 0 001.06.18z" clipRule="evenodd" />
                            </svg>
                          </button>
                        ) : (
                          <button
                            onClick={() => pgDispatch({ type: 'PG_ARCHIVE_PLAYER', payload: { playerId: player.playerId } })}
                            className="p-1 text-text-muted hover:text-yellow-400 rounded hover:bg-yellow-500/10 transition-colors"
                            title={t('players.archive')}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                              <path d="M2 3a1 1 0 00-1 1v1a1 1 0 001 1h16a1 1 0 001-1V4a1 1 0 00-1-1H2z" />
                              <path fillRule="evenodd" d="M2 7.5h16l-.811 7.71a2 2 0 01-1.99 1.79H4.802a2 2 0 01-1.99-1.79L2 7.5zM7 11a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        )}
                        {player.archived && (
                          <button
                            onClick={() => setDeleteTarget(player.playerId)}
                            className="p-1 text-text-muted hover:text-red-400 rounded hover:bg-red-500/10 transition-colors"
                            title={t('playerGroups.delete')}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                              <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022 1.01 11.36A2.75 2.75 0 007.77 20h4.46a2.75 2.75 0 002.745-2.689l1.01-11.36.15.022a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 01.78.72l.5 6a.75.75 0 01-1.49.12l-.5-6a.75.75 0 01.71-.84zm2.84 0a.75.75 0 01.71.84l-.5 6a.75.75 0 11-1.49-.12l.5-6a.75.75 0 01.78-.72z" clipRule="evenodd" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Delete confirmation modal */}
      <Modal
        open={deleteTarget != null}
        onClose={() => setDeleteTarget(null)}
        title={t('playerGroups.delete')}
        confirmText={t('playerGroups.delete')}
        confirmVariant="destructive"
        onConfirm={() => {
          if (deleteTarget) {
            pgDispatch({ type: 'PG_DELETE_PLAYER', payload: { playerId: deleteTarget } })
            setDeleteTarget(null)
          }
        }}
      >
        <p>{t('players.deleteConfirm', { name: deletePlayer?.name ?? '' })}</p>
      </Modal>
    </div>
  )
}
