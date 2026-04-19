import type { GlobalFlags } from '../../types.js';
import { agentInstall } from './install.js';

const HELP = `
Usage: strava agent <subcommand> [options]

Subcommands:
  install  Install the sports-analyst skill for a supported orchestrator

Options:
  --help    Show this help message
`.trim();

export async function agentCommand(flags: GlobalFlags): Promise<void> {
  const argv = process.argv.slice(2);
  const agentIdx = argv.findIndex((a) => a === 'agent');
  const subArgv = agentIdx >= 0 ? argv.slice(agentIdx + 1) : [];

  const subcommand = subArgv.find((a) => !a.startsWith('-'));

  if (!subcommand || flags.help) {
    console.log(HELP);
    return;
  }

  if (subcommand === 'install') {
    const installIdx = subArgv.indexOf('install');
    await agentInstall(flags, installIdx >= 0 ? subArgv.slice(installIdx + 1) : subArgv);
    return;
  }

  console.error(`Unknown agent subcommand: ${subcommand}\n`);
  console.log(HELP);
  process.exitCode = 1;
}
