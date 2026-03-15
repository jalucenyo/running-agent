import type { GlobalFlags } from '../types.js';
import { createLogger } from '../utils/logger.js';

export async function testCommand(flags: GlobalFlags): Promise<void> {
  const logger = createLogger(flags);

  logger.intro('strava-cli test');
  logger.info('This is an info message');
  logger.warn('This is a warning');
  logger.success('This is a success message');
  logger.error('This is an error message');

  const s = logger.spinner();
  s.start('Doing some work...');
  await new Promise((resolve) => setTimeout(resolve, 3000));
  s.stop('Work complete');

  logger.json({ command: 'test', status: 'ok', mode: logger.mode });
  logger.outro('Done!');
}
