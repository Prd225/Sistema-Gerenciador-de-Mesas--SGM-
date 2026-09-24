import { z } from 'zod';

export const CampaignRoundTurnPayloadSchema = z.object({
  round: z.number(),
  turn: z.number(),
});
export const CampaignRoundTurnPayload = CampaignRoundTurnPayloadSchema;
export type CampaignRoundTurnPayload = z.infer<
  typeof CampaignRoundTurnPayloadSchema
>;

export const CampaignMetadataSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
  version: z.string().optional(),
});
export const CampaignMetadata = CampaignMetadataSchema;
export type CampaignMetadata = z.infer<typeof CampaignMetadataSchema>;

export const CampaignSlotSchema = z.object({
  slot: z.number(),
  name: z.string(),
  updatedAt: z.number(),
  data: z.any().optional(),
});
export const CampaignSlot = CampaignSlotSchema;
export type CampaignSlot = z.infer<typeof CampaignSlotSchema>;
