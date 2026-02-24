import type { PlayerGroup, PlayerGroupIndex, TournamentRecord } from '../../types'

export type PlayerGroupAction =
  | { type: 'PG_SET_ACTIVE'; payload: { groupId: string } }
  | { type: 'PG_CREATE_GROUP'; payload: { name: string } }
  | { type: 'PG_RENAME_GROUP'; payload: { groupId: string; name: string } }
  | { type: 'PG_DELETE_GROUP'; payload: { groupId: string } }
  | { type: 'PG_IMPORT_GROUP'; payload: { group: PlayerGroup } }
  | { type: 'PG_REGISTER_PLAYER'; payload: { name: string } }
  | { type: 'PG_REGISTER_PLAYERS_BATCH'; payload: { names: string[]; ids?: string[] } }
  | { type: 'PG_RENAME_PLAYER'; payload: { playerId: string; name: string } }
  | { type: 'PG_ARCHIVE_PLAYER'; payload: { playerId: string } }
  | { type: 'PG_UNARCHIVE_PLAYER'; payload: { playerId: string } }
  | { type: 'PG_DELETE_PLAYER'; payload: { playerId: string } }
  | { type: 'PG_ADD_TOURNAMENT_RECORD'; payload: { record: TournamentRecord } }
  | { type: 'PG_TOGGLE_TOURNAMENT_EXCLUDED'; payload: { tournamentId: string } }

export interface PlayerGroupState {
  index: PlayerGroupIndex
  groups: Record<string, PlayerGroup>
}
