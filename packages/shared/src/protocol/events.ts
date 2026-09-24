import { z } from 'zod';
import {
  RoomMemberSchema,
  RoomPing,
  RoomStateSchema,
  SyncStatePayload,
} from '../domain/member';
import {
  BgAddPayload,
  BgRemovePayload,
  BgUpdatePayload,
  CampaignRoundTurnPayload,
  InitiativeUpdatePayload,
  MapPingPayload,
  MarkerAddPayload,
  MarkerRemovePayload,
  MarkerUpdatePayload,
  RoomCreatePayload,
  RoomJoinPayload,
  TokenAddPayload,
  TokenMovePayload,
  TokenRemovePayload,
  TokenUpdatePayload,
  ZoneAddPayload,
  ZoneRemovePayload,
  ZoneUpdatePayload,
} from './commands';

export const RoomCreateResponseSchema = z.object({
  success: z.boolean(),
  code: z.string().optional(),
  error: z.string().optional(),
});
export const RoomCreateResponse = RoomCreateResponseSchema;
export type RoomCreateResponse = z.infer<typeof RoomCreateResponseSchema>;

export const RoomJoinResponseSchema = z.object({
  success: z.boolean(),
  state: RoomStateSchema.optional(),
  error: z.string().optional(),
});
export const RoomJoinResponse = RoomJoinResponseSchema;
export type RoomJoinResponse = z.infer<typeof RoomJoinResponseSchema>;

export const RoomMemberJoinedPayloadSchema = z.object({
  member: RoomMemberSchema,
});
export const RoomMemberJoinedPayload = RoomMemberJoinedPayloadSchema;
export type RoomMemberJoinedPayload = z.infer<
  typeof RoomMemberJoinedPayloadSchema
>;

export const RoomMemberLeftPayloadSchema = z.object({
  memberId: z.string(),
});
export const RoomMemberLeftPayload = RoomMemberLeftPayloadSchema;
export type RoomMemberLeftPayload = z.infer<typeof RoomMemberLeftPayloadSchema>;

export const RoomMembersUpdatedPayloadSchema = z.object({
  members: z.array(RoomMemberSchema),
});
export const RoomMembersUpdatedPayload = RoomMembersUpdatedPayloadSchema;
export type RoomMembersUpdatedPayload = z.infer<
  typeof RoomMembersUpdatedPayloadSchema
>;

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

