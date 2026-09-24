import { z } from 'zod';

export const ElementType = z.enum([
  'Sangue',
  'Morte',
  'Conhecimento',
  'Energia',
  'Medo',
]);
export type ElementType = z.infer<typeof ElementType>;

export const DamageType = z.enum([
  'Balístico',
  'Impacto',
  'Perfuração',
  'Corte',
  'Eletricidade',
  'Fogo',
  'Frio',
  'Mental',
  'Químico',
  'Sangue',
  'Morte',
  'Conhecimento',
  'Energia',
  'Medo',
]);
export type DamageType = z.infer<typeof DamageType>;

export const ActionType = z.enum([
  'Padrão',
  'Movimento',
  'Reação',
  'Ação Livre',
  'Completa',
]);
export type ActionType = z.infer<typeof ActionType>;

export const Condition = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(100),
  desc: z.string().max(1000),
  color: z.string().max(50),
  type: z
    .enum(['skip_turn', 'stat_modifier', 'out_of_combat', 'custom'])
    .optional(),
  durationTurns: z.number().int().nonnegative().optional(),
});
export type Condition = z.infer<typeof Condition>;

export const Resistance = z.object({
  type: z.string().max(100),
  val: z.number(),
});
export type Resistance = z.infer<typeof Resistance>;

export const Ability = z.object({
  title: z.string().max(100),
  desc: z.string().max(5000),
});
export type Ability = z.infer<typeof Ability>;

export const AttackAction = z.object({
  type: z.string().max(50),
  name: z.string().max(100),
  test: z.string().max(100),
  damage: z.string().max(100),
  mult: z.string().max(50),
  desc: z.string().max(5000),
});
export type AttackAction = z.infer<typeof AttackAction>;

export const TokenStats = z.object({
  type: z.enum(['player', 'threat']),
  system: z.enum(['san', 'det']),
  threatType: z.enum(['realidade', 'paranormal']).optional(),

  // Attributes
  agi: z.number(),
  for: z.number(),
  int: z.number(),
  pre: z.number(),
  vig: z.number(),

  // Defenses
  def: z.number(),
  bloq: z.union([z.number(), z.string().max(50)]),
  esq: z.union([z.number(), z.string().max(50)]),
  fort: z.string().max(50).optional(),
  von: z.string().max(50).optional(),

  // Vitals
  pv: z.number(),
  maxPv: z.number(),
  pe: z.number(),
  maxPe: z.number(),
  san: z.number(),
  maxSan: z.number(),
  pd: z.number(),
  maxPd: z.number(),

  // Threat-specific
  size: z.string().max(50).optional(),
  speed: z.string().max(50).optional(),
  elements: z.array(ElementType).max(10).optional(),
  presDt: z.number().optional(),
  presDano: z.string().max(50).optional(),
  presNex: z.number().optional(),
  enigma: z.string().max(5000).optional(),
  senses: z.array(z.string().max(100)).max(20).optional(),
  resistances: z.array(Resistance).max(50).optional(),
  vulnerabilities: z.array(z.string().max(100)).max(20).optional(),
  abilities: z.array(Ability).max(50).optional(),
  actions: z.array(AttackAction).max(50).optional(),
});
export type TokenStats = z.infer<typeof TokenStats>;

export const TokenVisibility = z.enum(['all', 'gm']);
export type TokenVisibility = z.infer<typeof TokenVisibility>;

export const Token = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  ownerMemberId: z.string().uuid().nullable(),
  visibility: TokenVisibility,
  imageRef: z.string().max(255).nullable(),
  x: z.number(),
  y: z.number(),
  size: z.number().positive(),
  hp: z.number(),
  maxHp: z.number(),
  fullName: z.string().max(100).optional(),
  colorText: z.string().max(50).optional(),
  colorBorder: z.string().max(50).optional(),
  colorFill: z.string().max(50).optional(),
  desc: z.string().max(5000).optional(),
  conditions: z.array(Condition).max(100).default([]),
  stats: TokenStats.optional(),
  rotation: z.number().optional(),
});
export type Token = z.infer<typeof Token>;

export const ActiveTool = z.enum([
  'pan',
  'select',
  'edit-zone',
  'draw-rect',
  'draw-ellipse',
  'draw-poly',
  'edit-bg',
  'add-marker',
]);
export type ActiveTool = z.infer<typeof ActiveTool>;
