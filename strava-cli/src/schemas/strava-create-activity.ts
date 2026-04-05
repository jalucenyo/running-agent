import { z } from 'zod';

export const createActivityRequestSchema = z.object({
  name: z.string(),
  sport_type: z.string(),
  start_date_local: z.string(),
  elapsed_time: z.number(),
  distance: z.number().optional(),
  description: z.string().optional(),
});

export const createActivityResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  sport_type: z.string(),
  start_date_local: z.string(),
  distance: z.number(),
  elapsed_time: z.number(),
});

export type CreateActivityRequest = z.infer<typeof createActivityRequestSchema>;
export type CreateActivityResponse = z.infer<typeof createActivityResponseSchema>;
