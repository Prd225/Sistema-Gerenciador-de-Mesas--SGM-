import { z } from 'zod';

export const BgImageSchema = z.object({
  id: z.string(),
  src: z.string(),
  x: z.number(),
  y: z.number(),
  scale: z.number(),
  rotation: z.number(),
});
export const BgImage = BgImageSchema;
export type BgImage = z.infer<typeof BgImageSchema>;

