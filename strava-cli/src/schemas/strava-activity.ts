import { z } from 'zod';

export const stravaActivitySchema = z.object({
  id: z.number(),
  name: z.string(),
  distance: z.number(),
  moving_time: z.number(),
  sport_type: z.string(),
  start_date_local: z.string(),
  average_heartrate: z.number().optional(),
  max_heartrate: z.number().optional(),
  has_heartrate: z.boolean().optional(),
  total_elevation_gain: z.number().optional(),
  elev_high: z.number().optional(),
  elev_low: z.number().optional(),
  average_cadence: z.number().optional(),
  average_watts: z.number().optional(),
  max_watts: z.number().optional(),
  weighted_average_watts: z.number().optional(),
  average_speed: z.number().optional(),
  max_speed: z.number().optional(),
  calories: z.number().optional(),
  suffer_score: z.number().optional(),
});

export type StravaActivity = z.infer<typeof stravaActivitySchema>;
