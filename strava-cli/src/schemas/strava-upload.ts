import { z } from 'zod';

export const stravaUploadResponseSchema = z.object({
  id: z.number(),
  id_str: z.string(),
  external_id: z.string().nullable().optional(),
  error: z.string().nullable().optional(),
  status: z.string(),
  activity_id: z.number().nullable().optional(),
});

export type StravaUploadResponse = z.infer<typeof stravaUploadResponseSchema>;

export const stravaUploadStatusSchema = z.object({
  id: z.number(),
  id_str: z.string(),
  external_id: z.string().nullable().optional(),
  error: z.string().nullable().optional(),
  status: z.string(),
  activity_id: z.number().nullable().optional(),
});

export type StravaUploadStatus = z.infer<typeof stravaUploadStatusSchema>;
