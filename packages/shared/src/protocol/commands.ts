import { z } from 'zod';
import { Token, TokenStats } from '../domain/token';
import { Zone } from '../domain/zone';
import { Marker } from '../domain/marker';
import { Background } from '../domain/background';
import { Scene } from '../domain/scene';
import { InitiativeState } from '../domain/initiative';

// --- Token Commands ---

export const TokenCreatePayload = z.object({
  sceneId: z.string().uuid().optional(),
  token: Token,
});
export type TokenCreatePayload = z.infer<typeof TokenCreatePayload>;

export const TokenMovePayload = z.object({
  sceneId: z.string().uuid().optional(),
  tokenId: z.string().uuid(),
  // null = recolher para a reserva
  x: z.number().nullable(),
  y: z.number().nullable(),
});
export type TokenMovePayload = z.infer<typeof TokenMovePayload>;

export const TokenUpdatePayload = z.object({
  sceneId: z.string().uuid().optional(),
  tokenId: z.string().uuid(),
  // stats parcial: mesclado campo a campo no token (ex.: jogador envia so pv).
  updates: Token.partial().extend({ stats: TokenStats.partial().optional() }),
});
export type TokenUpdatePayload = z.infer<typeof TokenUpdatePayload>;

export const TokenDeletePayload = z.object({
  sceneId: z.string().uuid().optional(),
  tokenId: z.string().uuid(),
});
export type TokenDeletePayload = z.infer<typeof TokenDeletePayload>;

// --- Zone Commands ---

export const ZoneCreatePayload = z.object({
  sceneId: z.string().uuid().optional(),
  zone: Zone,
});
export type ZoneCreatePayload = z.infer<typeof ZoneCreatePayload>;

export const ZoneUpdatePayload = z.object({
  sceneId: z.string().uuid().optional(),
  zoneId: z.string().uuid(),
  updates: Zone.partial(),
});
export type ZoneUpdatePayload = z.infer<typeof ZoneUpdatePayload>;

export const ZoneDeletePayload = z.object({
  sceneId: z.string().uuid().optional(),
  zoneId: z.string().uuid(),
});
export type ZoneDeletePayload = z.infer<typeof ZoneDeletePayload>;

// --- Marker Commands ---

export const MarkerCreatePayload = z.object({
  sceneId: z.string().uuid().optional(),
  marker: Marker,
});
export type MarkerCreatePayload = z.infer<typeof MarkerCreatePayload>;

export const MarkerUpdatePayload = z.object({
  sceneId: z.string().uuid().optional(),
  markerId: z.string().uuid(),
  updates: Marker.partial(),
});
export type MarkerUpdatePayload = z.infer<typeof MarkerUpdatePayload>;

export const MarkerDeletePayload = z.object({
  sceneId: z.string().uuid().optional(),
  markerId: z.string().uuid(),
});
export type MarkerDeletePayload = z.infer<typeof MarkerDeletePayload>;

// --- Background Commands ---

export const BackgroundCreatePayload = z.object({
  sceneId: z.string().uuid().optional(),
  background: Background,
});
export type BackgroundCreatePayload = z.infer<typeof BackgroundCreatePayload>;

export const BackgroundUpdatePayload = z.object({
  sceneId: z.string().uuid().optional(),
  backgroundId: z.string().uuid(),
  updates: Background.partial(),
});
export type BackgroundUpdatePayload = z.infer<typeof BackgroundUpdatePayload>;

export const BackgroundDeletePayload = z.object({
  sceneId: z.string().uuid().optional(),
  backgroundId: z.string().uuid(),
});
export type BackgroundDeletePayload = z.infer<typeof BackgroundDeletePayload>;

// --- Scene Commands ---

export const SceneCreatePayload = z.object({
  scene: Scene,
});
export type SceneCreatePayload = z.infer<typeof SceneCreatePayload>;

export const SceneUpdatePayload = z.object({
  sceneId: z.string().uuid(),
  updates: Scene.partial(),
});
export type SceneUpdatePayload = z.infer<typeof SceneUpdatePayload>;

export const SceneDeletePayload = z.object({
  sceneId: z.string().uuid(),
});
export type SceneDeletePayload = z.infer<typeof SceneDeletePayload>;

export const SceneActivatePayload = z.object({
  sceneId: z.string().uuid(),
});
export type SceneActivatePayload = z.infer<typeof SceneActivatePayload>;

// --- Initiative Commands ---

export const InitiativeUpdatePayload = z.object({
  sceneId: z.string().uuid().optional(),
  initiative: InitiativeState,
});
export type InitiativeUpdatePayload = z.infer<typeof InitiativeUpdatePayload>;

// --- Round & Turn Commands ---

export const RoundNextPayload = z.object({
  round: z.number().int().nonnegative().optional(),
});
export type RoundNextPayload = z.infer<typeof RoundNextPayload>;

export const TurnNextPayload = z.object({
  turn: z.number().int().nonnegative().optional(),
});
export type TurnNextPayload = z.infer<typeof TurnNextPayload>;

// --- Ping Command ---

export const PingPayload = z.object({
  x: z.number(),
  y: z.number(),
});
export type PingPayload = z.infer<typeof PingPayload>;

// --- Command Types & Registry ---

export const CommandType = z.enum([
  'token.create',
  'token.move',
  'token.update',
  'token.delete',
  'zone.create',
  'zone.update',
  'zone.delete',
  'marker.create',
  'marker.update',
  'marker.delete',
  'background.create',
  'background.update',
  'background.delete',
  'scene.create',
  'scene.update',
  'scene.delete',
  'scene.activate',
  'initiative.update',
  'round.next',
  'turn.next',
  'ping',
]);
export type CommandType = z.infer<typeof CommandType>;

export const ClientCommand = z.object({
  id: z.string().uuid(),
  type: CommandType,
  payload: z.unknown(),
});
export type ClientCommand = z.infer<typeof ClientCommand>;

const cmd = <T extends string, P extends z.ZodType>(type: T, payload: P) =>
  z.object({ type: z.literal(type), payload });

// Comando com payload tipado pelo `type`. Usado pelo engine.
export const Command = z.discriminatedUnion('type', [
  cmd('token.create', TokenCreatePayload),
  cmd('token.move', TokenMovePayload),
  cmd('token.update', TokenUpdatePayload),
  cmd('token.delete', TokenDeletePayload),
  cmd('zone.create', ZoneCreatePayload),
  cmd('zone.update', ZoneUpdatePayload),
  cmd('zone.delete', ZoneDeletePayload),
  cmd('marker.create', MarkerCreatePayload),
  cmd('marker.update', MarkerUpdatePayload),
  cmd('marker.delete', MarkerDeletePayload),
  cmd('background.create', BackgroundCreatePayload),
  cmd('background.update', BackgroundUpdatePayload),
  cmd('background.delete', BackgroundDeletePayload),
  cmd('scene.create', SceneCreatePayload),
  cmd('scene.update', SceneUpdatePayload),
  cmd('scene.delete', SceneDeletePayload),
  cmd('scene.activate', SceneActivatePayload),
  cmd('initiative.update', InitiativeUpdatePayload),
  cmd('round.next', RoundNextPayload),
  cmd('turn.next', TurnNextPayload),
  cmd('ping', PingPayload),
]);
export type Command = z.infer<typeof Command>;
