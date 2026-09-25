import { z } from 'zod';

export const PanelState = z.object({
  diary: z.record(z.string().uuid(), z.unknown()),
  notes: z.record(z.string().uuid(), z.unknown()),
  rules: z.record(z.string().uuid(), z.unknown()),
  tables: z.record(z.string().uuid(), z.unknown()),
  roulettes: z.record(z.string().uuid(), z.unknown()),
  soundpad: z.record(z.string().uuid(), z.unknown()),
});
export type PanelState = z.infer<typeof PanelState>;
