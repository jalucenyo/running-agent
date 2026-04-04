import arg from 'arg';
import { z } from 'zod';
import type { GlobalFlags } from '../../types.js';
import { loadTokens } from '../../utils/auth.js';
import { createLogger } from '../../utils/logger.js';
import { stravaActivitySchema } from '../../schemas/strava-activity.js';

type Activity = z.infer<typeof stravaActivitySchema>;

function formatPace(minPerKm: number): string {
  const minutes = Math.floor(minPerKm);
  const seconds = Math.round((minPerKm - minutes) * 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

type MetricCol = {
  header: string;
  getValue: (a: Activity) => string;
};

const METRIC_COLS: MetricCol[] = [
  {
    header: 'HR avg',
    getValue: (a) =>
      a.average_heartrate !== undefined
        ? `${Math.round(a.average_heartrate)} bpm`
        : '—',
  },
  {
    header: 'HR max',
    getValue: (a) =>
      a.max_heartrate !== undefined
        ? `${Math.round(a.max_heartrate)} bpm`
        : '—',
  },
  {
    header: 'Elev (m)',
    getValue: (a) =>
      a.total_elevation_gain !== undefined
        ? `${Math.round(a.total_elevation_gain)}`
        : '—',
  },
  {
    header: 'Cad',
    getValue: (a) =>
      a.average_cadence !== undefined
        ? `${Math.round(a.average_cadence)} spm`
        : '—',
  },
  {
    header: 'Pwr avg',
    getValue: (a) =>
      a.average_watts !== undefined
        ? `${Math.round(a.average_watts)} W`
        : '—',
  },
  {
    header: 'Pace avg',
    getValue: (a) => {
      if (!a.distance || a.distance === 0) return '—';
      const minPerKm = a.moving_time / 60 / (a.distance / 1000);
      return `${formatPace(minPerKm)}/km`;
    },
  },
  {
    header: 'Pace max',
    getValue: (a) => {
      if (!a.max_speed || a.max_speed === 0) return '—';
      const minPerKm = 1000 / (a.max_speed * 60);
      return `${formatPace(minPerKm)}/km`;
    },
  },
];

function formatTable(activities: Activity[]): string {
  const metricData = activities.map((a) => METRIC_COLS.map((col) => col.getValue(a)));

  const visibleMetricIndices = METRIC_COLS.map((_, i) => i).filter((i) =>
    metricData.some((row) => row[i] !== '—'),
  );

  const baseHeaders = ['Name', 'Date', 'Distance (km)', 'Time (min)', 'Type'];
  const metricHeaders = visibleMetricIndices.map((i) => METRIC_COLS[i].header);
  const headers = [...baseHeaders, ...metricHeaders];

  const rows = activities.map((a, ai) => [
    a.name,
    a.start_date_local.slice(0, 10),
    (a.distance / 1000).toFixed(2),
    Math.round(a.moving_time / 60).toString(),
    a.sport_type,
    ...visibleMetricIndices.map((i) => metricData[ai][i]),
  ]);

  const allRows = [headers, ...rows];
  const widths = headers.map((_, i) =>
    Math.max(...allRows.map((r) => r[i].length)),
  );

  const separator = widths.map((w) => '-'.repeat(w)).join('-+-');
  const format = (row: string[]) =>
    row.map((cell, i) => cell.padEnd(widths[i])).join(' | ');

  return [format(headers), separator, ...rows.map(format)].join('\n');
}

export async function listActivities(
  flags: GlobalFlags,
  argv: string[],
): Promise<void> {
  const logger = createLogger(flags);
  const interactive = logger.mode === 'interactive';

  if (interactive) {
    logger.intro('Strava Activities');
  }

  const args = arg(
    {
      '--page': Number,
      '--per-page': Number,
    },
    { argv, permissive: true },
  );

  const page = args['--page'] ?? 1;
  const perPage = args['--per-page'] ?? 30;

  const tokens = await loadTokens();
  if (!tokens) {
    logger.error('No access token found. Run `strava login` first.');
    process.exitCode = 1;
    return;
  }

  const url = new URL('https://www.strava.com/api/v3/athlete/activities');
  url.searchParams.set('page', String(page));
  url.searchParams.set('per_page', String(perPage));

  const spinner = interactive ? logger.spinner() : null;
  spinner?.start('Cargando actividades…');

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (response.status === 401) {
    const msg = 'Session expired. Run `strava login` to authenticate again.';
    if (spinner) spinner.error(msg);
    else logger.error(msg);
    process.exitCode = 1;
    return;
  }

  if (!response.ok) {
    const msg = `API error: ${response.status} ${response.statusText}`;
    if (spinner) spinner.error(msg);
    else logger.error(msg);
    process.exitCode = 1;
    return;
  }

  const rawData: unknown = await response.json();
  const result = z.array(stravaActivitySchema).safeParse(rawData);

  if (!result.success) {
    const msg = 'Unexpected API response format.';
    if (spinner) spinner.error(msg);
    else logger.error(msg);
    process.exitCode = 1;
    return;
  }

  const activities = result.data;
  spinner?.stop(`${activities.length} actividades encontradas.`);

  if (activities.length === 0) {
    if (flags.json) {
      logger.json([]);
    } else {
      logger.info('No activities found.');
    }
    if (interactive) logger.outro('Done');
    return;
  }

  if (flags.json) {
    logger.json(activities);
  } else {
    console.log(formatTable(activities));
  }

  if (interactive) {
    logger.outro('Done');
  }
}

