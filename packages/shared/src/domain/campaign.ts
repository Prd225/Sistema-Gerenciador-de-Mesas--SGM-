import { z } from 'zod';
import { TableState } from './table';
import { PanelState } from './panel';

export const Campaign = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  updatedAt: z.string().datetime(),
  table: TableState,
  panel: PanelState,
});
export type Campaign = z.infer<typeof Campaign>;
