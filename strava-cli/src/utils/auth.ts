import { promises as fs } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import type { StravaAuthConfig } from '../types.js';
import { stravaAuthConfigSchema } from '../schemas/strava-auth.js';

export function getConfigDir(): string {
  return join(homedir(), '.config', 'strava-ai-cli');
}

function getAuthFilePath(): string {
  return join(getConfigDir(), 'auth.json');
}

export async function saveTokens(tokens: StravaAuthConfig): Promise<void> {
  const configDir = getConfigDir();
  await fs.mkdir(configDir, { recursive: true, mode: 0o700 });
  await fs.writeFile(getAuthFilePath(), JSON.stringify(tokens, null, 2), {
    encoding: 'utf-8',
    mode: 0o600,
  });
}

export async function loadTokens(): Promise<StravaAuthConfig | null> {
  try {
    const content = await fs.readFile(getAuthFilePath(), 'utf-8');
    const parsed = JSON.parse(content);
    return stravaAuthConfigSchema.parse(parsed);
  } catch {
    return null;
  }
}

export async function clearTokens(): Promise<void> {
  try {
    await fs.unlink(getAuthFilePath());
  } catch {
    // File may not exist — silently ignore
  }
}
