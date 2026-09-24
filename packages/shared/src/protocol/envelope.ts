import { z } from 'zod';

export const CommandEnvelopeSchema = z.object({
  id: z.string(),
  type: z.string(),
  payload: z.unknown(),
  timestamp: z.number(),
  memberId: z.string().optional(),
});
export const CommandEnvelope = CommandEnvelopeSchema;
export type CommandEnvelope = z.infer<typeof CommandEnvelopeSchema>;

export const EventEnvelopeSchema = z.object({
  id: z.string(),
  type: z.string(),
  payload: z.unknown(),
  timestamp: z.number(),
  version: z.number().optional(),
});
export const EventEnvelope = EventEnvelopeSchema;
export type EventEnvelope = z.infer<typeof EventEnvelopeSchema>;

