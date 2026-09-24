import { z } from 'zod';
import { TableState } from '../domain/table';
import { ErrorCode } from './errors';

export const CommandEnvelope = z.object({
  id: z.string().uuid(),
  type: z.string().min(1).max(100),
  payload: z.unknown(),
});
export type CommandEnvelope = z.infer<typeof CommandEnvelope>;

export const AckSuccess = z.object({
  ok: z.literal(true),
  version: z.number().int().nonnegative(),
});
export type AckSuccess = z.infer<typeof AckSuccess>;

export const AckError = z.object({
  ok: z.literal(false),
  code: ErrorCode,
  message: z.string().max(500),
});
export type AckError = z.infer<typeof AckError>;

export const AckEnvelope = z.discriminatedUnion('ok', [AckSuccess, AckError]);
export type AckEnvelope = z.infer<typeof AckEnvelope>;

export const EventEnvelope = z.object({
  version: z.number().int().nonnegative(),
  type: z.string().min(1).max(100),
  payload: z.unknown(),
  actorId: z.string().uuid(),
  cmdId: z.string().uuid().optional(),
});
export type EventEnvelope = z.infer<typeof EventEnvelope>;

export const SnapshotEnvelope = z.object({
  version: z.number().int().nonnegative(),
  table: TableState,
});
export type SnapshotEnvelope = z.infer<typeof SnapshotEnvelope>;

// Aliases curtos conforme spec seção 4
export const Cmd = CommandEnvelope;
export type Cmd = CommandEnvelope;

export const Ack = AckEnvelope;
export type Ack = AckEnvelope;

export const Evt = EventEnvelope;
export type Evt = EventEnvelope;

export const Snapshot = SnapshotEnvelope;
export type Snapshot = SnapshotEnvelope;
