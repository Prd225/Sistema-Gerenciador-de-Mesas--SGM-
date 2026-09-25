import { produce } from 'immer';
import type {
  EventType,
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

function sceneIdFromPayload(payload: unknown): string | undefined {
  if (payload !== null && typeof payload === 'object' && 'sceneId' in payload) {
    return (payload as { sceneId?: string }).sceneId;
  }
  return undefined;
}

function idFieldFromPayload(payload: unknown, key: string): string | undefined {
  if (payload !== null && typeof payload === 'object' && key in payload) {
    const value = (payload as Record<string, unknown>)[key];
    return typeof value === 'string' ? value : undefined;
  }
  return undefined;
}

function entityIdFromPayload(
  payload: unknown,
  key: string,
): string | undefined {
  if (payload !== null && typeof payload === 'object' && key in payload) {
    const entity = (payload as Record<string, unknown>)[key];
    if (entity !== null && typeof entity === 'object' && 'id' in entity) {
      const id = (entity as { id: unknown }).id;
      return typeof id === 'string' ? id : undefined;
    }
  }
  return undefined;
}

function isOffActiveScene(table: TableState, payload: unknown): boolean {
  const sceneId = sceneIdFromPayload(payload);
  if (sceneId === undefined) return false;
  return sceneId !== table.activeSceneId;
}

/** Checa se um `updates` do payload troca `field` para `revealedValue`. */
function isRevealingUpdate<T>(
  payload: unknown,
  field: string,
  revealedValue: T,
): boolean {
  if (
    payload === null ||
    typeof payload !== 'object' ||
    !('updates' in payload)
  ) {
    return false;
  }
  const updates = (payload as { updates?: Record<string, unknown> }).updates;
  return updates !== undefined && updates[field] === revealedValue;
}

/**
 * Eventos `token.created`/`token.updated`: troca o payload pela entidade
 * já projetada (nunca o `updates` cru, que pode conter `stats` secreto).
 * Se o token não existir mais para o membro, o evento vira `null`. Se a
 * atualização revelou um token antes `visibility: 'gm'`, o evento chega
 * como `token.created`.
 */
function projectTokenEvent(
  event: EngineEvent,
  table: TableState,
): EngineEvent | null {
  const sceneId = sceneIdFromPayload(event.payload) ?? table.activeSceneId;
  const tokenId =
    event.type === 'token.created'
      ? entityIdFromPayload(event.payload, 'token')
      : idFieldFromPayload(event.payload, 'tokenId');
  if (sceneId === undefined || sceneId === null || !tokenId) return event;

  const token = table.scenes[sceneId]?.tokens[tokenId];
  if (!token) return null;

  const projected = projectToken(token);
  if (!projected) return null;

  const revealed =
    event.type === 'token.updated' &&
    isRevealingUpdate(event.payload, 'visibility', 'all');
  const type: EventType = revealed ? 'token.created' : event.type;

  return { type, payload: { sceneId, token: projected } };
}

/**
 * Eventos `marker.created`/`marker.updated`: troca o payload pelo marcador
 * já projetado. Marcador oculto vira `null`; revelar (`hidden: true -> false`)
 * chega como `marker.created`.
 */
function projectMarkerEvent(
  event: EngineEvent,
  table: TableState,
): EngineEvent | null {
  const sceneId = sceneIdFromPayload(event.payload) ?? table.activeSceneId;
  const markerId =
    event.type === 'marker.created'
      ? entityIdFromPayload(event.payload, 'marker')
      : idFieldFromPayload(event.payload, 'markerId');
  if (sceneId === undefined || sceneId === null || !markerId) return event;

  const marker = table.scenes[sceneId]?.markers[markerId];
  if (!marker) return null;
  if (marker.hidden) return null;

  const revealed =
    event.type === 'marker.updated' &&
    isRevealingUpdate(event.payload, 'hidden', false);
  const type: EventType = revealed ? 'marker.created' : event.type;

  return { type, payload: { sceneId, marker } };
}

/**
 * Eventos `zone.created`/`zone.updated`: troca o payload pela zona já
 * projetada (sem itens `isRevealed: false`/`isFound: false`).
 */
function projectZoneEvent(event: EngineEvent, table: TableState): EngineEvent {
  const sceneId = sceneIdFromPayload(event.payload) ?? table.activeSceneId;
  const zoneId =
    event.type === 'zone.created'
      ? entityIdFromPayload(event.payload, 'zone')
      : idFieldFromPayload(event.payload, 'zoneId');
  if (sceneId === undefined || sceneId === null || !zoneId) return event;

  const zone = table.scenes[sceneId]?.zones[zoneId];
  if (!zone) return event;

  return { type: event.type, payload: { sceneId, zone: projectZone(zone) } };
}

function isTokenVisibilitySecret(table: TableState, payload: unknown): boolean {
  const sceneId = sceneIdFromPayload(payload) ?? table.activeSceneId;
  const tokenId = idFieldFromPayload(payload, 'tokenId');
  if (sceneId === undefined || sceneId === null || !tokenId) return false;
  return table.scenes[sceneId]?.tokens[tokenId]?.visibility === 'gm';
}

/**
 * Projeta um evento para um membro. `table` é a mesa DEPOIS do comando
 * (o estado já refletindo o efeito do evento). Retorna `null` quando o
 * evento revela algo secreto para aquele membro: token de mestre,
 * marcador oculto, item de zona não revelado ou algo fora da cena ativa.
 */
export function projectEvent(
  event: EngineEvent,
  table: TableState,
  member: RoomMember,
): EngineEvent | null {
  if (member.role === 'gm') return event;

  if (isOffActiveScene(table, event.payload)) return null;

  if (event.type === 'token.created' || event.type === 'token.updated') {
    return projectTokenEvent(event, table);
  }
  if (event.type === 'token.moved' || event.type === 'token.deleted') {
    return isTokenVisibilitySecret(table, event.payload) ? null : event;
  }

  if (event.type === 'marker.created' || event.type === 'marker.updated') {
    return projectMarkerEvent(event, table);
  }

  if (event.type === 'zone.created' || event.type === 'zone.updated') {
    return projectZoneEvent(event, table);
  }

  return event;
}
