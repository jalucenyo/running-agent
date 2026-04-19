import arg from 'arg';
import type { GlobalFlags } from './types.js';
import { testCommand } from './commands/test.js';
import { loginCommand } from './commands/login.js';
import { activitiesCommand } from './commands/activities/index.js';
import { agentCommand } from './commands/agent/index.js';
import { profileCommand } from './commands/profile.js';

const HELP = `
Usage: strava [options] <command>

Commands:
  login        Authenticate with Strava via OAuth 2.0
  activities   Manage and list Strava activities
  profile      Show or set your athlete profile
  agent        Install AI skills for supported orchestrators
  test         Run a logger test to verify output modes

Options:
  --help      Show this help message
  --version   Show version
  --json      Output as JSON (machine mode)
  --raw       Output plain text (machine mode)
  --tui       Force interactive mode even when piped
`.trim();

const commands: Record<string, (flags: GlobalFlags) => Promise<void>> = {
  login: loginCommand,
  activities: activitiesCommand,
  profile: profileCommand,
  agent: agentCommand,
  test: testCommand,
};

export async function main(
  argv: string[] = process.argv.slice(2),
): Promise<void> {
  const args = arg(
    {
      '--help': Boolean,
      '--version': Boolean,
      '--json': Boolean,
      '--raw': Boolean,
      '--tui': Boolean,
      '-h': '--help',
      '-v': '--version',
    },
    { argv, permissive: true },
  );

  const flags: GlobalFlags = {
    help: args['--help'] ?? false,
    version: args['--version'] ?? false,
    json: args['--json'] ?? false,
    raw: args['--raw'] ?? false,
    tui: args['--tui'] ?? false,
  };

  if (flags.version) {
    console.log('strava-cli 1.0.0');
    return;
  }

  const subcommand = args._[0];

  if (!subcommand || flags.help) {
    console.log(HELP);
    return;
  }

  const handler = commands[subcommand];
  if (!handler) {
    console.error(`Unknown command: ${subcommand}\n`);
    console.log(HELP);
    process.exitCode = 1;
    return;
  }

  await handler(flags);
}
