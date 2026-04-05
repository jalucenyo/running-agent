import { z } from 'zod';

export const stravaActivityDetailSchema = z.object({
  id: z.number(),
  name: z.string(),
  distance: z.number(),
  moving_time: z.number(),
  elapsed_time: z.number(),
  sport_type: z.string(),
  start_date: z.string(),       // UTC ISO 8601
  start_date_local: z.string(), // local ISO 8601
  utc_offset: z.number(),       // seconds offset from UTC
  average_heartrate: z.number().optional(),
  max_heartrate: z.number().optional(),
  average_cadence: z.number().optional(),
  average_watts: z.number().optional(),
  max_watts: z.number().optional(),
  average_speed: z.number().optional(),
  max_speed: z.number().optional(),
  total_elevation_gain: z.number().optional(),
  calories: z.number().optional(),
});

export type StravaActivityDetail = z.infer<typeof stravaActivityDetailSchema>;
