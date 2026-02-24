import { useState, useRef } from 'react'
import { usePlayerGroup, useTournament } from '../state'
import { Card, Button, Modal, Badge } from '../components/shared'
import { useT } from '../i18n'
import { downloadFile } from '../utils/export'
import { formatDate } from '../utils/dates'
import type { PlayerGroup } from '../types'

const MAX_GROUPS = 3

export function PlayerGroupsPage() {
  const { pgState, pgDispatch, activeGroup } = usePlayerGroup()
  const { state: tournamentState } = useTournament()
  const { t } = useT()

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [importError, setImportError] = useState<string | null>(null)
  const [newGroupName, setNewGroupName] = useState('')
  const [showCreateInput, setShowCreateInput] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const renameInputRef = useRef<HTMLInputElement>(null)

  const hasTournamentInProgress = tournamentState.tournament != null && tournamentState.tournament.phase === 'playing'
  const groups = pgState.index.groupIds.map(id => pgState.groups[id]).filter(Boolean) as PlayerGroup[]
  const canCreate = groups.length < MAX_GROUPS

  const deleteGroupObj = deleteTarget ? pgState.groups[deleteTarget] : null

  const handleExport = (group: PlayerGroup) => {
    const exportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      group: {
        name: group.name,
        players: group.players,
        tournamentHistory: group.tournamentHistory,
      },
    }
    downloadFile(JSON.stringify(exportData, null, 2), `${group.name.replace(/\s+/g, '_')}.json`, 'application/json')
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null)
    const file = e.target.files?.[0]
    if (!file) return

    if (!canCreate) {
      setImportError(t('playerGroups.importMaxError'))
      e.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string)
        if (!data.group || !data.group.name || !Array.isArray(data.group.players)) {
          setImportError(t('playerGroups.importError'))
          return
        }
        pgDispatch({
          type: 'PG_IMPORT_GROUP',
          payload: {
            group: {
              id: '',
              name: data.group.name,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              players: data.group.players ?? [],
              tournamentHistory: data.group.tournamentHistory ?? [],
            },
          },
        })
      } catch {
        setImportError(t('playerGroups.importError'))
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleCreateGroup = () => {
    const name = newGroupName.trim()
    if (!name || !canCreate) return
    pgDispatch({ type: 'PG_CREATE_GROUP', payload: { name } })
    setNewGroupName('')
    setShowCreateInput(false)
  }

  const handleStartRename = (group: PlayerGroup) => {
    setRenamingId(group.id)
    setRenameValue(group.name)
    setTimeout(() => renameInputRef.current?.focus(), 0)
  }

  const handleFinishRename = () => {
    if (renamingId && renameValue.trim()) {
      pgDispatch({ type: 'PG_RENAME_GROUP', payload: { groupId: renamingId, name: renameValue.trim() } })
    }
    setRenamingId(null)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold border-l-4 border-accent pl-3">{t('playerGroups.title')}</h2>

      {groups.length === 0 && (
        <p className="text-text-muted">{t('playerGroups.empty')}</p>
      )}

      <div className="space-y-3">
        {groups.map(group => {
          const isActive = group.id === pgState.index.activeGroupId
          const playerCount = group.players.filter(p => !p.archived).length
          const tournamentCount = group.tournamentHistory.length

          return (
            <Card key={group.id} className={isActive ? '!border-primary/50 ring-1 !ring-primary/20' : ''}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {renamingId === group.id ? (
                      <input
                        ref={renameInputRef}
                        type="text"
                        value={renameValue}
                        onChange={e => setRenameValue(e.target.value)}
                        onBlur={handleFinishRename}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleFinishRename()
                          if (e.key === 'Escape') setRenamingId(null)
                        }}
                        className="text-lg font-bold bg-transparent border-b-2 border-border-focus text-text focus:outline-none"
                      />
                    ) : (
                      <h3 className="text-lg font-bold truncate">{group.name}</h3>
                    )}
                    {isActive && <Badge color="green">{t('playerGroups.active')}</Badge>}
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-text-muted">
                    <span>{t('playerGroups.players', { count: playerCount })}</span>
                    <span>{t('playerGroups.tournaments', { count: tournamentCount })}</span>
                  </div>
                  <p className="text-xs text-text-muted mt-1">
                    {t('playerGroups.lastUpdated', { date: formatDate(group.updatedAt) })}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {!isActive && (
                    <div className="relative group/switch">
                      <Button
                        variant="secondary"
                        onClick={() => pgDispatch({ type: 'PG_SET_ACTIVE', payload: { groupId: group.id } })}
                        disabled={hasTournamentInProgress}
                        className="!px-3 !py-1.5 !text-sm"
                      >
                        {t('playerGroups.switch')}
                      </Button>
                      {hasTournamentInProgress && (
                        <div className="invisible group-hover/switch:visible absolute right-0 top-full mt-1 w-52 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg z-10">
                          {t('playerGroups.switchBlocked')}
                        </div>
                      )}
                    </div>
                  )}
                  <button
                    onClick={() => handleStartRename(group)}
                    className="p-1.5 text-text-muted hover:text-text rounded hover:bg-white/5 transition-colors"
                    title={t('playerGroups.rename')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleExport(group)}
                    className="p-1.5 text-text-muted hover:text-text rounded hover:bg-white/5 transition-colors"
                    title={t('playerGroups.export')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
                      <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setDeleteTarget(group.id)}
                    className="p-1.5 text-text-muted hover:text-red-400 rounded hover:bg-red-500/10 transition-colors"
                    title={t('playerGroups.delete')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022 1.01 11.36A2.75 2.75 0 007.77 20h4.46a2.75 2.75 0 002.745-2.689l1.01-11.36.15.022a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 01.78.72l.5 6a.75.75 0 01-1.49.12l-.5-6a.75.75 0 01.71-.84zm2.84 0a.75.75 0 01.71.84l-.5 6a.75.75 0 11-1.49-.12l.5-6a.75.75 0 01.78-.72z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Create new group */}
      <div className="flex flex-wrap items-center gap-3">
        {showCreateInput ? (
          <div className="flex items-center gap-2 flex-1">
            <input
              type="text"
              value={newGroupName}
              onChange={e => setNewGroupName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleCreateGroup()
                if (e.key === 'Escape') { setShowCreateInput(false); setNewGroupName('') }
              }}
              placeholder={t('playerGroups.defaultName')}
              className="flex-1 px-4 py-2.5 border border-border rounded-lg text-base bg-surface-input text-text focus:outline-none focus:border-border-focus focus:ring-1 focus:ring-border-focus"
              autoFocus
            />
            <Button onClick={handleCreateGroup} disabled={!newGroupName.trim()} className="!py-2.5">
              {t('playerGroups.create')}
            </Button>
            <Button variant="secondary" onClick={() => { setShowCreateInput(false); setNewGroupName('') }} className="!py-2.5">
              {t('modal.cancel')}
            </Button>
          </div>
        ) : (
          <>
            <div className="relative group/create">
              <Button
                variant="secondary"
                onClick={() => setShowCreateInput(true)}
                disabled={!canCreate}
              >
                {t('playerGroups.create')}
              </Button>
              {!canCreate && (
                <div className="invisible group-hover/create:visible absolute left-0 top-full mt-1 w-40 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg z-10">
                  {t('playerGroups.maxReached')}
                </div>
              )}
            </div>
            <div className="relative group/import">
              <Button variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={!canCreate}>
                {t('playerGroups.import')}
              </Button>
              {!canCreate && (
                <div className="invisible group-hover/import:visible absolute left-0 top-full mt-1 w-52 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg z-10">
                  {t('playerGroups.importMaxError')}
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
          </>
        )}
      </div>

      {importError && (
        <p className="text-red-400 text-sm">{importError}</p>
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
            pgDispatch({ type: 'PG_DELETE_GROUP', payload: { groupId: deleteTarget } })
            setDeleteTarget(null)
          }
        }}
      >
        <p>{t('playerGroups.deleteConfirm', { name: deleteGroupObj?.name ?? '' })}</p>
      </Modal>
    </div>
  )
}
