import type { PlayerGroupIndex, PlayerGroup } from '../../types'

const INDEX_KEY = 'padel-player-group-index'
const GROUP_KEY_PREFIX = 'padel-player-group-'

export function saveIndex(index: PlayerGroupIndex): void {
  try {
    localStorage.setItem(INDEX_KEY, JSON.stringify(index))
  } catch {
    // Storage full or unavailable
  }
}

export function loadIndex(): PlayerGroupIndex | null {
  try {
    const raw = localStorage.getItem(INDEX_KEY)
    if (!raw) return null
    return JSON.parse(raw) as PlayerGroupIndex
  } catch {
    return null
  }
}

export function saveGroup(group: PlayerGroup): void {
  try {
    localStorage.setItem(GROUP_KEY_PREFIX + group.id, JSON.stringify(group))
  } catch {
    // Storage full or unavailable
  }
}

export function loadGroup(id: string): PlayerGroup | null {
  try {
    const raw = localStorage.getItem(GROUP_KEY_PREFIX + id)
    if (!raw) return null
    return JSON.parse(raw) as PlayerGroup
  } catch {
    return null
  }
}

export function deleteGroupStorage(id: string): void {
  localStorage.removeItem(GROUP_KEY_PREFIX + id)
}
