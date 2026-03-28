import type { GlobalFlags } from '../../types.js';
import { listActivities } from './list.js';

const HELP = `
Usage: strava activities <subcommand> [options]

Subcommands:
  list    List your recent Strava activities

Options:
  --help    Show this help message
`.trim();

export async function activitiesCommand(flags: GlobalFlags): Promise<void> {
  // Extract everything after "activities" from process.argv
  const argv = process.argv.slice(2);
  const activitiesIdx = argv.findIndex((a) => a === 'activities');
  const subArgv = activitiesIdx >= 0 ? argv.slice(activitiesIdx + 1) : [];

  const subcommand = subArgv.find((a) => !a.startsWith('-'));

  if (!subcommand || flags.help) {
    console.log(HELP);
    return;
  }

  if (subcommand === 'list') {
    await listActivities(flags, subArgv);
    return;
  }

  console.error(`Unknown activities subcommand: ${subcommand}\n`);
  console.log(HELP);
  process.exitCode = 1;
}
