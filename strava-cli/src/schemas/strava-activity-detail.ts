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
});

export type StravaActivityDetail = z.infer<typeof stravaActivityDetailSchema>;
