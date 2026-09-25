import type {
  Command,
  RoomMember,
  TableState,
  Token,
  TokenStats,
} from '@sgm/shared';

function findToken(
  table: TableState,
  sceneId: string | undefined,
  tokenId: string,
): Token | null {
  const targetId = sceneId ?? table.activeSceneId;
  if (targetId === null) return null;
  const scene = table.scenes[targetId];
  if (!scene) return null;
  return scene.tokens[tokenId] ?? null;
}

const ALLOWED_PLAYER_TOKEN_UPDATE_KEYS = new Set(['stats', 'conditions']);
const ALLOWED_PLAYER_STATS_KEYS = new Set<keyof TokenStats>(['pv']);

function canPlayerUpdateToken(
  updates: Partial<Token>,
  token: Token,
  actor: RoomMember,
): boolean {
  if (token.ownerMemberId !== actor.id) return false;

  const keys = Object.keys(updates);
  if (!keys.every((key) => ALLOWED_PLAYER_TOKEN_UPDATE_KEYS.has(key))) {
    return false;
  }

  if (updates.stats) {
    const statsKeys = Object.keys(updates.stats);
    if (
      !statsKeys.every((key) =>
        ALLOWED_PLAYER_STATS_KEYS.has(key as keyof TokenStats),
      )
    ) {
      return false;
    }
  }

  return true;
}

/** Decide se `actor` pode executar `command` no estado atual da mesa. */
export function can(
  actor: RoomMember,
  command: Command,
  table: TableState,
): boolean {
  if (command.type === 'ping') return true;
  if (actor.role === 'spectator') return false;
  if (actor.role === 'gm') return true;

  // Daqui em diante, actor.role === 'player'.
  if (command.type === 'token.move') {
    const token = findToken(
      table,
      command.payload.sceneId,
      command.payload.tokenId,
    );
    return token !== null && token.ownerMemberId === actor.id;
  }

  if (command.type === 'token.update') {
    const token = findToken(
      table,
      command.payload.sceneId,
      command.payload.tokenId,
    );
    if (!token) return false;
    return canPlayerUpdateToken(command.payload.updates, token, actor);
  }

  return false;
}
