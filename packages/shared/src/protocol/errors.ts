import { z } from 'zod';

export const ErrorCodeSchema = z.enum([
  'UNAUTHORIZED',
  'FORBIDDEN',
  'ROOM_NOT_FOUND',
  'ROOM_FULL',
  'INVALID_PAYLOAD',
  'RATE_LIMITED',
  'INTERNAL_ERROR',
]);
export const ErrorCode = ErrorCodeSchema;
export type ErrorCode = z.infer<typeof ErrorCodeSchema>;

export const SocketErrorSchema = z.object({
  code: ErrorCodeSchema,
  message: z.string(),
  details: z.any().optional(),
});
export const SocketError = SocketErrorSchema;
export type SocketError = z.infer<typeof SocketErrorSchema>;

