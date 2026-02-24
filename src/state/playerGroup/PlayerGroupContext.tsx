import { createContext, useContext, useReducer, useEffect, type ReactNode, type Dispatch } from 'react'
import type { PlayerGroupState, PlayerGroupAction } from './actions'
import type { PlayerGroup } from '../../types'
import { playerGroupReducer } from './reducer'
import { loadIndex, loadGroup, saveIndex, saveGroup } from './persistence'
import { getActiveGroup } from './selectors'
import { generateId } from '../../utils/ids'

interface PlayerGroupContextValue {
  pgState: PlayerGroupState
  pgDispatch: Dispatch<PlayerGroupAction>
  activeGroup: PlayerGroup | null
}

const PlayerGroupContext = createContext<PlayerGroupContextValue | null>(null)

function buildInitialState(): PlayerGroupState {
  const index = loadIndex()
  if (index) {
    const groups: Record<string, PlayerGroup> = {}
    for (const gid of index.groupIds) {
      const group = loadGroup(gid)
      if (group) groups[gid] = group
    }
    // Clean up any missing groups
    const validIds = index.groupIds.filter(id => groups[id])
    const cleanIndex = {
      ...index,
      groupIds: validIds,
      activeGroupId: index.activeGroupId && groups[index.activeGroupId] ? index.activeGroupId : (validIds[0] ?? null),
    }
    if (validIds.length > 0) {
      return { index: cleanIndex, groups }
    }
  }

  // Auto-create default group
  const id = generateId()
  const now = new Date().toISOString()
  const defaultGroup: PlayerGroup = {
    id,
    name: 'My Players',
    createdAt: now,
    updatedAt: now,
    players: [],
    tournamentHistory: [],
  }
  return {
    index: { activeGroupId: id, groupIds: [id] },
    groups: { [id]: defaultGroup },
  }
}

export function PlayerGroupProvider({ children }: { children: ReactNode }) {
  const [pgState, pgDispatch] = useReducer(playerGroupReducer, null, buildInitialState)

  // Persist index + active group on every state change
  useEffect(() => {
    saveIndex(pgState.index)
    const activeId = pgState.index.activeGroupId
    if (activeId && pgState.groups[activeId]) {
      saveGroup(pgState.groups[activeId])
    }
  }, [pgState])

  // Also persist any non-active group that changed (for rename/delete)
  useEffect(() => {
    for (const gid of pgState.index.groupIds) {
      if (pgState.groups[gid]) {
        saveGroup(pgState.groups[gid])
      }
    }
  }, [pgState.index.groupIds.length])

  const activeGroup = getActiveGroup(pgState)

  return (
    <PlayerGroupContext.Provider value={{ pgState, pgDispatch, activeGroup }}>
      {children}
    </PlayerGroupContext.Provider>
  )
}

export function usePlayerGroup() {
  const ctx = useContext(PlayerGroupContext)
  if (!ctx) throw new Error('usePlayerGroup must be used within PlayerGroupProvider')
  return ctx
}
