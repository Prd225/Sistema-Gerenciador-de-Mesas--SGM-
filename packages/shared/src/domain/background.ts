import { z } from 'zod';

export const Background = z.object({
  id: z.string().uuid(),
  imageRef: z.string().min(1).max(255),
  x: z.number(),
  y: z.number(),
  scale: z.number(),
  rotation: z.number(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  opacity: z.number().min(0).max(1).optional(),
});
export type Background = z.infer<typeof Background>;
