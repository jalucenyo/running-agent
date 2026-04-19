import { z } from 'zod';

export const stravaProfileSchema = z.object({
  age: z.number().int().min(10).max(100),
  sex: z.enum(['male', 'female']),
  weight: z.number().min(30).max(200),
  height: z.number().min(100).max(250),
});
