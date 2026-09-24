import { z } from 'zod';

export const MemberRole = z.enum(['gm', 'player', 'spectator']);
export type MemberRole = z.infer<typeof MemberRole>;

export const RoomMember = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  role: MemberRole,
  color: z.string().max(50),
  isOnline: z.boolean().optional(),
});
export type RoomMember = z.infer<typeof RoomMember>;

export const RoomPing = z.object({
  id: z.string().uuid(),
  x: z.number(),
  y: z.number(),
  senderName: z.string().max(100),
  color: z.string().max(50),
  createdAt: z.number(),
});
export type RoomPing = z.infer<typeof RoomPing>;
