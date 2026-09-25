import { produce } from 'immer';
import type { Scene, TableState } from '@sgm/shared';

/**
 * Resultado de um handler de comando: a mesa atualizada, `null` quando o
 * alvo (cena ou item) não existe, `'conflict'` quando um `*.create`
 * tentou usar um id já existente, ou `'invalid'` quando o payload é válido
 * no schema mas geraria um estado inválido.
 */
export type HandlerResult = TableState | null | 'conflict' | 'invalid';

/** Resolve o id da cena alvo: o informado, ou a cena ativa. */
export function resolveSceneId(
  table: TableState,
  sceneId: string | undefined,
): string | null {
  return sceneId ?? table.activeSceneId;
}

/**
 * Aplica `mutator` na cena alvo (informada ou ativa) dentro de uma cópia
 * imutável da mesa. Retorna `null` quando a cena não existe.
 */
export function withScene(
  table: TableState,
  sceneId: string | undefined,
  mutator: (scene: Scene) => void,
): TableState | null {
  const targetId = resolveSceneId(table, sceneId);
  if (targetId === null || !table.scenes[targetId]) return null;

  return produce(table, (draft) => {
    mutator(draft.scenes[targetId]!);
  });
}

/** Busca uma cena (informada ou ativa) sem alterar a mesa. */
export function findScene(
  table: TableState,
  sceneId: string | undefined,
): Scene | null {
  const targetId = resolveSceneId(table, sceneId);
  if (targetId === null) return null;
  return table.scenes[targetId] ?? null;
}
