import type { Token } from '../../src/types/game';
import type {
  PlayerConditionView,
  PlayerStatePayload,
  PlayerTokenView,
} from '../../src/types/multiplayer';
import type { ActiveRoom } from './roomManager';

/**
 * Projeção do estado da sala para jogadores.
 *
 * É AQUI que se decide o que um jogador pode ver. Tudo que não for copiado
 * explicitamente abaixo (ficha, estatísticas, anotações, zonas, marcadores...)
 * simplesmente nunca é enviado a ele. Para liberar algo no futuro, inclua o
 * campo aqui e no tipo `PlayerTokenView`.
 */

/** Campos de token que o jogador pode receber em atualizações parciais. */
const PUBLIC_TOKEN_KEYS = [
  'name',
  'fullName',
  'colorText',
  'colorBorder',
  'colorFill',
  'x',
  'y',
  'imageUrl',
  'conditions',
] as const satisfies readonly (keyof Token)[];

function toConditionView(c: Token['conditions'][number]): PlayerConditionView {
  // `desc` fica de fora de propósito: pode conter anotações do mestre.
  return {
    name: c.name,
    color: c.color,
    type: c.type,
    durationTurns: c.durationTurns,
  };
}

export function toPlayerToken(token: Token): PlayerTokenView {
  return {
    id: token.id,
    name: token.name,
    fullName: token.fullName,
    colorText: token.colorText,
    colorBorder: token.colorBorder,
    colorFill: token.colorFill,
    x: token.x,
    y: token.y,
    imageUrl: token.imageUrl,
    conditions: (token.conditions ?? []).map(toConditionView),
  };
}

/**
 * Filtra uma atualização parcial de token para a visão do jogador.
 * Retorna `null` quando nada do que mudou é público (nada a repassar).
 */
export function toPlayerTokenUpdates(
  updates: Partial<Token>,
): Partial<PlayerTokenView> | null {
  const result: Partial<PlayerTokenView> = {};
  let hasPublicChange = false;

  for (const key of PUBLIC_TOKEN_KEYS) {
    if (!(key in updates)) continue;
    hasPublicChange = true;
    if (key === 'conditions') {
      result.conditions = (updates.conditions ?? []).map(toConditionView);
    } else {
      (result as Record<string, unknown>)[key] = updates[key];
    }
  }

  return hasPublicChange ? result : null;
}

export function toPlayerState(room: ActiveRoom): PlayerStatePayload {
  return {
    tokens: room.tokens.map(toPlayerToken),
    initiativeQueue: room.initiativeQueue,
    initiativeSortMode: room.initiativeSortMode,
    bgImages: room.bgImages,
    round: room.round,
    turn: room.turn,
    fog: room.fog,
  };
}
