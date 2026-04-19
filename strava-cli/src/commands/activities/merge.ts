import arg from 'arg';
import { select, isCancel, confirm, note, text } from '@clack/prompts';
import { z } from 'zod';
import type { GlobalFlags } from '../../types.js';
import { loadTokens } from '../../utils/auth.js';
import { createLogger } from '../../utils/logger.js';
import { stravaActivitySchema } from '../../schemas/strava-activity.js';
import {
  fetchActivityDetail,
  fetchActivityStreams,
  uploadFitFile,
  pollUploadStatus,
  updateActivity,
  deleteActivity,
  type StravaActivityDetail,
  type ParsedStreams,
} from '../../utils/strava-api.js';
import { buildMergedRecords } from '../../utils/stream-merge.js';
import { FitEncoder } from '../../fit/encoder.js';
import { writeFitActivity, type FitActivityData } from '../../fit/messages.js';
import { FIT_EPOCH_S } from '../../fit/types.js';
import { mapSportType } from '../../utils/sport-type.js';

const HELP = `
Usage: strava activities merge [options]

Merge two duplicate Strava activities into one.

Options:
  --per-page <n>  Number of recent activities to show (default: 30)
  --help          Show this help message
`.trim();

/** Offset applied to the base activity start timestamp to avoid Strava duplicate detection. */
const DUPLICATE_AVOIDANCE_OFFSET_S = 1;

// ── Field metadata ─────────────────────────────────────────────────────────

type MergeableField = keyof Pick<
  StravaActivityDetail,
  | 'name'
  | 'distance'
  | 'moving_time'
  | 'elapsed_time'
  | 'sport_type'
  | 'average_heartrate'
  | 'max_heartrate'
  | 'average_cadence'
  | 'average_watts'
  | 'max_watts'
  | 'average_speed'
  | 'max_speed'
  | 'total_elevation_gain'
  | 'calories'
>;

const MERGEABLE_FIELDS: { key: MergeableField; label: string; format: (v: number | string) => string }[] = [
  { key: 'name',                label: 'Nombre',             format: (v) => String(v) },
  { key: 'sport_type',          label: 'Tipo de deporte',    format: (v) => String(v) },
  { key: 'distance',            label: 'Distancia',          format: (v) => `${(Number(v) / 1000).toFixed(2)} km` },
  { key: 'elapsed_time',        label: 'Tiempo total',       format: (v) => formatSeconds(Number(v)) },
  { key: 'moving_time',         label: 'Tiempo en movimiento', format: (v) => formatSeconds(Number(v)) },
  { key: 'total_elevation_gain',label: 'Desnivel +',         format: (v) => `${Number(v).toFixed(0)} m` },
  { key: 'average_heartrate',   label: 'FC media',           format: (v) => `${Number(v).toFixed(0)} ppm` },
  { key: 'max_heartrate',       label: 'FC máxima',          format: (v) => `${Number(v).toFixed(0)} ppm` },
  { key: 'average_cadence',     label: 'Cadencia media',     format: (v) => `${Number(v).toFixed(0)} rpm` },
  { key: 'average_watts',       label: 'Potencia media',     format: (v) => `${Number(v).toFixed(0)} W` },
  { key: 'max_watts',           label: 'Potencia máxima',    format: (v) => `${Number(v).toFixed(0)} W` },
  { key: 'average_speed',       label: 'Velocidad media',    format: (v) => `${(Number(v) * 3.6).toFixed(1)} km/h` },
  { key: 'max_speed',           label: 'Velocidad máxima',   format: (v) => `${(Number(v) * 3.6).toFixed(1)} km/h` },
  { key: 'calories',            label: 'Calorías',           format: (v) => `${Number(v).toFixed(0)} kcal` },
];

type StreamKey = keyof ParsedStreams;
const STREAM_KEYS: StreamKey[] = ['time', 'latlng', 'heartrate', 'altitude', 'distance', 'cadence', 'watts'];
const STREAM_LABELS: Record<StreamKey, string> = {
  time: 'Tiempo',
  latlng: 'GPS',
  heartrate: 'Frecuencia cardíaca',
  altitude: 'Altitud',
  distance: 'Distancia',
  cadence: 'Cadencia',
  watts: 'Potencia',
};

// ── Helpers ────────────────────────────────────────────────────────────────

function formatSeconds(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return h > 0
    ? `${h}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`
    : `${m}m ${s.toString().padStart(2, '0')}s`;
}

function stripHtml(text: string): string {
  return text.replace(/<[^>]*>/g, '');
}

function formatUploadError(msg: string): string {
  if (msg.startsWith('UPLOAD_TIMEOUT:')) {
    const uploadId = msg.split(':')[1];
    return `Timeout esperando procesamiento. Upload ID: ${uploadId}`;
  }
  if (msg.startsWith('UPLOAD_PROCESSING_ERROR:')) {
    const raw = msg.slice('UPLOAD_PROCESSING_ERROR:'.length);
    const clean = stripHtml(raw);
    if (/duplicate of/i.test(clean)) {
      return `Actividad duplicada detectada: ${clean}\nElimina la actividad original antes de reintentar la fusión.`;
    }
    return `Error al procesar la actividad: ${clean}`;
  }
  return `Error: ${stripHtml(msg)}`;
}

// ── Main command ───────────────────────────────────────────────────────────

export async function mergeActivities(
  flags: GlobalFlags,
  argv: string[],
): Promise<void> {
  const logger = createLogger(flags);

  const args = arg(
    {
      '--per-page': Number,
    },
    { argv, permissive: true },
  );

  if (flags.help) {
    console.log(HELP);
    return;
  }

  logger.intro('Fusionar actividades de Strava');

  if (logger.mode !== 'interactive') {
    logger.error('El comando merge solo está disponible en modo interactivo.');
    process.exitCode = 1;
    return;
  }

  const tokens = await loadTokens();
  if (!tokens) {
    logger.error('No se encontró token de acceso. Ejecuta `strava login` primero.');
    process.exitCode = 1;
    return;
  }

  const authHeader = { Authorization: `Bearer ${tokens.access_token}` };
  const perPage = args['--per-page'] ?? 30;

  // ── 1. Load recent activities ────────────────────────────────────────────
  const spinner = logger.spinner();
  spinner.start('Cargando actividades recientes…');

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

  if (activities.length < 2) {
    logger.error('Se necesitan al menos 2 actividades para fusionar.');
    process.exitCode = 1;
    return;
  }

  // ── 2. Select two activities ─────────────────────────────────────────────
  const selectOptions = activities.map((a) => {
    const date = a.start_date_local.slice(0, 10);
    const time = a.start_date_local.slice(11, 16);
    const dist = `${(a.distance / 1000).toFixed(1)} km`;
    const sensors: string[] = [];
    if (a.has_heartrate) sensors.push('[HR]');
    if (a.average_watts !== undefined) sensors.push('[PWR]');
    const sensorStr = sensors.length > 0 ? `  ${sensors.join(' ')}` : '';
    return {
      value: a.id,
      label: a.name,
      hint: `${date} ${time} · ${a.sport_type} · ${dist}${sensorStr}`,
    };
  });

  const firstSelected = await select({
    message: 'Selecciona la primera actividad (base)',
    options: selectOptions,
  });
  if (isCancel(firstSelected)) { logger.outro('Cancelado.'); return; }
  const firstId = firstSelected as number;

  const secondSelected = await select({
    message: 'Selecciona la segunda actividad (a fusionar)',
    options: selectOptions.filter((o) => o.value !== firstId),
  });
  if (isCancel(secondSelected)) { logger.outro('Cancelado.'); return; }
  const secondId = secondSelected as number;

  // ── 3. Fetch detail + streams for both ──────────────────────────────────
  const spinner2 = logger.spinner();
  spinner2.start('Obteniendo datos completos de las dos actividades…');

  let detailA: StravaActivityDetail, detailB: StravaActivityDetail;
  let streamsA: ParsedStreams, streamsB: ParsedStreams;

  try {
    [detailA, detailB] = await Promise.all([
      fetchActivityDetail(firstId, tokens.access_token),
      fetchActivityDetail(secondId, tokens.access_token),
    ]);
    [streamsA, streamsB] = await Promise.all([
      fetchActivityStreams(firstId, tokens.access_token),
      fetchActivityStreams(secondId, tokens.access_token),
    ]);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg === 'UNAUTHORIZED') {
      spinner2.error('Sesión expirada. Ejecuta `strava login` de nuevo.');
    } else {
      spinner2.error(`Error al obtener datos: ${msg}`);
    }
    process.exitCode = 1;
    return;
  }

  spinner2.stop('Datos obtenidos correctamente.');

  // ── 4. Display comparison ────────────────────────────────────────────────
  const labelA = `[A] ${detailA.name}`;
  const labelB = `[B] ${detailB.name}`;

  const compLines: string[] = [
    `${'Campo'.padEnd(24)} ${'[A]'.padEnd(28)} [B]`,
    `${'-'.repeat(24)} ${'-'.repeat(28)} ${'-'.repeat(28)}`,
  ];

  for (const { key, label, format } of MERGEABLE_FIELDS) {
    const valA = detailA[key];
    const valB = detailB[key];
    if (valA === undefined && valB === undefined) continue;
    const strA = valA !== undefined ? format(valA as number | string) : '—';
    const strB = valB !== undefined ? format(valB as number | string) : '—';
    compLines.push(`${label.padEnd(24)} ${strA.padEnd(28)} ${strB}`);
  }

  note(compLines.join('\n'), 'Comparación de campos');

  const streamLines: string[] = [
    `${'Stream'.padEnd(24)} [A]    [B]`,
    `${'-'.repeat(24)} -----  -----`,
  ];
  for (const key of STREAM_KEYS) {
    const hasA = streamsA[key] !== undefined;
    const hasB = streamsB[key] !== undefined;
    if (!hasA && !hasB) continue;
    streamLines.push(`${STREAM_LABELS[key].padEnd(24)} ${hasA ? '  ✓  ' : '  —  '}  ${hasB ? '✓' : '—'}`);
  }
  note(streamLines.join('\n'), 'Disponibilidad de streams');

  // ── 5. Field selection ───────────────────────────────────────────────────
  const fieldChoices: Record<string, 'A' | 'B'> = {};
  let customName: string | undefined;

  // Name gets special treatment: offer a custom title option
  const nameChoice = await select<'A' | 'B' | 'custom'>({
    message: '¿Qué título usar para la actividad fusionada?',
    options: [
      { value: 'A', label: `[A] ${detailA.name}` },
      { value: 'B', label: `[B] ${detailB.name}` },
      { value: 'custom', label: 'Escribir un título personalizado' },
    ],
  });
  if (isCancel(nameChoice)) { logger.outro('Cancelado.'); return; }
  if (nameChoice === 'custom') {
    const entered = await text({ message: 'Escribe el nuevo título:' });
    if (isCancel(entered)) { logger.outro('Cancelado.'); return; }
    customName = entered;
    fieldChoices['name'] = 'A'; // placeholder — customName takes priority
  } else {
    fieldChoices['name'] = nameChoice as 'A' | 'B';
  }

  for (const { key, label, format } of MERGEABLE_FIELDS) {
    if (key === 'name') continue; // already handled above
    const valA = detailA[key];
    const valB = detailB[key];

    // Only present a choice when both have a value and they differ
    if (valA !== undefined && valB !== undefined && valA !== valB) {
      const choice = await select<'A' | 'B'>({
        message: `¿Qué valor usar para "${label}"?`,
        options: [
          { value: 'A', label: `[A] ${format(valA as number | string)}`, hint: detailA.name },
          { value: 'B', label: `[B] ${format(valB as number | string)}`, hint: detailB.name },
        ],
      });
      if (isCancel(choice)) { logger.outro('Cancelado.'); return; }
      fieldChoices[key] = choice as 'A' | 'B';
    } else {
      fieldChoices[key] = valA !== undefined ? 'A' : 'B';
    }
  }

  // ── 6. Stream channel selection ──────────────────────────────────────────
  const streamChoices: Partial<Record<StreamKey, 'A' | 'B'>> = {};

  for (const key of STREAM_KEYS) {
    if (key === 'time') continue; // time base is selected separately
    const hasA = streamsA[key] !== undefined;
    const hasB = streamsB[key] !== undefined;
    if (!hasA && !hasB) continue;

    if (hasA && hasB) {
      const choice = await select<'A' | 'B'>({
        message: `¿Qué fuente usar para el stream "${STREAM_LABELS[key]}"?`,
        options: [
          { value: 'A', label: `[A] ${detailA.name}` },
          { value: 'B', label: `[B] ${detailB.name}` },
        ],
      });
      if (isCancel(choice)) { logger.outro('Cancelado.'); return; }
      streamChoices[key] = choice as 'A' | 'B';
    } else {
      streamChoices[key] = hasA ? 'A' : 'B';
    }
  }

  // ── 6b. Time base selection ──────────────────────────────────────────────
  let timeBase: 'A' | 'B' = 'A';
  const hasTimeA = streamsA.time !== undefined;
  const hasTimeB = streamsB.time !== undefined;

  if (hasTimeA && hasTimeB) {
    const timeChoice = await select<'A' | 'B'>({
      message: '¿Qué actividad usar como base temporal para los streams?',
      options: [
        { value: 'A', label: `[A] ${detailA.name}`, hint: `${streamsA.time!.length} muestras` },
        { value: 'B', label: `[B] ${detailB.name}`, hint: `${streamsB.time!.length} muestras` },
      ],
    });
    if (isCancel(timeChoice)) { logger.outro('Cancelado.'); return; }
    timeBase = timeChoice as 'A' | 'B';
  } else if (hasTimeB && !hasTimeA) {
    timeBase = 'B';
  }

  // ── 7. Build provenance description ────────────────────────────────────
  const pick = <K extends MergeableField>(field: K): StravaActivityDetail[K] => {
    const src = fieldChoices[field] === 'B' ? detailB : detailA;
    return src[field];
  };

  const mergedName = customName ?? pick('name') as string;
  const mergedSportType = pick('sport_type') as string;
  const mergedElapsedTime = pick('elapsed_time') as number;
  const mergedMovingTime = pick('moving_time') as number;
  const mergedDistance = pick('distance') as number;

  const fieldOrigins: string[] = [];
  for (const { key, label } of MERGEABLE_FIELDS) {
    if (key === 'name') {
      fieldOrigins.push(`  ${label}: ${customName ? 'Personalizado' : fieldChoices[key] === 'B' ? labelB : labelA}`);
      continue;
    }
    const valA = detailA[key];
    const valB = detailB[key];
    if (valA === undefined && valB === undefined) continue;
    const src = fieldChoices[key] === 'B' ? 'B' : 'A';
    fieldOrigins.push(`  ${label}: ${src === 'A' ? labelA : labelB}`);
  }
  const streamOrigins: string[] = [];
  for (const key of STREAM_KEYS) {
    if (key === 'time') {
      streamOrigins.push(`  ${STREAM_LABELS[key]} (base): ${timeBase === 'A' ? labelA : labelB}`);
      continue;
    }
    const src = streamChoices[key];
    if (!src) continue;
    streamOrigins.push(`  ${STREAM_LABELS[key]}: ${src === 'A' ? labelA : labelB}`);
  }

  const mergeNote = [
    'Actividad generada por fusión de duplicados con strava-cli.',
    `Fuente A: ${detailA.name} (ID: ${detailA.id})`,
    `Fuente B: ${detailB.name} (ID: ${detailB.id})`,
    '',
    'Campos:',
    ...fieldOrigins,
    '',
    'Streams:',
    ...streamOrigins,
  ].join('\n');

  // ── 8. Confirmation summary ──────────────────────────────────────────────
  const baseDetail = timeBase === 'A' ? detailA : detailB;
  const baseStreams = timeBase === 'A' ? streamsA : streamsB;
  const numSamples = baseStreams.time?.length ?? 0;
  const summaryLines = [
    `Nombre:      ${mergedName}`,
    `Deporte:     ${mergedSportType}`,
    `Fecha:       ${detailA.start_date_local.slice(0, 10)}`,
    `Tiempo:      ${formatSeconds(mergedElapsedTime)}`,
    `Distancia:   ${(mergedDistance / 1000).toFixed(2)} km`,
    `Streams:     ${numSamples} muestras (base ${timeBase})`,
    '',
    'Método:      Subida de archivo FIT con streams combinados',
  ];
  note(summaryLines.join('\n'), 'Actividad fusionada');

  const confirmed = await confirm({
    message: '¿Crear esta actividad en Strava?',
  });
  if (isCancel(confirmed) || !confirmed) {
    logger.outro('Cancelado.');
    return;
  }

  // ── 9. Build FIT file ────────────────────────────────────────────────────
  const spinner3 = logger.spinner();
  spinner3.start('Generando archivo FIT con streams combinados…');

  const startUnix = Math.floor(new Date(baseDetail.start_date).getTime() / 1000) + DUPLICATE_AVOIDANCE_OFFSET_S;
  const startFit = startUnix - FIT_EPOCH_S;
  const endFit = startFit + mergedElapsedTime;
  const localTimestampFit = startFit + baseDetail.utc_offset;
  const { sport, subSport } = mapSportType(mergedSportType);

  const records = buildMergedRecords(
    streamsA,
    streamsB,
    streamChoices,
    timeBase,
    startUnix,
  );

  const fitData: FitActivityData = {
    startTimeFit: startFit,
    endTimeFit: endFit,
    totalElapsedTime: mergedElapsedTime,
    totalTimerTime: mergedMovingTime,
    totalDistance: mergedDistance,
    sport,
    subSport,
    localTimestampFit,
    records,
  };

  const encoder = new FitEncoder();
  encoder.open();
  writeFitActivity(encoder, fitData);
  const fitBuffer = encoder.close();

  spinner3.stop(`FIT generado: ${records.length} registros, ${(fitBuffer.length / 1024).toFixed(1)} KB`);

  // ── 10. Upload FIT + poll + update ────────────────────────────────────────
  const uploadSpinner = logger.spinner();
  uploadSpinner.start('Subiendo archivo FIT a Strava…');

  let createdId: number;
  try {
    const upload = await uploadFitFile(fitBuffer, mergedName, mergeNote, tokens.access_token);
    uploadSpinner.stop(`Subida iniciada (upload ID: ${upload.id}). Esperando procesamiento…`);

    const pollSpinner = logger.spinner();
    pollSpinner.start('Procesando actividad en Strava…');

    try {
      const status = await pollUploadStatus(upload.id, tokens.access_token);
      createdId = status.activity_id!;

      // Update name and description (upload may use FIT metadata)
      await updateActivity(createdId, { name: mergedName, description: mergeNote }, tokens.access_token);

      pollSpinner.stop(`Actividad creada: "${mergedName}" (ID: ${createdId})`);
    } catch (pollErr) {
      const pollMsg = pollErr instanceof Error ? pollErr.message : String(pollErr);
      pollSpinner.error(formatUploadError(pollMsg));
      process.exitCode = 1;
      return;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    uploadSpinner.error(formatUploadError(msg));
    process.exitCode = 1;
    return;
  }

  // ── 11. Optional deletion of originals ─────────────────────────────────
  const shouldDelete = await confirm({
    message: `¿Eliminar las actividades originales? (ID: ${firstId}, ID: ${secondId})`,
    initialValue: false,
  });

  if (!isCancel(shouldDelete) && shouldDelete) {
    const spinner6 = logger.spinner();
    spinner6.start('Eliminando actividades originales…');

    const results = await Promise.allSettled([
      deleteActivity(firstId, tokens.access_token),
      deleteActivity(secondId, tokens.access_token),
    ]);

    const errors: string[] = [];
    results.forEach((r, i) => {
      if (r.status === 'rejected') {
        const id = i === 0 ? firstId : secondId;
        errors.push(`ID ${id}: ${r.reason instanceof Error ? r.reason.message : String(r.reason)}`);
      }
    });

    if (errors.length > 0) {
      spinner6.error(`No se pudieron eliminar algunos originales:\n${errors.join('\n')}`);
      process.exitCode = 1;
      return;
    }

    spinner6.stop('Actividades originales eliminadas.');
  }

  logger.outro(`Fusión completada. Nueva actividad ID: ${createdId}`);
}
