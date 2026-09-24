import { z } from 'zod';

export const POIReferenceLink = z.object({
  id: z.string().max(100),
  targetType: z.enum(['item', 'poi']),
  targetName: z.string().max(100),
});
export type POIReferenceLink = z.infer<typeof POIReferenceLink>;

export const POIOption = z.object({
  name: z.string().max(100),
  desc: z.string().max(2000),
  descriptions: z.array(z.string().max(2000)).max(50).optional(),
  isRevealed: z.boolean().optional(),
  referenceLinks: z.array(POIReferenceLink).max(50).optional(),
});
export type POIOption = z.infer<typeof POIOption>;

export const POICategory = z.object({
  title: z.string().max(100),
  color: z.string().max(50).optional(),
  icon: z.enum(['none', 'star', 'spiral', 'triangle']).optional(),
  isCollapsed: z.boolean().optional(),
  options: z.array(POIOption).max(100),
});
export type POICategory = z.infer<typeof POICategory>;

export const ZoneEvent = z.object({
  name: z.string().max(100),
  desc: z.string().max(2000),
  color: z.enum(['red', 'yellow', 'green', 'purple']),
});
export type ZoneEvent = z.infer<typeof ZoneEvent>;

export const ZoneHighlight = z.object({
  name: z.string().max(100),
  desc: z.string().max(2000),
  tags: z.string().max(200),
  color: z.enum(['red', 'yellow', 'green', 'purple', 'blue', 'gray']),
  isRevealed: z.boolean().optional(),
});
export type ZoneHighlight = z.infer<typeof ZoneHighlight>;

export const ZoneHighlightCategory = z.object({
  title: z.string().max(100),
  options: z.array(ZoneHighlight).max(100),
});
export type ZoneHighlightCategory = z.infer<typeof ZoneHighlightCategory>;

export const ZoneThreat = z.object({
  name: z.string().max(100),
  type: z.string().max(100),
  effect: z.string().max(2000),
  damage: z.string().max(100),
  damageType: z.string().max(100),
  isRevealed: z.boolean().optional(),
});
export type ZoneThreat = z.infer<typeof ZoneThreat>;

export const ZoneInventoryItem = z.object({
  name: z.string().max(100),
  type: z.string().max(100),
  weight: z.string().max(50),
  element: z.enum([
    'Sangue',
    'Morte',
    'Conhecimento',
    'Energia',
    'Medo',
    'Comum',
  ]),
  effect: z.string().max(2000),
  desc: z.string().max(2000),
  isFound: z.boolean().optional(),
});
export type ZoneInventoryItem = z.infer<typeof ZoneInventoryItem>;

export const ZoneJournalEntry = z.object({
  id: z.string().max(100),
  title: z.string().max(100),
  session: z.string().max(100),
  author: z.string().max(100),
  text: z.string().max(10000),
  isRevealed: z.boolean().optional(),
});
export type ZoneJournalEntry = z.infer<typeof ZoneJournalEntry>;

export const ZoneNpcNode = z.object({
  id: z.string().max(100),
  name: z.string().max(100),
  role: z.string().max(100),
  disposition: z.string().max(100),
  notes: z.string().max(5000),
  isRevealed: z.boolean().optional(),
});
export type ZoneNpcNode = z.infer<typeof ZoneNpcNode>;

export const ZoneQuestNode = z.object({
  id: z.string().max(100),
  title: z.string().max(100),
  priority: z.string().max(50),
  reward: z.string().max(500),
  objective: z.string().max(2000),
  isCompleted: z.boolean().optional(),
});
export type ZoneQuestNode = z.infer<typeof ZoneQuestNode>;

export const ZoneStyle = z.object({
  borderColor: z.string().max(50),
  fillColor: z.string().max(50),
  textColor: z.string().max(50),
});
export type ZoneStyle = z.infer<typeof ZoneStyle>;

export const ZoneData = z.object({
  title: z.string().max(100),
  desc: z.string().max(5000),
  visits: z.number().int().nonnegative(),
  imageRef: z.string().max(255).nullable().optional(),
  style: ZoneStyle.optional(),
  customPois: z.array(POICategory).max(100).optional(),
  customEvents: z.array(ZoneEvent).max(100).optional(),
  customHighlights: z.array(ZoneHighlightCategory).max(100).optional(),
  customThreats: z.array(ZoneThreat).max(100).optional(),
  customInventory: z.array(ZoneInventoryItem).max(100).optional(),
  customJournal: z.array(ZoneJournalEntry).max(100).optional(),
  customNpcs: z.array(ZoneNpcNode).max(100).optional(),
  customQuests: z.array(ZoneQuestNode).max(100).optional(),
  activeMarkers: z.array(z.string().max(100)).max(100).optional(),
  markerColors: z.record(z.string().max(100), z.string().max(50)).optional(),
  markerTextColors: z
    .record(z.string().max(100), z.string().max(50))
    .optional(),
});
export type ZoneData = z.infer<typeof ZoneData>;

export const Zone = z.object({
  id: z.string().uuid(),
  type: z.enum(['rect', 'ellipse', 'polygon']),
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
  rotation: z.number().optional(),
  scaleX: z.number().optional(),
  scaleY: z.number().optional(),
  clipPath: z.string().max(5000).optional(),
  points: z.array(z.number()).max(1000).optional(),
  data: ZoneData,
});
export type Zone = z.infer<typeof Zone>;
