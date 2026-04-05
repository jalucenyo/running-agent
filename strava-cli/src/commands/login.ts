import { createServer } from 'http';
import open from 'open';
import type { GlobalFlags } from '../types.js';
import { createLogger } from '../utils/logger.js';
import { saveTokens, loadTokens } from '../utils/auth.js';
import { stravaTokenResponseSchema } from '../schemas/strava-auth.js';

const REDIRECT_URI = 'http://localhost:3000/callback';
const CALLBACK_TIMEOUT_MS = 120_000;

const SUCCESS_HTML = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Autenticación exitosa</title></head>
<body style="font-family:sans-serif;text-align:center;margin-top:4rem">
  <h1>✅ ¡Autenticación correcta!</h1>
  <p>Puedes cerrar esta ventana y volver a la terminal.</p>
</body>
</html>`;

const ERROR_HTML = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Error de autenticación</title></head>
<body style="font-family:sans-serif;text-align:center;margin-top:4rem">
  <h1>❌ Error de autenticación</h1>
  <p>No se pudo completar la autenticación. Intenta de nuevo desde la terminal.</p>
</body>
</html>`;

export async function loginCommand(flags: GlobalFlags): Promise<void> {
  const logger = createLogger(flags);

  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    logger.error(
      'Missing required environment variables: STRAVA_CLIENT_ID and STRAVA_CLIENT_SECRET must be set.',
    );
    process.exitCode = 1;
    return;
  }

  const existing = await loadTokens();
  if (existing) {
    const athlete = `${existing.athlete.firstname} ${existing.athlete.lastname}`;
    if (logger.mode === 'machine') {
      logger.json({
        event: 'already_authenticated',
        athlete,
        message: 'Already authenticated. Use --force to re-authenticate.',
      });
      return;
    }

    const { confirm } = await import('@clack/prompts');
    const reauth = await confirm({
      message: `Ya estás autenticado como ${athlete}. ¿Quieres volver a autenticarte?`,
    });
    if (!reauth) {
      logger.outro('Autenticación cancelada.');
      return;
    }
  }

  const authUrl = new URL('https://www.strava.com/oauth/authorize');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.set('approval_prompt', 'force');
  authUrl.searchParams.set('scope', 'read,activity:read_all,activity:write');

  if (logger.mode === 'machine') {
    logger.json({ event: 'auth_url', url: authUrl.toString() });
    return;
  }

  logger.intro('strava login');

  await open(authUrl.toString());

  const spinner = logger.spinner();
  spinner.start('Esperando autorización de Strava...');

  let authCode: string;
  try {
    authCode = await waitForCallback();
  } catch (err) {
    spinner.error(err instanceof Error ? err.message : 'Error inesperado');
    process.exitCode = 1;
    return;
  }

  spinner.stop('Autorización recibida');

  const tokenSpinner = logger.spinner();
  tokenSpinner.start('Intercambiando código por tokens...');

  let tokenData: ReturnType<typeof stravaTokenResponseSchema.parse>;
  try {
    const response = await fetch('https://www.strava.com/api/v3/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: authCode,
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Strava token exchange failed (${response.status}): ${body}`);
    }

    const json = await response.json();
    tokenData = stravaTokenResponseSchema.parse(json);
  } catch (err) {
    tokenSpinner.error(err instanceof Error ? err.message : 'Error al obtener tokens');
    process.exitCode = 1;
    return;
  }

  await saveTokens({
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    expires_at: tokenData.expires_at,
    athlete: {
      id: tokenData.athlete.id,
      firstname: tokenData.athlete.firstname,
      lastname: tokenData.athlete.lastname,
      username: tokenData.athlete.username,
    },
  });

  tokenSpinner.stop('Tokens guardados correctamente');

  const name = `${tokenData.athlete.firstname} ${tokenData.athlete.lastname}`;
  logger.success(`¡Autenticado como ${name}!`);
  logger.outro('Listo. Ya puedes usar strava-cli.');
}

function waitForCallback(): Promise<string> {
  return new Promise((resolve, reject) => {
    let timeout: ReturnType<typeof setTimeout> | undefined;

    const server = createServer((req, res) => {
      const reqUrl = new URL(req.url ?? '/', 'http://localhost:3000');

      if (reqUrl.pathname !== '/callback') {
        res.writeHead(404);
        res.end('Not found');
        return;
      }

      const code = reqUrl.searchParams.get('code');
      const error = reqUrl.searchParams.get('error');

      if (error || !code) {
        res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(ERROR_HTML);
        clearTimeout(timeout);
        server.close();
        reject(new Error(`Strava devolvió un error: ${error ?? 'código no recibido'}`));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(SUCCESS_HTML);
      clearTimeout(timeout);
      server.close();
      resolve(code);
    });

    server.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    server.listen(3000, '127.0.0.1', () => {
      timeout = setTimeout(() => {
        server.close();
        reject(new Error('Timeout: no se recibió el callback de Strava en 120 segundos.'));
      }, CALLBACK_TIMEOUT_MS);
      timeout.unref();
    });
  });
}
