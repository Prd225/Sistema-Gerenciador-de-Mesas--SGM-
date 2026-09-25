import { produce } from 'immer';
import type {
  TableState,
  RoundNextPayload,
  TurnNextPayload,
} from '@sgm/shared';

export function roundNext(
  table: TableState,
  payload: RoundNextPayload,
): TableState {
  return produce(table, (draft) => {
    draft.round = payload.round ?? table.round + 1;
  });
}

export function turnNext(
  table: TableState,
  payload: TurnNextPayload,
): TableState {
  return produce(table, (draft) => {
    draft.turn = payload.turn ?? table.turn + 1;
  });
}
