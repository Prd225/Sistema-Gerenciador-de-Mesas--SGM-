import { z } from 'zod';

export const InitiativeSortMode = z.enum(['descending', 'ascending', 'custom']);
export type InitiativeSortMode = z.infer<typeof InitiativeSortMode>;

export const InitiativeItem = z.object({
  tokenId: z.string().uuid(),
  value: z.number(),
});
export type InitiativeItem = z.infer<typeof InitiativeItem>;

export const InitiativeState = z.object({
  order: z.array(z.string().uuid()).max(1000),
  values: z.record(z.string().uuid(), z.number()),
});
export type InitiativeState = z.infer<typeof InitiativeState>;
