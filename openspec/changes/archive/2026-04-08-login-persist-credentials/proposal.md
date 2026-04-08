## Why

El comando `login` requiere que `STRAVA_CLIENT_ID` y `STRAVA_CLIENT_SECRET` estén definidos como variables de entorno. Esto obliga al usuario a crear un fichero `.env` o exportar las variables manualmente antes de cada uso, lo que hace la primera ejecución hostil y dificulta el uso fuera de desarrollo (e.g. `npx`). Además, sin persistir estas credenciales, funcionalidades futuras como el refresh automático de tokens no pueden funcionar de forma autónoma.

## What Changes

- Nuevo fichero de configuración `~/.config/strava-ai-cli/config.json` (permisos `0600`) para persistir `client_id` y `client_secret`.
- El comando `login` solicita las credenciales de forma interactiva si no las encuentra en variables de entorno ni en `config.json`.
- Las variables de entorno `STRAVA_CLIENT_ID` y `STRAVA_CLIENT_SECRET` siguen funcionando como override (compatibilidad con CI/CD).
- En modo machine (`--json`/`--raw`), si no hay credenciales disponibles, falla con error descriptivo y código 1 (sin prompt interactivo).

## Capabilities

### New Capabilities
- `login-credentials`: Resolución y persistencia de credenciales de aplicación Strava (client_id/client_secret) con cascada env → config → prompt interactivo.

### Modified Capabilities

## Impact

- `src/commands/login.ts` — Lógica de resolución de credenciales.
- `src/utils/auth.ts` — Nuevas funciones `saveConfig()` / `loadConfig()`.
- `src/schemas/strava-auth.ts` — Nuevo schema Zod para config.
- Sin dependencias nuevas. Se usa `@clack/prompts` (ya existente) para el prompt interactivo.
