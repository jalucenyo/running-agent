import fs from 'node:fs/promises';
import path from 'node:path';
import { select, confirm, isCancel } from '@clack/prompts';
import type { GlobalFlags } from '../../types.js';
import { createLogger } from '../../utils/logger.js';
import { orchestrators, type Orchestrator } from './orchestrators.js';

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

  let orchestrator: Orchestrator | undefined;

  if (logger.mode === 'machine') {
    // Accept orchestrator id as positional argument
    const id = argv.find((a) => !a.startsWith('-'));
    if (!id) {
      logger.error(
        'Orchestrator id required in machine mode. Available: ' +
          orchestrators.map((o) => o.id).join(', '),
      );
      process.exitCode = 1;
      return;
    }
    orchestrator = orchestrators.find((o) => o.id === id);
    if (!orchestrator) {
      logger.error(
        `Unknown orchestrator: "${id}". Available: ${orchestrators.map((o) => o.id).join(', ')}`,
      );
      process.exitCode = 1;
      return;
    }
  } else {
    // Interactive select
    logger.intro('agent install');

    const selected = await select({
      message: 'Selecciona un orquestador:',
      options: orchestrators.map((o) => ({ value: o.id, label: o.label })),
    });

    if (isCancel(selected)) {
      return;
    }

    orchestrator = orchestrators.find((o) => o.id === selected);
    if (!orchestrator) {
      process.exitCode = 1;
      return;
    }
  }

  const installRoot = process.env.INIT_CWD ?? process.cwd();
  const destPath = path.resolve(installRoot, orchestrator.destDir);

  // Confirm overwrite if destination has content
  const alreadyExists = await destExists(destPath);
  if (alreadyExists) {
    if (logger.mode === 'machine') {
      logger.error(
        `Destination "${orchestrator.destDir}" already exists. Remove it before reinstalling.`,
      );
      process.exitCode = 1;
      return;
    }

    const ok = await confirm({
      message: `El directorio "${orchestrator.destDir}" ya existe. ¿Sobrescribir?`,
    });

    if (isCancel(ok) || !ok) {
      return;
    }
  }

  const spinner = logger.spinner();
  spinner.start(`Instalando ${orchestrator.label}...`);

  try {
    await fs.mkdir(path.dirname(destPath), { recursive: true });
    await fs.cp(orchestrator.templateDir, destPath, { recursive: true });
    spinner.stop(
      `${orchestrator.label} instalado en "${orchestrator.destDir}"`,
    );
  } catch (err) {
    spinner.error(
      `Error instalando ${orchestrator.label}: ${err instanceof Error ? err.message : String(err)}`,
    );
    process.exitCode = 1;
    return;
  }

  if (logger.mode === 'machine') {
    logger.json({ orchestrator: orchestrator.id, destination: destPath });
  } else {
    logger.outro('Instalación completada.');
  }
}
