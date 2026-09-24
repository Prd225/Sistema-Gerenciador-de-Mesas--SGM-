import { z } from 'zod';

export const MarkerIconTypeSchema = z.enum([
  'pin',
  'sword',
  'chest',
  'skull',
  'jewel',
]);
export const MarkerIconType = MarkerIconTypeSchema;
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
export const Marker = MarkerSchema;
export type Marker = z.infer<typeof MarkerSchema>;
