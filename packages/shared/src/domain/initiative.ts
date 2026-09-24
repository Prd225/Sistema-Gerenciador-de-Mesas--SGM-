import { z } from 'zod';

export const InitiativeSortModeSchema = z.enum([
  'descending',
  'ascending',
  'custom',
]);
export const InitiativeSortMode = InitiativeSortModeSchema;
export type InitiativeSortMode = z.infer<typeof InitiativeSortModeSchema>;

export const InitiativeItemSchema = z.object({
  tokenId: z.string(),
  value: z.number(),
});
export const InitiativeItem = InitiativeItemSchema;
export type InitiativeItem = z.infer<typeof InitiativeItemSchema>;
