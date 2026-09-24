import { z } from 'zod';
import { Scene } from './scene';

export const TableState = z.object({
  version: z.number().int().nonnegative(),
  activeSceneId: z.string().uuid().nullable(),
  round: z.number().int().nonnegative(),
  turn: z.number().int().nonnegative(),
  scenes: z.record(z.string().uuid(), Scene),
});
export type TableState = z.infer<typeof TableState>;
