import type { PlayerGroupAction, PlayerGroupState } from './actions'
import type { PlayerGroup, RegisteredPlayer } from '../../types'
import { generateId } from '../../utils/ids'
import { deleteGroupStorage } from './persistence'

const MAX_GROUPS = 3

function now(): string {
  return new Date().toISOString()
}

function updateActiveGroup(state: PlayerGroupState, updater: (group: PlayerGroup) => PlayerGroup): PlayerGroupState {
  const activeId = state.index.activeGroupId
  if (!activeId || !state.groups[activeId]) return state
  const updated = updater(state.groups[activeId])
  return {
    ...state,
    groups: { ...state.groups, [activeId]: { ...updated, updatedAt: now() } },
  }
}

export function playerGroupReducer(state: PlayerGroupState, action: PlayerGroupAction): PlayerGroupState {
  switch (action.type) {
    case 'PG_SET_ACTIVE': {
      const { groupId } = action.payload
      if (!state.groups[groupId]) return state
      return {
        ...state,
        index: { ...state.index, activeGroupId: groupId },
      }
    }

    case 'PG_CREATE_GROUP': {
      if (state.index.groupIds.length >= MAX_GROUPS) return state
      const id = generateId()
      const group: PlayerGroup = {
        id,
        name: action.payload.name,
        createdAt: now(),
        updatedAt: now(),
        players: [],
        tournamentHistory: [],
      }
      return {
        index: {
          activeGroupId: state.index.activeGroupId ?? id,
          groupIds: [...state.index.groupIds, id],
        },
        groups: { ...state.groups, [id]: group },
      }
    }

    case 'PG_RENAME_GROUP': {
      const { groupId, name } = action.payload
      const group = state.groups[groupId]
      if (!group) return state
      return {
        ...state,
        groups: {
          ...state.groups,
          [groupId]: { ...group, name, updatedAt: now() },
        },
      }
    }

    case 'PG_DELETE_GROUP': {
      const { groupId } = action.payload
      if (!state.groups[groupId]) return state
      deleteGroupStorage(groupId)
      const newGroupIds = state.index.groupIds.filter(id => id !== groupId)
      const { [groupId]: _, ...remainingGroups } = state.groups
      const newActiveId = state.index.activeGroupId === groupId
        ? (newGroupIds[0] ?? null)
        : state.index.activeGroupId
      return {
        index: { activeGroupId: newActiveId, groupIds: newGroupIds },
        groups: remainingGroups,
      }
    }

    case 'PG_IMPORT_GROUP': {
      if (state.index.groupIds.length >= MAX_GROUPS) return state
      const imported = action.payload.group
      const id = generateId()
      const group: PlayerGroup = {
        ...imported,
        id,
        createdAt: now(),
        updatedAt: now(),
      }
      return {
        index: {
          activeGroupId: state.index.activeGroupId ?? id,
          groupIds: [...state.index.groupIds, id],
        },
        groups: { ...state.groups, [id]: group },
      }
    }

    case 'PG_REGISTER_PLAYER': {
      return updateActiveGroup(state, group => {
        const nameLower = action.payload.name.trim().toLowerCase()
        if (group.players.some(p => p.name.toLowerCase() === nameLower)) return group
        const player: RegisteredPlayer = {
          id: generateId(),
          name: action.payload.name.trim(),
          createdAt: now(),
          updatedAt: now(),
          archived: false,
        }
        return { ...group, players: [...group.players, player] }
      })
    }

    case 'PG_REGISTER_PLAYERS_BATCH': {
      return updateActiveGroup(state, group => {
        const existingNames = new Set(group.players.map(p => p.name.toLowerCase()))
        const newPlayers: RegisteredPlayer[] = []
        const { names, ids } = action.payload
        for (let i = 0; i < names.length; i++) {
          const name = names[i].trim()
          if (!name || existingNames.has(name.toLowerCase())) continue
          existingNames.add(name.toLowerCase())
          newPlayers.push({
            id: ids?.[i] ?? generateId(),
            name,
            createdAt: now(),
            updatedAt: now(),
            archived: false,
          })
        }
        if (newPlayers.length === 0) return group
        return { ...group, players: [...group.players, ...newPlayers] }
      })
    }

    case 'PG_RENAME_PLAYER': {
      return updateActiveGroup(state, group => {
        const { playerId, name } = action.payload
        const trimmed = name.trim()
        if (!trimmed) return group
        const nameLower = trimmed.toLowerCase()
        if (group.players.some(p => p.id !== playerId && p.name.toLowerCase() === nameLower)) return group
        return {
          ...group,
          players: group.players.map(p =>
            p.id === playerId ? { ...p, name: trimmed, updatedAt: now() } : p
          ),
        }
      })
    }

    case 'PG_ARCHIVE_PLAYER': {
      return updateActiveGroup(state, group => ({
        ...group,
        players: group.players.map(p =>
          p.id === action.payload.playerId ? { ...p, archived: true, updatedAt: now() } : p
        ),
      }))
    }

    case 'PG_UNARCHIVE_PLAYER': {
      return updateActiveGroup(state, group => ({
        ...group,
        players: group.players.map(p =>
          p.id === action.payload.playerId ? { ...p, archived: false, updatedAt: now() } : p
        ),
      }))
    }

    case 'PG_DELETE_PLAYER': {
      return updateActiveGroup(state, group => ({
        ...group,
        players: group.players.filter(p => p.id !== action.payload.playerId),
      }))
    }

    case 'PG_ADD_TOURNAMENT_RECORD': {
      return updateActiveGroup(state, group => ({
        ...group,
        tournamentHistory: [...group.tournamentHistory, action.payload.record],
      }))
    }

    case 'PG_TOGGLE_TOURNAMENT_EXCLUDED': {
      return updateActiveGroup(state, group => ({
        ...group,
        tournamentHistory: group.tournamentHistory.map(t =>
          t.id === action.payload.tournamentId ? { ...t, excluded: !t.excluded } : t
        ),
      }))
    }

    default:
      return state
  }
}
