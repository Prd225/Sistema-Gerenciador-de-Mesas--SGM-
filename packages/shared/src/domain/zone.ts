import { z } from 'zod';

export const POIReferenceLinkSchema = z.object({
  id: z.string(),
  targetType: z.enum(['item', 'poi']),
  targetName: z.string(),
});
export const POIReferenceLink = POIReferenceLinkSchema;
export type POIReferenceLink = z.infer<typeof POIReferenceLinkSchema>;

export const POIOptionSchema = z.object({
  name: z.string(),
  desc: z.string(),
  descriptions: z.array(z.string()).optional(),
  isRevealed: z.boolean().optional(),
  referenceLinks: z.array(POIReferenceLinkSchema).optional(),
});
export const POIOption = POIOptionSchema;
export type POIOption = z.infer<typeof POIOptionSchema>;

export const POICategorySchema = z.object({
  title: z.string(),
  color: z.string().optional(),
  icon: z.enum(['none', 'star', 'spiral', 'triangle']).optional(),
  isCollapsed: z.boolean().optional(),
  options: z.array(POIOptionSchema),
});
export const POICategory = POICategorySchema;
export type POICategory = z.infer<typeof POICategorySchema>;

export const ZoneEventSchema = z.object({
  name: z.string(),
  desc: z.string(),
  color: z.enum(['red', 'yellow', 'green', 'purple']),
});
export const ZoneEvent = ZoneEventSchema;
export type ZoneEvent = z.infer<typeof ZoneEventSchema>;

export const ZoneHighlightSchema = z.object({
  name: z.string(),
  desc: z.string(),
  tags: z.string(),
  color: z.enum(['red', 'yellow', 'green', 'purple', 'blue', 'gray']),
  isRevealed: z.boolean().optional(),
});
export const ZoneHighlight = ZoneHighlightSchema;
export type ZoneHighlight = z.infer<typeof ZoneHighlightSchema>;

export const ZoneHighlightCategorySchema = z.object({
  title: z.string(),
  options: z.array(ZoneHighlightSchema),
});
export const ZoneHighlightCategory = ZoneHighlightCategorySchema;
export type ZoneHighlightCategory = z.infer<typeof ZoneHighlightCategorySchema>;

export const ZoneThreatSchema = z.object({
  name: z.string(),
  type: z.string(),
  effect: z.string(),
  damage: z.string(),
  damageType: z.string(),
  isRevealed: z.boolean().optional(),
});
export const ZoneThreat = ZoneThreatSchema;
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
export const ZoneInventoryItem = ZoneInventoryItemSchema;
export type ZoneInventoryItem = z.infer<typeof ZoneInventoryItemSchema>;

export const ZoneJournalEntrySchema = z.object({
  id: z.string(),
  title: z.string(),
  session: z.string(),
  author: z.string(),
  text: z.string(),
  isRevealed: z.boolean().optional(),
});
export const ZoneJournalEntry = ZoneJournalEntrySchema;
export type ZoneJournalEntry = z.infer<typeof ZoneJournalEntrySchema>;

export const ZoneNpcNodeSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  disposition: z.string(),
  notes: z.string(),
  isRevealed: z.boolean().optional(),
});
export const ZoneNpcNode = ZoneNpcNodeSchema;
export type ZoneNpcNode = z.infer<typeof ZoneNpcNodeSchema>;

export const ZoneQuestNodeSchema = z.object({
  id: z.string(),
  title: z.string(),
  priority: z.string(),
  reward: z.string(),
  objective: z.string(),
  isCompleted: z.boolean().optional(),
});
export const ZoneQuestNode = ZoneQuestNodeSchema;
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
export const ZoneData = ZoneDataSchema;
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
export const Zone = ZoneSchema;
export type Zone = z.infer<typeof ZoneSchema>;

