import { z } from 'zod';
import {
  TokenSchema,
  InitiativeItemSchema,
  BgImageSchema,
  ZoneSchema,
  MarkerSchema,
} from './game';

// --- Room & Member Types ---

export const UserRoleSchema = z.enum(['gm', 'player']);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const RoomMemberSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: UserRoleSchema,
  color: z.string(),
  isOnline: z.boolean(),
});
export type RoomMember = z.infer<typeof RoomMemberSchema>;

export const RoomPingSchema = z.object({
  id: z.string(),
  x: z.number(),
  y: z.number(),
  senderName: z.string(),
  color: z.string(),
  createdAt: z.number(),
});
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
export type RoomState = z.infer<typeof RoomStateSchema>;

// --- Socket Event Payloads ---

// Room
export const RoomCreatePayloadSchema = z.object({
  hostName: z.string().min(1),
});
export type RoomCreatePayload = z.infer<typeof RoomCreatePayloadSchema>;

export const RoomCreateResponseSchema = z.object({
  success: z.boolean(),
  code: z.string().optional(),
  error: z.string().optional(),
});
export type RoomCreateResponse = z.infer<typeof RoomCreateResponseSchema>;

export const RoomJoinPayloadSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
});
export type RoomJoinPayload = z.infer<typeof RoomJoinPayloadSchema>;

export const RoomJoinResponseSchema = z.object({
  success: z.boolean(),
  state: RoomStateSchema.optional(),
  error: z.string().optional(),
});
export type RoomJoinResponse = z.infer<typeof RoomJoinResponseSchema>;

// Token
export const TokenMovePayloadSchema = z.object({
  tokenId: z.string(),
  x: z.number().nullable(),
  y: z.number().nullable(),
});
export type TokenMovePayload = z.infer<typeof TokenMovePayloadSchema>;

export const TokenUpdatePayloadSchema = z.object({
  tokenId: z.string(),
  updates: TokenSchema.partial(),
});
export type TokenUpdatePayload = z.infer<typeof TokenUpdatePayloadSchema>;

export const TokenAddPayloadSchema = z.object({
  token: TokenSchema,
});
export type TokenAddPayload = z.infer<typeof TokenAddPayloadSchema>;

export const TokenRemovePayloadSchema = z.object({
  tokenId: z.string(),
});
export type TokenRemovePayload = z.infer<typeof TokenRemovePayloadSchema>;

// Initiative
export const InitiativeUpdatePayloadSchema = z.object({
  queue: z.array(InitiativeItemSchema),
});
export type InitiativeUpdatePayload = z.infer<
  typeof InitiativeUpdatePayloadSchema
>;

// Campaign Round / Turn
export const CampaignRoundTurnPayloadSchema = z.object({
  round: z.number(),
  turn: z.number(),
});
export type CampaignRoundTurnPayload = z.infer<
  typeof CampaignRoundTurnPayloadSchema
>;

// Background Images
export const BgAddPayloadSchema = z.object({
  bg: BgImageSchema,
});
export type BgAddPayload = z.infer<typeof BgAddPayloadSchema>;

export const BgUpdatePayloadSchema = z.object({
  bgId: z.string(),
  updates: BgImageSchema.partial(),
});
export type BgUpdatePayload = z.infer<typeof BgUpdatePayloadSchema>;

export const BgRemovePayloadSchema = z.object({
  bgId: z.string(),
});
export type BgRemovePayload = z.infer<typeof BgRemovePayloadSchema>;

// Zones
export const ZoneAddPayloadSchema = z.object({
  zone: ZoneSchema,
});
export type ZoneAddPayload = z.infer<typeof ZoneAddPayloadSchema>;

export const ZoneUpdatePayloadSchema = z.object({
  zoneId: z.string(),
  updates: ZoneSchema.partial(),
});
export type ZoneUpdatePayload = z.infer<typeof ZoneUpdatePayloadSchema>;

export const ZoneRemovePayloadSchema = z.object({
  zoneId: z.string(),
});
export type ZoneRemovePayload = z.infer<typeof ZoneRemovePayloadSchema>;

// Markers
export const MarkerAddPayloadSchema = z.object({
  marker: MarkerSchema,
});
export type MarkerAddPayload = z.infer<typeof MarkerAddPayloadSchema>;

export const MarkerUpdatePayloadSchema = z.object({
  markerId: z.string(),
  updates: MarkerSchema.partial(),
});
export type MarkerUpdatePayload = z.infer<typeof MarkerUpdatePayloadSchema>;

export const MarkerRemovePayloadSchema = z.object({
  markerId: z.string(),
});
export type MarkerRemovePayload = z.infer<typeof MarkerRemovePayloadSchema>;

// Ping
export const MapPingPayloadSchema = z.object({
  x: z.number(),
  y: z.number(),
});
export type MapPingPayload = z.infer<typeof MapPingPayloadSchema>;

// Server to Client Members
export const RoomMemberJoinedPayloadSchema = z.object({
  member: RoomMemberSchema,
});
export type RoomMemberJoinedPayload = z.infer<
  typeof RoomMemberJoinedPayloadSchema
>;

export const RoomMemberLeftPayloadSchema = z.object({
  memberId: z.string(),
});
export type RoomMemberLeftPayload = z.infer<typeof RoomMemberLeftPayloadSchema>;

export const RoomMembersUpdatedPayloadSchema = z.object({
  members: z.array(RoomMemberSchema),
});
export type RoomMembersUpdatedPayload = z.infer<
  typeof RoomMembersUpdatedPayloadSchema
>;

// --- Socket Event Maps ---

export interface ClientToServerEvents {
  'room:create': (
    payload: RoomCreatePayload,
    callback: (res: RoomCreateResponse) => void,
  ) => void;
  'room:join': (
    payload: RoomJoinPayload,
    callback: (res: RoomJoinResponse) => void,
  ) => void;
  'room:leave': () => void;
  'room:sync-state': (payload: SyncStatePayload) => void;

  // Tokens
  'token:move': (payload: TokenMovePayload) => void;
  'token:update': (payload: TokenUpdatePayload) => void;
  'token:add': (payload: TokenAddPayload) => void;
  'token:remove': (payload: TokenRemovePayload) => void;

  // Initiative
  'initiative:update': (payload: InitiativeUpdatePayload) => void;

  // Campaign Round / Turn
  'campaign:update-round-turn': (payload: CampaignRoundTurnPayload) => void;

  // Background images
  'bg:add': (payload: BgAddPayload) => void;
  'bg:update': (payload: BgUpdatePayload) => void;
  'bg:remove': (payload: BgRemovePayload) => void;

  // Zones
  'zone:add': (payload: ZoneAddPayload) => void;
  'zone:update': (payload: ZoneUpdatePayload) => void;
  'zone:remove': (payload: ZoneRemovePayload) => void;

  // Markers
  'marker:add': (payload: MarkerAddPayload) => void;
  'marker:update': (payload: MarkerUpdatePayload) => void;
  'marker:remove': (payload: MarkerRemovePayload) => void;

  // Map ping
  'map:ping': (payload: MapPingPayload) => void;
}

export interface ServerToClientEvents {
  'room:member-joined': (payload: RoomMemberJoinedPayload) => void;
  'room:member-left': (payload: RoomMemberLeftPayload) => void;
  'room:members-updated': (payload: RoomMembersUpdatedPayload) => void;
  'room:state-synced': (payload: SyncStatePayload) => void;

  // Tokens
  'token:moved': (payload: TokenMovePayload) => void;
  'token:updated': (payload: TokenUpdatePayload) => void;
  'token:added': (payload: TokenAddPayload) => void;
  'token:removed': (payload: TokenRemovePayload) => void;

  // Initiative
  'initiative:updated': (payload: InitiativeUpdatePayload) => void;

  // Campaign Round / Turn
  'campaign:round-turn-updated': (payload: CampaignRoundTurnPayload) => void;

  // Background images
  'bg:added': (payload: BgAddPayload) => void;
  'bg:updated': (payload: BgUpdatePayload) => void;
  'bg:removed': (payload: BgRemovePayload) => void;

  // Zones
  'zone:added': (payload: ZoneAddPayload) => void;
  'zone:updated': (payload: ZoneUpdatePayload) => void;
  'zone:removed': (payload: ZoneRemovePayload) => void;

  // Markers
  'marker:added': (payload: MarkerAddPayload) => void;
  'marker:updated': (payload: MarkerUpdatePayload) => void;
  'marker:removed': (payload: MarkerRemovePayload) => void;

  // Map ping
  'map:pinged': (payload: RoomPing) => void;
}
export * from './protocol';
export * from './domain/member';
