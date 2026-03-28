import arg from 'arg';
import { z } from 'zod';
import type { GlobalFlags } from '../../types.js';
import { loadTokens } from '../../utils/auth.js';
import { stravaActivitySchema } from '../../schemas/strava-activity.js';

type Activity = z.infer<typeof stravaActivitySchema>;

function formatTable(activities: Activity[]): string {
  type Row = [string, string, string, string, string];

  const header: Row = ['Name', 'Date', 'Distance (km)', 'Time (min)', 'Type'];
  const rows: Row[] = activities.map((a) => [
    a.name,
    a.start_date_local.slice(0, 10),
    (a.distance / 1000).toFixed(2),
    Math.round(a.moving_time / 60).toString(),
    a.sport_type,
  ]);

  const allRows: Row[] = [header, ...rows];
  const widths = header.map((_, i) =>
    Math.max(...allRows.map((r) => r[i].length)),
  );

  const separator = widths.map((w) => '-'.repeat(w)).join('-+-');
  const format = (row: Row) =>
    row.map((cell, i) => cell.padEnd(widths[i])).join(' | ');

  return [format(header), separator, ...rows.map(format)].join('\n');
}

export async function listActivities(
  flags: GlobalFlags,
  argv: string[],
): Promise<void> {
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
    console.error('No access token found. Run `strava login` first.');
    process.exitCode = 1;
    return;
  }

  const url = new URL('https://www.strava.com/api/v3/athlete/activities');
  url.searchParams.set('page', String(page));
  url.searchParams.set('per_page', String(perPage));

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (response.status === 401) {
    console.error(
      'Session expired. Run `strava login` to authenticate again.',
    );
    process.exitCode = 1;
    return;
  }

  if (!response.ok) {
    console.error(`API error: ${response.status} ${response.statusText}`);
    process.exitCode = 1;
    return;
  }

  const rawData: unknown = await response.json();
  const result = z.array(stravaActivitySchema).safeParse(rawData);

  if (!result.success) {
    console.error('Unexpected API response format:');
    console.error(result.error.message);
    process.exitCode = 1;
    return;
  }

  const activities = result.data;

  if (activities.length === 0) {
    console.log('No activities found.');
    return;
  }

  console.log(formatTable(activities));
}
