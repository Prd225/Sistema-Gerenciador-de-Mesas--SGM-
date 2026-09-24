import { z } from 'zod';

// --- Element & Damage Types ---

export const ElementTypeSchema = z.enum([
  'Sangue',
  'Morte',
  'Conhecimento',
  'Energia',
  'Medo',
]);
export const ElementType = ElementTypeSchema;
export type ElementType = z.infer<typeof ElementTypeSchema>;

export const DamageTypeSchema = z.enum([
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
export const DamageType = DamageTypeSchema;
export type DamageType = z.infer<typeof DamageTypeSchema>;

export const ActionTypeSchema = z.enum([
  'Padrão',
  'Movimento',
  'Reação',
  'Ação Livre',
  'Completa',
]);
export const ActionType = ActionTypeSchema;
export type ActionType = z.infer<typeof ActionTypeSchema>;

// --- Token & Stats Types ---

export const TokenStatsSchema = z.object({
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
  bloq: z.union([z.number(), z.string()]),
  esq: z.union([z.number(), z.string()]),
  fort: z.string().optional(),
  von: z.string().optional(),

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
  size: z.string().optional(),
  speed: z.string().optional(),
  elements: z.array(ElementTypeSchema).optional(),
  presDt: z.number().optional(),
  presDano: z.string().optional(),
  presNex: z.number().optional(),
  enigma: z.string().optional(),
  senses: z.array(z.string()).optional(),
  resistances: z
    .array(z.object({ type: z.string(), val: z.number() }))
    .optional(),
  vulnerabilities: z.array(z.string()).optional(),
  abilities: z
    .array(z.object({ title: z.string(), desc: z.string() }))
    .optional(),
  actions: z
    .array(
      z.object({
        type: z.string(),
        name: z.string(),
        test: z.string(),
        damage: z.string(),
        mult: z.string(),
        desc: z.string(),
      }),
    )
    .optional(),
});
export const TokenStats = TokenStatsSchema;
export type TokenStats = z.infer<typeof TokenStatsSchema>;

export const ConditionSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  desc: z.string(),
  color: z.string(),
  type: z
    .enum(['skip_turn', 'stat_modifier', 'out_of_combat', 'custom'])
    .optional(),
  durationTurns: z.number().optional(),
});
export const Condition = ConditionSchema;
export type Condition = z.infer<typeof ConditionSchema>;

export const TokenSchema = z.object({
  id: z.string(),
  name: z.string(),
  fullName: z.string(),
  colorText: z.string(),
  colorBorder: z.string(),
  colorFill: z.string(),
  x: z.number().nullable(),
  y: z.number().nullable(),
  imageUrl: z.string().optional(),
  desc: z.string(),
  conditions: z.array(ConditionSchema),
  stats: TokenStatsSchema,
  ownerMemberId: z.string().nullable().optional(),
  visibility: z.enum(['all', 'gm']).optional(),
});
export const Token = TokenSchema;
export type Token = z.infer<typeof TokenSchema>;

export const ActiveToolSchema = z.enum([
  'pan',
  'select',
  'edit-zone',
  'draw-rect',
  'draw-ellipse',
  'draw-poly',
  'edit-bg',
  'add-marker',
]);
export const ActiveTool = ActiveToolSchema;
export type ActiveTool = z.infer<typeof ActiveToolSchema>;

