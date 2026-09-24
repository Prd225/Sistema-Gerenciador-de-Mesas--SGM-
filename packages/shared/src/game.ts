import { z } from 'zod';

// --- Element & Damage Types ---

export const ElementTypeSchema = z.enum([
  'Sangue',
  'Morte',
  'Conhecimento',
  'Energia',
  'Medo',
]);
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
export type DamageType = z.infer<typeof DamageTypeSchema>;

export const ActionTypeSchema = z.enum([
  'Padrão',
  'Movimento',
  'Reação',
  'Ação Livre',
  'Completa',
]);
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
export type Token = z.infer<typeof TokenSchema>;

// --- Zone Types ---

export const POIReferenceLinkSchema = z.object({
  id: z.string(),
  targetType: z.enum(['item', 'poi']),
  targetName: z.string(),
});
export type POIReferenceLink = z.infer<typeof POIReferenceLinkSchema>;

export const POIOptionSchema = z.object({
  name: z.string(),
  desc: z.string(),
  descriptions: z.array(z.string()).optional(),
  isRevealed: z.boolean().optional(),
  referenceLinks: z.array(POIReferenceLinkSchema).optional(),
});
export type POIOption = z.infer<typeof POIOptionSchema>;

export const POICategorySchema = z.object({
  title: z.string(),
  color: z.string().optional(),
  icon: z.enum(['none', 'star', 'spiral', 'triangle']).optional(),
  isCollapsed: z.boolean().optional(),
  options: z.array(POIOptionSchema),
});
export type POICategory = z.infer<typeof POICategorySchema>;

export const ZoneEventSchema = z.object({
  name: z.string(),
  desc: z.string(),
  color: z.enum(['red', 'yellow', 'green', 'purple']),
});
export type ZoneEvent = z.infer<typeof ZoneEventSchema>;

export const ZoneHighlightSchema = z.object({
  name: z.string(),
  desc: z.string(),
  tags: z.string(),
  color: z.enum(['red', 'yellow', 'green', 'purple', 'blue', 'gray']),
  isRevealed: z.boolean().optional(),
});
export type ZoneHighlight = z.infer<typeof ZoneHighlightSchema>;

export const ZoneHighlightCategorySchema = z.object({
  title: z.string(),
  options: z.array(ZoneHighlightSchema),
});
export type ZoneHighlightCategory = z.infer<typeof ZoneHighlightCategorySchema>;

export const ZoneThreatSchema = z.object({
  name: z.string(),
  type: z.string(),
  effect: z.string(),
  damage: z.string(),
  damageType: z.string(),
  isRevealed: z.boolean().optional(),
});
export type ZoneThreat = z.infer<typeof ZoneThreatSchema>;

export const ZoneInventoryItemSchema = z.object({
  name: z.string(),
  type: z.string(),
  weight: z.string(),
  element: z.enum([
    'Sangue',
    'Morte',
    'Conhecimento',
    'Energia',
    'Medo',
    'Comum',
  ]),
  effect: z.string(),
  desc: z.string(),
  isFound: z.boolean().optional(),
});
export type ZoneInventoryItem = z.infer<typeof ZoneInventoryItemSchema>;

export const ZoneJournalEntrySchema = z.object({
  id: z.string(),
  title: z.string(),
  session: z.string(),
  author: z.string(),
  text: z.string(),
  isRevealed: z.boolean().optional(),
});
export type ZoneJournalEntry = z.infer<typeof ZoneJournalEntrySchema>;

export const ZoneNpcNodeSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  disposition: z.string(),
  notes: z.string(),
  isRevealed: z.boolean().optional(),
});
export type ZoneNpcNode = z.infer<typeof ZoneNpcNodeSchema>;

export const ZoneQuestNodeSchema = z.object({
  id: z.string(),
  title: z.string(),
  priority: z.string(),
  reward: z.string(),
  objective: z.string(),
  isCompleted: z.boolean().optional(),
});
export type ZoneQuestNode = z.infer<typeof ZoneQuestNodeSchema>;

export const ZoneDataSchema = z.object({
  title: z.string(),
  desc: z.string(),
  visits: z.number(),
  imageUrl: z.string().optional(),
  style: z
    .object({
      borderColor: z.string(),
      fillColor: z.string(),
      textColor: z.string(),
    })
    .optional(),
  customPois: z.array(POICategorySchema),
  customEvents: z.array(ZoneEventSchema),
  customHighlights: z.array(ZoneHighlightCategorySchema).optional(),
  customThreats: z.array(ZoneThreatSchema).optional(),
  customInventory: z.array(ZoneInventoryItemSchema).optional(),
  customJournal: z.array(ZoneJournalEntrySchema).optional(),
  customNpcs: z.array(ZoneNpcNodeSchema).optional(),
  customQuests: z.array(ZoneQuestNodeSchema).optional(),
  activeMarkers: z.array(z.string()).optional(),
  markerColors: z.record(z.string(), z.string()).optional(),
  markerTextColors: z.record(z.string(), z.string()).optional(),
});
export type ZoneData = z.infer<typeof ZoneDataSchema>;

export const ZoneSchema = z.object({
  id: z.string(),
  type: z.enum(['rect', 'ellipse', 'polygon']),
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
  rotation: z.number().optional(),
  scaleX: z.number().optional(),
  scaleY: z.number().optional(),
  clipPath: z.string().optional(),
  points: z.array(z.number()).optional(),
  data: ZoneDataSchema,
});
export type Zone = z.infer<typeof ZoneSchema>;

// --- Marker Types ---

export const MarkerIconTypeSchema = z.enum([
  'pin',
  'sword',
  'chest',
  'skull',
  'jewel',
]);
export type MarkerIconType = z.infer<typeof MarkerIconTypeSchema>;

export const MarkerSchema = z.object({
  id: z.string(),
  x: z.number(),
  y: z.number(),
  text: z.string(),
  description: z.string().optional(),
  color: z.string().optional(),
  textColor: z.string().optional(),
  iconType: MarkerIconTypeSchema.optional(),
  completed: z.boolean().optional(),
  hidden: z.boolean().optional(),
});
export type Marker = z.infer<typeof MarkerSchema>;

// --- Initiative Types ---

export const InitiativeSortModeSchema = z.enum([
  'descending',
  'ascending',
  'custom',
]);
export type InitiativeSortMode = z.infer<typeof InitiativeSortModeSchema>;

export const InitiativeItemSchema = z.object({
  tokenId: z.string(),
  value: z.number(),
});
export type InitiativeItem = z.infer<typeof InitiativeItemSchema>;

// --- Background Image Types ---

export const BgImageSchema = z.object({
  id: z.string(),
  src: z.string(),
  x: z.number(),
  y: z.number(),
  scale: z.number(),
  rotation: z.number(),
});
export type BgImage = z.infer<typeof BgImageSchema>;

// --- Tool Types ---

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
export type ActiveTool = z.infer<typeof ActiveToolSchema>;
export * from './domain';
