import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { confirm, isCancel } from '@clack/prompts';
import type { GlobalFlags } from '../../types.js';
import { createLogger } from '../../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TEMPLATE_DIR = path.resolve(
  __dirname,
  '../../templates/skills/sports-analyst',
);
const DEST_DIR = '.agents/skills/sports-analyst';

async function destExists(destPath: string): Promise<boolean> {
  try {
    await fs.stat(destPath);
    return true;
  } catch {
    return false;
  }
}

export async function agentInstall(
  flags: GlobalFlags,
  argv: string[],
): Promise<void> {
  const logger = createLogger(flags);

  const legacyOrchestratorArg = argv.find((a) => !a.startsWith('-'));
  if (legacyOrchestratorArg) {
    logger.warn(
      'El argumento de orquestador ya no se usa. Instalando en .agents/skills.',
    );
  }

  if (logger.mode === 'interactive') {
    logger.intro('agent install');
  }

  const installRoot = process.env.INIT_CWD ?? process.cwd();
  const destPath = path.resolve(installRoot, DEST_DIR);

  // Confirm overwrite if destination has content
  const alreadyExists = await destExists(destPath);
  if (alreadyExists) {
    if (logger.mode === 'machine') {
      logger.error(
        `Destination "${DEST_DIR}" already exists. Remove it before reinstalling.`,
      );
      process.exitCode = 1;
      return;
    }

    const ok = await confirm({
      message: `El directorio "${DEST_DIR}" ya existe. ¿Sobrescribir?`,
    });

    if (isCancel(ok) || !ok) {
      return;
    }
  }

  const spinner = logger.spinner();
  spinner.start('Instalando sports-analyst skill...');

  try {
    await fs.mkdir(path.dirname(destPath), { recursive: true });
    await fs.cp(TEMPLATE_DIR, destPath, { recursive: true });
    spinner.stop(`sports-analyst instalado en "${DEST_DIR}"`);
  } catch (err) {
    spinner.error(
      `Error instalando sports-analyst: ${err instanceof Error ? err.message : String(err)}`,
    );
    process.exitCode = 1;
    return;
  }

  if (logger.mode === 'machine') {
    logger.json({ destination: destPath });
  } else {
    logger.outro('Instalación completada.');
  }
}
