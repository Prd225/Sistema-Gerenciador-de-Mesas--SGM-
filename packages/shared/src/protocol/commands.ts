import { z } from 'zod';
import {
  TokenSchema,
  InitiativeItemSchema,
  BgImageSchema,
  ZoneSchema,
  MarkerSchema,
} from '../domain';
export {
  CampaignRoundTurnPayloadSchema,
  CampaignRoundTurnPayload,
} from '../domain/campaign';

// Room Commands
export const RoomCreatePayloadSchema = z.object({
  hostName: z.string().min(1),
});
export const RoomCreatePayload = RoomCreatePayloadSchema;
export type RoomCreatePayload = z.infer<typeof RoomCreatePayloadSchema>;

export const RoomJoinPayloadSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
});
export const RoomJoinPayload = RoomJoinPayloadSchema;
export type RoomJoinPayload = z.infer<typeof RoomJoinPayloadSchema>;

// Token Commands
export const TokenMovePayloadSchema = z.object({
  tokenId: z.string(),
  x: z.number().nullable(),
  y: z.number().nullable(),
});
export const TokenMovePayload = TokenMovePayloadSchema;
export type TokenMovePayload = z.infer<typeof TokenMovePayloadSchema>;

export const TokenUpdatePayloadSchema = z.object({
  tokenId: z.string(),
  updates: TokenSchema.partial(),
});
export const TokenUpdatePayload = TokenUpdatePayloadSchema;
export type TokenUpdatePayload = z.infer<typeof TokenUpdatePayloadSchema>;

export const TokenAddPayloadSchema = z.object({
  token: TokenSchema,
});
export const TokenAddPayload = TokenAddPayloadSchema;
export type TokenAddPayload = z.infer<typeof TokenAddPayloadSchema>;

export const TokenRemovePayloadSchema = z.object({
  tokenId: z.string(),
});
export const TokenRemovePayload = TokenRemovePayloadSchema;
export type TokenRemovePayload = z.infer<typeof TokenRemovePayloadSchema>;

// Initiative Commands
export const InitiativeUpdatePayloadSchema = z.object({
  queue: z.array(InitiativeItemSchema),
});
export const InitiativeUpdatePayload = InitiativeUpdatePayloadSchema;
export type InitiativeUpdatePayload = z.infer<
  typeof InitiativeUpdatePayloadSchema
>;

// Background Commands
export const BgAddPayloadSchema = z.object({
  bg: BgImageSchema,
});
export const BgAddPayload = BgAddPayloadSchema;
export type BgAddPayload = z.infer<typeof BgAddPayloadSchema>;

export const BgUpdatePayloadSchema = z.object({
  bgId: z.string(),
  updates: BgImageSchema.partial(),
});
export const BgUpdatePayload = BgUpdatePayloadSchema;
export type BgUpdatePayload = z.infer<typeof BgUpdatePayloadSchema>;

export const BgRemovePayloadSchema = z.object({
  bgId: z.string(),
});
export const BgRemovePayload = BgRemovePayloadSchema;
export type BgRemovePayload = z.infer<typeof BgRemovePayloadSchema>;

// Zone Commands
export const ZoneAddPayloadSchema = z.object({
  zone: ZoneSchema,
});
export const ZoneAddPayload = ZoneAddPayloadSchema;
export type ZoneAddPayload = z.infer<typeof ZoneAddPayloadSchema>;

export const ZoneUpdatePayloadSchema = z.object({
  zoneId: z.string(),
  updates: ZoneSchema.partial(),
});
export const ZoneUpdatePayload = ZoneUpdatePayloadSchema;
export type ZoneUpdatePayload = z.infer<typeof ZoneUpdatePayloadSchema>;

export const ZoneRemovePayloadSchema = z.object({
  zoneId: z.string(),
});
export const ZoneRemovePayload = ZoneRemovePayloadSchema;
export type ZoneRemovePayload = z.infer<typeof ZoneRemovePayloadSchema>;

// Marker Commands
export const MarkerAddPayloadSchema = z.object({
  marker: MarkerSchema,
});
export const MarkerAddPayload = MarkerAddPayloadSchema;
export type MarkerAddPayload = z.infer<typeof MarkerAddPayloadSchema>;

export const MarkerUpdatePayloadSchema = z.object({
  markerId: z.string(),
  updates: MarkerSchema.partial(),
});
export const MarkerUpdatePayload = MarkerUpdatePayloadSchema;
export type MarkerUpdatePayload = z.infer<typeof MarkerUpdatePayloadSchema>;

export const MarkerRemovePayloadSchema = z.object({
  markerId: z.string(),
});
export const MarkerRemovePayload = MarkerRemovePayloadSchema;
export type MarkerRemovePayload = z.infer<typeof MarkerRemovePayloadSchema>;

// Ping Command
export const MapPingPayloadSchema = z.object({
  x: z.number(),
  y: z.number(),
});
export const MapPingPayload = MapPingPayloadSchema;
export type MapPingPayload = z.infer<typeof MapPingPayloadSchema>;
