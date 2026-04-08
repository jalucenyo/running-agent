import { z } from 'zod';

export const stravaAthleteSchema = z.object({
  id: z.number(),
  firstname: z.string(),
  lastname: z.string(),
  username: z.string(),
});

export const stravaTokenResponseSchema = z.object({
  token_type: z.string(),
  expires_at: z.number(),
  expires_in: z.number(),
  refresh_token: z.string(),
  access_token: z.string(),
  athlete: stravaAthleteSchema,
});

export const stravaAuthConfigSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  expires_at: z.number(),
  athlete: stravaAthleteSchema,
});

export const stravaAppConfigSchema = z.object({
  client_id: z.string(),
  client_secret: z.string(),
});
