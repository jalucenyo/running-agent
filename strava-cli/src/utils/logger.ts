import {
  isCI,
  isTTY,
  log,
  spinner as clackSpinner,
  intro,
  outro,
} from '@clack/prompts';
import type { GlobalFlags, OutputMode } from '../types.js';

export interface Spinner {
  start(message: string): void;
  stop(message: string): void;
  error(message: string): void;
}

export interface Logger {
  mode: OutputMode;
  intro(title: string): void;
  outro(message: string): void;
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
  success(message: string): void;
  spinner(): Spinner;
  json(data: unknown): void;
}

function detectMode(flags: GlobalFlags): OutputMode {
  if (flags.tui) return 'interactive';
  if (flags.json || flags.raw) return 'machine';
  if (isCI() || !isTTY(process.stdout)) return 'machine';
  return 'interactive';
}

function machineSpinner(flags: GlobalFlags): Spinner {
  return {
    start(message) {
      if (flags.json) {
        console.log(
          JSON.stringify({ level: 'spinner', status: 'start', message }),
        );
      } else {
        console.log(`... ${message}`);
      }
    },
    stop(message) {
      if (flags.json) {
        console.log(
          JSON.stringify({ level: 'spinner', status: 'stop', message }),
        );
      } else {
        console.log(`✓ ${message}`);
      }
    },
    error(message) {
      if (flags.json) {
        console.error(
          JSON.stringify({ level: 'spinner', status: 'error', message }),
        );
      } else {
        console.error(`✗ ${message}`);
      }
    },
  };
}

function interactiveSpinner(): Spinner {
  const s = clackSpinner();
  return {
    start(message) {
      s.start(message);
    },
    stop(message) {
      s.stop(message);
    },
    error(message) {
      s.stop(message, 1);
    },
  };
}

function machineLog(flags: GlobalFlags, level: string, message: string): void {
  if (flags.json) {
    const output = JSON.stringify({ level, message });
    if (level === 'error') {
      console.error(output);
    } else {
      console.log(output);
    }
  } else {
    if (level === 'error') {
      console.error(message);
    } else {
      console.log(message);
    }
  }
}

export function createLogger(flags: GlobalFlags): Logger {
  const mode = detectMode(flags);

  if (mode === 'interactive') {
    return {
      mode,
      intro: (title) => intro(title),
      outro: (message) => outro(message),
      info: (message) => log.info(message),
      warn: (message) => log.warn(message),
      error: (message) => log.error(message),
      success: (message) => log.success(message),
      spinner: () => interactiveSpinner(),
      json: (data) => console.log(JSON.stringify(data, null, 2)),
    };
  }

  return {
    mode,
    intro: (title) => machineLog(flags, 'intro', title),
    outro: (message) => machineLog(flags, 'outro', message),
    info: (message) => machineLog(flags, 'info', message),
    warn: (message) => machineLog(flags, 'warn', message),
    error: (message) => machineLog(flags, 'error', message),
    success: (message) => machineLog(flags, 'success', message),
    spinner: () => machineSpinner(flags),
    json: (data) => console.log(JSON.stringify(data, null, 2)),
  };
}
