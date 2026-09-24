import { produce } from 'immer';
import type {
  RoomMember,
  Scene,
  TableState,
  Token,
  Zone,
  ZoneData,
} from '@sgm/shared';
import type { EngineEvent } from './apply';

function projectToken(token: Token): Token | null {
  if (token.visibility === 'gm') return null;
  if (token.stats?.type !== 'threat') return token;
  const { stats: _stats, ...rest } = token;
  return rest as Token;
}

function projectZoneData(data: ZoneData): ZoneData {
  return {
    ...data,
    customPois: data.customPois?.map((category) => ({
      ...category,
      options: category.options.filter((option) => option.isRevealed !== false),
    })),
    customHighlights: data.customHighlights?.map((category) => ({
      ...category,
      options: category.options.filter((option) => option.isRevealed !== false),
    })),
    customThreats: data.customThreats?.filter(
      (threat) => threat.isRevealed !== false,
    ),
    customInventory: data.customInventory?.filter(
      (item) => item.isFound !== false,
    ),
    customJournal: data.customJournal?.filter(
      (entry) => entry.isRevealed !== false,
    ),
    customNpcs: data.customNpcs?.filter((npc) => npc.isRevealed !== false),
  };
}

function projectZone(zone: Zone): Zone {
  return { ...zone, data: projectZoneData(zone.data) };
}

function projectScene(scene: Scene): Scene {
  const tokens: Scene['tokens'] = {};
  for (const [id, token] of Object.entries(scene.tokens)) {
    const projected = projectToken(token);
    if (projected) tokens[id] = projected;
  }

  const zones: Scene['zones'] = {};
  for (const [id, zone] of Object.entries(scene.zones)) {
    zones[id] = projectZone(zone);
  }

  const markers: Scene['markers'] = {};
  for (const [id, marker] of Object.entries(scene.markers)) {
    if (!marker.hidden) markers[id] = marker;
  }

  return { ...scene, tokens, zones, markers };
}

/**
 * Projeta a mesa para um membro: o mestre vê tudo; jogador e espectador
 * veem só a cena ativa, sem segredos (tokens `visibility: 'gm'`, `stats`
 * de ameaças, marcadores ocultos, itens de zona não revelados).
 */
export function projectFor(table: TableState, member: RoomMember): TableState {
  if (member.role === 'gm') return table;

  return produce(table, (draft) => {
    const activeId = draft.activeSceneId;
    for (const id of Object.keys(draft.scenes)) {
      if (id !== activeId) delete draft.scenes[id];
    }
    if (activeId !== null && draft.scenes[activeId]) {
      draft.scenes[activeId] = projectScene(draft.scenes[activeId]);
    }
  });
}

function tokenFromPayload(payload: unknown): Token | undefined {
  if (
    payload !== null &&
    typeof payload === 'object' &&
    'token' in payload &&
    typeof (payload as { token: unknown }).token === 'object'
  ) {
    return (payload as { token: Token }).token;
  }
  return undefined;
}

function sceneIdFromPayload(payload: unknown): string | undefined {
  if (payload !== null && typeof payload === 'object' && 'sceneId' in payload) {
    return (payload as { sceneId?: string }).sceneId;
  }
  return undefined;
}

function tokenIdFromPayload(payload: unknown): string | undefined {
  if (payload !== null && typeof payload === 'object' && 'tokenId' in payload) {
    return (payload as { tokenId?: string }).tokenId;
  }
  return undefined;
}

function isTokenSecret(table: TableState, event: EngineEvent): boolean {
  const created = tokenFromPayload(event.payload);
  if (created) return created.visibility === 'gm';

  const sceneId = sceneIdFromPayload(event.payload) ?? table.activeSceneId;
  const tokenId = tokenIdFromPayload(event.payload);
  if (sceneId === undefined || sceneId === null || !tokenId) return false;
  const token = table.scenes[sceneId]?.tokens[tokenId];
  return token?.visibility === 'gm';
}

function isMarkerSecret(payload: unknown): boolean {
  if (
    payload !== null &&
    typeof payload === 'object' &&
    'marker' in payload &&
    typeof (payload as { marker: unknown }).marker === 'object'
  ) {
    return Boolean((payload as { marker: { hidden?: boolean } }).marker.hidden);
  }
  return false;
}

function isOffActiveScene(table: TableState, payload: unknown): boolean {
  const sceneId = sceneIdFromPayload(payload);
  if (sceneId === undefined) return false;
  return sceneId !== table.activeSceneId;
}

/**
 * Projeta um evento para um membro: retorna `null` quando o evento
 * revela algo secreto para aquele membro (token de mestre, marcador
 * oculto ou algo fora da cena ativa).
 */
export function projectEvent(
  event: EngineEvent,
  table: TableState,
  member: RoomMember,
): EngineEvent | null {
  if (member.role === 'gm') return event;

  if (isOffActiveScene(table, event.payload)) return null;

  if (event.type.startsWith('token.') && isTokenSecret(table, event))
    return null;

  if (event.type.startsWith('marker.') && isMarkerSecret(event.payload))
    return null;

  return event;
}
