import { z } from 'zod';

const timeStreamSchema = z.object({
  type: z.literal('time'),
  data: z.array(z.number()),
});

const latlngStreamSchema = z.object({
  type: z.literal('latlng'),
  data: z.array(z.tuple([z.number(), z.number()])),
});

const numericStreamSchema = z.object({
  type: z.enum(['heartrate', 'altitude', 'distance', 'cadence', 'watts']),
  data: z.array(z.number().nullable()),
});

// Fallback for unknown stream types returned by the API
const unknownStreamSchema = z.object({
  type: z.string(),
  data: z.array(z.unknown()),
});

export const stravaStreamsResponseSchema = z.array(
  z.union([
    timeStreamSchema,
    latlngStreamSchema,
    numericStreamSchema,
    unknownStreamSchema,
  ]),
);

export type StravaStreamsResponse = z.infer<typeof stravaStreamsResponseSchema>;

export interface ParsedStreams {
  time?: number[];
  latlng?: [number, number][];
  heartrate?: (number | null)[];
  altitude?: (number | null)[];
  distance?: (number | null)[];
  cadence?: (number | null)[];
  watts?: (number | null)[];
}

export function parseStreams(
  response: StravaStreamsResponse,
): ParsedStreams {
  const result: ParsedStreams = {};
  for (const stream of response) {
    switch (stream.type) {
      case 'time':
        result.time = stream.data as number[];
        break;
      case 'latlng':
        result.latlng = stream.data as [number, number][];
        break;
      case 'heartrate':
      case 'altitude':
      case 'distance':
      case 'cadence':
      case 'watts':
        result[stream.type] = stream.data as (number | null)[];
        break;
    }
  }
  return result;
}
