import { z } from 'zod';
import { Token } from './token';
import { Zone } from './zone';
import { Marker } from './marker';
import { Background } from './background';
import { InitiativeState } from './initiative';

export const Scene = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  tokens: z.record(z.string().uuid(), Token),
  zones: z.record(z.string().uuid(), Zone),
  markers: z.record(z.string().uuid(), Marker),
  backgrounds: z.record(z.string().uuid(), Background),
  initiative: InitiativeState,
  gridSize: z.number().positive().optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
});
export type Scene = z.infer<typeof Scene>;
