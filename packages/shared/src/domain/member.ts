import { z } from 'zod';
import { TokenSchema } from './token';
import { InitiativeItemSchema } from './initiative';
import { BgImageSchema } from './background';
import { ZoneSchema } from './zone';
import { MarkerSchema } from './marker';

export const UserRoleSchema = z.enum(['gm', 'player']);
export const UserRole = UserRoleSchema;
export type UserRole = z.infer<typeof UserRoleSchema>;

export const RoomMemberSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: UserRoleSchema,
  color: z.string(),
  isOnline: z.boolean(),
});
export const RoomMember = RoomMemberSchema;
export type RoomMember = z.infer<typeof RoomMemberSchema>;

export const RoomPingSchema = z.object({
  id: z.string(),
  x: z.number(),
  y: z.number(),
  senderName: z.string(),
  color: z.string(),
  createdAt: z.number(),
});
export const RoomPing = RoomPingSchema;
export type RoomPing = z.infer<typeof RoomPingSchema>;

export const SyncStatePayloadSchema = z.object({
  tokens: z.array(TokenSchema),
  initiativeQueue: z.array(InitiativeItemSchema),
  bgImages: z.array(BgImageSchema),
  zones: z.record(z.string(), ZoneSchema),
  markers: z.record(z.string(), MarkerSchema),
  round: z.number(),
  turn: z.number(),
});
export const SyncStatePayload = SyncStatePayloadSchema;
export type SyncStatePayload = z.infer<typeof SyncStatePayloadSchema>;

export const RoomStateSchema = z.object({
  code: z.string(),
  hostId: z.string(),
  members: z.array(RoomMemberSchema),
  tokens: z.array(TokenSchema),
  initiativeQueue: z.array(InitiativeItemSchema),
  bgImages: z.array(BgImageSchema),
  zones: z.record(z.string(), ZoneSchema),
  markers: z.record(z.string(), MarkerSchema),
  round: z.number(),
  turn: z.number(),
});
export const RoomState = RoomStateSchema;
export type RoomState = z.infer<typeof RoomStateSchema>;
