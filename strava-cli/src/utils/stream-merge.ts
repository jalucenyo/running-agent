import type { ParsedStreams } from '../schemas/strava-streams.js';
import type { RecordPoint } from '../fit/messages.js';
import { FIT_EPOCH_S } from '../fit/types.js';

/**
 * Linearly interpolate a numeric stream from one time base to another.
 * Values that are null in the source remain null in the output.
 */
export function interpolateStream(
  sourceTime: number[],
  sourceValues: (number | null)[],
  targetTime: number[],
): (number | null)[] {
  if (sourceTime.length === 0 || targetTime.length === 0) return [];

  return targetTime.map((t) => {
    // Before first source sample
    if (t <= sourceTime[0]) return sourceValues[0];
    // After last source sample
    if (t >= sourceTime[sourceTime.length - 1]) return sourceValues[sourceValues.length - 1];

    // Find surrounding source samples
    let lo = 0;
    let hi = sourceTime.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (sourceTime[mid] <= t) lo = mid;
      else hi = mid;
    }

    const vLo = sourceValues[lo];
    const vHi = sourceValues[hi];
    if (vLo === null || vHi === null) return null;

    const fraction = (t - sourceTime[lo]) / (sourceTime[hi] - sourceTime[lo]);
    return vLo + fraction * (vHi - vLo);
  });
}

/**
 * Linearly interpolate a latlng stream from one time base to another.
 */
export function interpolateLatLng(
  sourceTime: number[],
  sourceValues: [number, number][],
  targetTime: number[],
): [number, number][] {
  if (sourceTime.length === 0 || targetTime.length === 0) return [];

  return targetTime.map((t) => {
    if (t <= sourceTime[0]) return sourceValues[0];
    if (t >= sourceTime[sourceTime.length - 1]) return sourceValues[sourceValues.length - 1];

    let lo = 0;
    let hi = sourceTime.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (sourceTime[mid] <= t) lo = mid;
      else hi = mid;
    }

    const fraction = (t - sourceTime[lo]) / (sourceTime[hi] - sourceTime[lo]);
    const [latLo, lngLo] = sourceValues[lo];
    const [latHi, lngHi] = sourceValues[hi];
    return [
      latLo + fraction * (latHi - latLo),
      lngLo + fraction * (lngHi - lngLo),
    ];
  });
}

type StreamKey = keyof ParsedStreams;

/**
 * Pick a stream channel: return it directly if on the base activity,
 * or interpolate it to the base time array if from the other activity.
 */
function pickNumericStream(
  key: Exclude<StreamKey, 'time' | 'latlng'>,
  choice: 'A' | 'B',
  timeBase: 'A' | 'B',
  streamsA: ParsedStreams,
  streamsB: ParsedStreams,
  timeA: number[],
  timeB: number[],
  targetTime: number[],
): (number | null)[] | undefined {
  const src = choice === 'A' ? streamsA : streamsB;
  const values = src[key];
  if (!values) return undefined;

  if (choice === timeBase) return values;

  const srcTime = choice === 'A' ? timeA : timeB;
  return interpolateStream(srcTime, values, targetTime);
}

/**
 * Build merged RecordPoint[] from the selected stream channels,
 * interpolating streams that come from the non-base activity.
 */
export function buildMergedRecords(
  streamsA: ParsedStreams,
  streamsB: ParsedStreams,
  streamChoices: Partial<Record<StreamKey, 'A' | 'B'>>,
  timeBase: 'A' | 'B',
  startUnix: number,
): RecordPoint[] {
  const timeA = streamsA.time ?? [];
  const timeB = streamsB.time ?? [];
  const targetTime = timeBase === 'A' ? timeA : timeB;

  if (targetTime.length === 0) return [];

  const startFit = startUnix - FIT_EPOCH_S;

  // Resolve latlng
  let latlng: [number, number][] | undefined;
  const latlngChoice = streamChoices.latlng;
  if (latlngChoice) {
    const src = latlngChoice === 'A' ? streamsA : streamsB;
    if (src.latlng) {
      if (latlngChoice === timeBase) {
        latlng = src.latlng;
      } else {
        const srcTime = latlngChoice === 'A' ? timeA : timeB;
        latlng = interpolateLatLng(srcTime, src.latlng, targetTime);
      }
    }
  }

  // Resolve numeric streams
  const heartrate = pickNumericStream('heartrate', streamChoices.heartrate ?? timeBase, timeBase, streamsA, streamsB, timeA, timeB, targetTime);
  const altitude = pickNumericStream('altitude', streamChoices.altitude ?? timeBase, timeBase, streamsA, streamsB, timeA, timeB, targetTime);
  const distance = pickNumericStream('distance', streamChoices.distance ?? timeBase, timeBase, streamsA, streamsB, timeA, timeB, targetTime);
  const cadence = pickNumericStream('cadence', streamChoices.cadence ?? timeBase, timeBase, streamsA, streamsB, timeA, timeB, targetTime);
  const watts = pickNumericStream('watts', streamChoices.watts ?? timeBase, timeBase, streamsA, streamsB, timeA, timeB, targetTime);

  return targetTime.map((timeOffset, i) => ({
    timestamp: startFit + timeOffset,
    positionLat: latlng?.[i]?.[0] ?? null,
    positionLong: latlng?.[i]?.[1] ?? null,
    heartRate: heartrate?.[i] ?? null,
    altitude: altitude?.[i] ?? null,
    distance: distance?.[i] ?? null,
    cadence: cadence?.[i] ?? null,
    power: watts?.[i] ?? null,
  }));
}
