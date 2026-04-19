import arg from 'arg';
import { isCancel, select, text } from '@clack/prompts';
import type { AthleteSex, GlobalFlags, StravaProfile } from '../types.js';
import { stravaProfileSchema } from '../schemas/strava-profile.js';
import { createLogger } from '../utils/logger.js';
import { loadProfile, saveProfile } from '../utils/auth.js';

const HELP = `
Usage: strava profile [subcommand] [options]

Subcommands:
  show  Show the current athlete profile (default)
  set   Configure athlete profile data

Set options:
  --age <n>        Age (10-100)
  --sex <value>    Sex: male | female
  --weight <kg>    Weight in kilograms (30-200)
  --height <cm>    Height in centimeters (100-250)
`.trim();

function formatProfile(profile: StravaProfile): string {
  return [
    `Edad: ${profile.age}`,
    `Sexo: ${profile.sex}`,
    `Peso: ${profile.weight} kg`,
    `Altura: ${profile.height} cm`,
  ].join('\n');
}

async function showProfile(flags: GlobalFlags): Promise<void> {
  const logger = createLogger(flags);
  const profile = await loadProfile();

  if (!profile) {
    if (flags.json) {
      logger.json({});
      return;
    }

    logger.info('No hay perfil configurado. Ejecuta `strava profile set`.');
    return;
  }

  if (flags.json) {
    logger.json(profile);
    return;
  }

  logger.info(formatProfile(profile));
}

function parseMachineProfile(argv: string[]): {
  profile: StravaProfile | null;
  hasAnyFlag: boolean;
  hasAllFlags: boolean;
} {
  const args = arg(
    {
      '--age': Number,
      '--sex': String,
      '--weight': Number,
      '--height': Number,
    },
    { argv, permissive: true },
  );

  const hasAge = args['--age'] !== undefined;
  const hasSex = args['--sex'] !== undefined;
  const hasWeight = args['--weight'] !== undefined;
  const hasHeight = args['--height'] !== undefined;

  const hasAnyFlag = hasAge || hasSex || hasWeight || hasHeight;
  const hasAllFlags = hasAge && hasSex && hasWeight && hasHeight;

  if (!hasAllFlags) {
    return { profile: null, hasAnyFlag, hasAllFlags };
  }

  return {
    profile: {
      age: args['--age'],
      sex: args['--sex'] as AthleteSex,
      weight: args['--weight'],
      height: args['--height'],
    },
    hasAnyFlag,
    hasAllFlags,
  };
}

async function setProfile(flags: GlobalFlags, argv: string[]): Promise<void> {
  const logger = createLogger(flags);
  const parsed = parseMachineProfile(argv);

  let profile: StravaProfile | null = parsed.profile;

  if (parsed.hasAnyFlag && !parsed.hasAllFlags) {
    logger.error('All profile fields are required in machine mode: --age --sex --weight --height');
    process.exitCode = 1;
    return;
  }

  if (!profile && logger.mode === 'interactive') {
    const ageInput = await text({
      message: 'Edad (10-100):',
      validate: (value) => {
        const n = Number(value);
        if (!Number.isFinite(n)) return 'Edad invalida';
        if (n < 10 || n > 100) return 'La edad debe estar entre 10 y 100';
        return undefined;
      },
    });
    if (isCancel(ageInput)) return;

    const sexInput = await select({
      message: 'Sexo:',
      options: [
        { value: 'male', label: 'male' },
        { value: 'female', label: 'female' },
      ],
    });
    if (isCancel(sexInput)) return;

    const weightInput = await text({
      message: 'Peso (kg, 30-200):',
      validate: (value) => {
        const n = Number(value);
        if (!Number.isFinite(n)) return 'Peso invalido';
        if (n < 30 || n > 200) return 'El peso debe estar entre 30 y 200 kg';
        return undefined;
      },
    });
    if (isCancel(weightInput)) return;

    const heightInput = await text({
      message: 'Altura (cm, 100-250):',
      validate: (value) => {
        const n = Number(value);
        if (!Number.isFinite(n)) return 'Altura invalida';
        if (n < 100 || n > 250) return 'La altura debe estar entre 100 y 250 cm';
        return undefined;
      },
    });
    if (isCancel(heightInput)) return;

    profile = {
      age: Number(ageInput),
      sex: sexInput as AthleteSex,
      weight: Number(weightInput),
      height: Number(heightInput),
    };
  }

  if (!profile) {
    logger.error('Missing profile values. Use all flags: --age --sex --weight --height');
    process.exitCode = 1;
    return;
  }

  const result = stravaProfileSchema.safeParse(profile);
  if (!result.success) {
    logger.error(`Invalid profile data: ${result.error.issues[0]?.message ?? 'unknown validation error'}`);
    process.exitCode = 1;
    return;
  }

  await saveProfile(result.data);

  if (flags.json) {
    logger.json(result.data);
    return;
  }

  logger.success('Perfil guardado correctamente.');
  logger.info(formatProfile(result.data));
}

export async function profileCommand(flags: GlobalFlags): Promise<void> {
  const argv = process.argv.slice(2);
  const profileIdx = argv.findIndex((a) => a === 'profile');
  const subArgv = profileIdx >= 0 ? argv.slice(profileIdx + 1) : [];

  const subcommand = subArgv.find((a) => !a.startsWith('-')) ?? 'show';

  if (flags.help) {
    console.log(HELP);
    return;
  }

  if (subcommand === 'show') {
    await showProfile(flags);
    return;
  }

  if (subcommand === 'set') {
    const setIdx = subArgv.indexOf('set');
    await setProfile(flags, setIdx >= 0 ? subArgv.slice(setIdx + 1) : subArgv);
    return;
  }

  console.error(`Unknown profile subcommand: ${subcommand}\n`);
  console.log(HELP);
  process.exitCode = 1;
}
