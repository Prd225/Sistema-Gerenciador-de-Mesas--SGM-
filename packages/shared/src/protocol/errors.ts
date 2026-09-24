import { z } from 'zod';

export const ErrorCode = z.enum([
  'INVALID_PAYLOAD',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'RATE_LIMITED',
  'ROOM_CLOSED',
]);
export type ErrorCode = z.infer<typeof ErrorCode>;

export const ProtocolError = z.object({
  code: ErrorCode,
  message: z.string().max(500),
  details: z.unknown().optional(),
});
export type ProtocolError = z.infer<typeof ProtocolError>;
