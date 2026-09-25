import { z } from 'zod';

export const MarkerIconType = z.enum([
  'pin',
  'sword',
  'chest',
  'skull',
  'jewel',
]);
export type MarkerIconType = z.infer<typeof MarkerIconType>;

export const Marker = z.object({
  id: z.string().uuid(),
  x: z.number(),
  y: z.number(),
  text: z.string().max(100),
  description: z.string().max(2000).optional(),
  color: z.string().max(50).optional(),
  textColor: z.string().max(50).optional(),
  iconType: MarkerIconType.optional(),
  imageRef: z.string().max(255).nullable().optional(),
  completed: z.boolean().optional(),
  hidden: z.boolean().optional(),
  radius: z.number().optional(),
});
export type Marker = z.infer<typeof Marker>;
