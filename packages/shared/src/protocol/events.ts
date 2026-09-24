import { z } from 'zod';

export const EventType = z.enum([
  'token.created',
  'token.moved',
  'token.updated',
  'token.deleted',
  'zone.created',
  'zone.updated',
  'zone.deleted',
  'marker.created',
  'marker.updated',
  'marker.deleted',
  'background.created',
  'background.updated',
  'background.deleted',
  'scene.created',
  'scene.updated',
  'scene.deleted',
  'scene.activated',
  'initiative.updated',
  'round.advanced',
  'turn.advanced',
  'pinged',
]);
export type EventType = z.infer<typeof EventType>;

export const ServerEvent = z.object({
  version: z.number().int().nonnegative(),
  type: EventType,
  payload: z.unknown(),
  actorId: z.string().uuid(),
  cmdId: z.string().uuid().optional(),
});
export type ServerEvent = z.infer<typeof ServerEvent>;
