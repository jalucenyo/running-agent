import { writeFile, stat } from 'node:fs/promises';
import arg from 'arg';
import { select, isCancel } from '@clack/prompts';
import { z } from 'zod';
import type { GlobalFlags } from '../../types.js';
import { loadTokens } from '../../utils/auth.js';
import { createLogger } from '../../utils/logger.js';
import { mapSportType } from '../../utils/sport-type.js';
import { stravaActivitySchema } from '../../schemas/strava-activity.js';
import { stravaActivityDetailSchema } from '../../schemas/strava-activity-detail.js';
import {
  stravaStreamsResponseSchema,
  parseStreams,
} from '../../schemas/strava-streams.js';
import { FitEncoder } from '../../fit/encoder.js';
import { writeFitActivity, type FitActivityData, type RecordPoint } from '../../fit/messages.js';
import { FIT_EPOCH_S } from '../../fit/types.js';

const STREAMS_KEYS = 'time,latlng,heartrate,altitude,distance,cadence,watts';

function unixToFit(unixSecs: number): number {
  return unixSecs - FIT_EPOCH_S;
}

export async function exportActivity(
  flags: GlobalFlags,
  argv: string[],
): Promise<void> {
  const logger = createLogger(flags);
  logger.intro('Strava → FIT export');

  const args = arg(
    {
      '--id': Number,
      '--output': String,
      '--per-page': Number,
    },
    { argv, permissive: true },
  );

  const tokens = await loadTokens();
  if (!tokens) {
    logger.error('No access token found. Run `strava login` first.');
    process.exitCode = 1;
    return;
  }

  const authHeader = { Authorization: `Bearer ${tokens.access_token}` };

  // ── Select activity ────────────────────────────────────────────────────────
  let activityId: number;

  if (args['--id']) {
    activityId = args['--id'];
  } else {
    const perPage = args['--per-page'] ?? 30;
    const spinner = logger.spinner();
    spinner.start('Cargando actividades…');

    const listUrl = new URL('https://www.strava.com/api/v3/athlete/activities');
    listUrl.searchParams.set('page', '1');
    listUrl.searchParams.set('per_page', String(perPage));

    const listResp = await fetch(listUrl.toString(), { headers: authHeader });

    if (listResp.status === 401) {
      spinner.error('Sesión expirada. Ejecuta `strava login` de nuevo.');
      process.exitCode = 1;
      return;
    }
    if (!listResp.ok) {
      spinner.error(`API error: ${listResp.status} ${listResp.statusText}`);
      process.exitCode = 1;
      return;
    }

    const rawList: unknown = await listResp.json();
    const listResult = z.array(stravaActivitySchema).safeParse(rawList);
    if (!listResult.success) {
      spinner.error('Respuesta inesperada de la API al listar actividades.');
      process.exitCode = 1;
      return;
    }

    const activities = listResult.data;
    spinner.stop(`${activities.length} actividades encontradas.`);

    if (activities.length === 0) {
      logger.error('No se encontraron actividades.');
      process.exitCode = 1;
      return;
    }

    if (logger.mode !== 'interactive') {
      logger.error('Usa --id <activity_id> en modo no interactivo.');
      process.exitCode = 1;
      return;
    }

    const selected = await select({
      message: 'Elige la actividad a exportar',
      options: activities.map((a) => ({
        value: a.id,
        label: a.name,
        hint: `${a.start_date_local.slice(0, 10)} · ${a.sport_type} · ${(a.distance / 1000).toFixed(1)} km`,
      })),
    });

    if (isCancel(selected)) {
      logger.outro('Cancelado.');
      return;
    }

    activityId = selected as number;
  }

  // ── Fetch activity detail + streams ───────────────────────────────────────
  const spinner = logger.spinner();
  spinner.start(`Obteniendo datos de la actividad ${activityId}…`);

  const [detailResp, streamsResp] = await Promise.all([
    fetch(`https://www.strava.com/api/v3/activities/${activityId}`, {
      headers: authHeader,
    }),
    fetch(
      `https://www.strava.com/api/v3/activities/${activityId}/streams?keys=${STREAMS_KEYS}&key_type=time`,
      { headers: authHeader },
    ),
  ]);

  if (detailResp.status === 401 || streamsResp.status === 401) {
    spinner.error('Sesión expirada. Ejecuta `strava login` de nuevo.');
    process.exitCode = 1;
    return;
  }
  if (detailResp.status === 404) {
    spinner.error(`Actividad ${activityId} no encontrada.`);
    process.exitCode = 1;
    return;
  }
  if (!detailResp.ok || !streamsResp.ok) {
    spinner.error(
      `API error: detail=${detailResp.status} streams=${streamsResp.status}`,
    );
    process.exitCode = 1;
    return;
  }

  const [rawDetail, rawStreams] = await Promise.all([
    detailResp.json() as Promise<unknown>,
    streamsResp.json() as Promise<unknown>,
  ]);

  const detailResult = stravaActivityDetailSchema.safeParse(rawDetail);
  if (!detailResult.success) {
    spinner.error('Respuesta inesperada del endpoint de actividad.');
    process.exitCode = 1;
    return;
  }

  const streamsResult = stravaStreamsResponseSchema.safeParse(rawStreams);
  if (!streamsResult.success) {
    spinner.error('Respuesta inesperada del endpoint de streams.');
    process.exitCode = 1;
    return;
  }

  const activity = detailResult.data;
  const streams = parseStreams(streamsResult.data);

  if (!streams.time || streams.time.length === 0) {
    spinner.error('Sin datos de tiempo disponibles para exportar.');
    process.exitCode = 1;
    return;
  }

  spinner.stop('Datos obtenidos.');

  // ── Build FIT data ─────────────────────────────────────────────────────────
  const startUnix = Math.floor(
    new Date(activity.start_date).getTime() / 1000,
  );
  const startFit = unixToFit(startUnix);
  const endFit = startFit + activity.elapsed_time;
  const localTimestampFit = startFit + activity.utc_offset;

  const { sport, subSport } = mapSportType(activity.sport_type);

  const records: RecordPoint[] = streams.time.map((timeOffset, i) => ({
    timestamp: startFit + timeOffset,
    positionLat: streams.latlng?.[i]?.[0] ?? null,
    positionLong: streams.latlng?.[i]?.[1] ?? null,
    heartRate: streams.heartrate?.[i] ?? null,
    altitude: streams.altitude?.[i] ?? null,
    distance: streams.distance?.[i] ?? null,
    cadence: streams.cadence?.[i] ?? null,
    power: streams.watts?.[i] ?? null,
  }));

  const fitData: FitActivityData = {
    startTimeFit: startFit,
    endTimeFit: endFit,
    totalElapsedTime: activity.elapsed_time,
    totalTimerTime: activity.moving_time,
    totalDistance: activity.distance,
    sport,
    subSport,
    localTimestampFit,
    records,
  };

  // ── Encode FIT file ────────────────────────────────────────────────────────
  const encodeSpinner = logger.spinner();
  encodeSpinner.start('Generando archivo FIT…');

  const encoder = new FitEncoder();
  encoder.open();
  writeFitActivity(encoder, fitData);
  const fitBuffer = encoder.close();

  // ── Write to disk ──────────────────────────────────────────────────────────
  const outputPath = args['--output'] ?? `${activityId}.fit`;
  await writeFile(outputPath, fitBuffer);
  const { size } = await stat(outputPath);
  const sizeKb = (size / 1024).toFixed(1);

  encodeSpinner.stop(`Archivo generado: ${outputPath} (${sizeKb} KB)`);
  logger.outro('Exportación completada.');
}
