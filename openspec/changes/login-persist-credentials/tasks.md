## 1. Schema y tipos

- [x] 1.1 Añadir `stravaAppConfigSchema` en `src/schemas/strava-auth.ts` con `client_id` y `client_secret` (ambos string)
- [x] 1.2 Añadir tipo `StravaAppConfig` en `src/types.ts`

## 2. Utilidades de config

- [x] 2.1 Implementar `saveConfig(config: StravaAppConfig)` en `src/utils/auth.ts` — escribe `config.json` en el config dir con permisos `0600`
- [x] 2.2 Implementar `loadConfig(): Promise<StravaAppConfig | null>` en `src/utils/auth.ts` — lee y valida con Zod, retorna `null` si no existe o es inválido

## 3. Resolución de credenciales

- [x] 3.1 Crear función `resolveCredentials(flags: GlobalFlags)` en `src/commands/login.ts` que implemente la cascada: env vars → `loadConfig()` → prompt interactivo → `saveConfig()`
- [x] 3.2 En modo machine, si no hay credenciales disponibles, emitir error descriptivo con código 1
- [x] 3.3 En modo interactive, mostrar mensaje guía con URL `https://www.strava.com/settings/api` antes de pedir credenciales
- [x] 3.4 Manejar cancelación del prompt (Ctrl+C) sin crash

## 4. Integración en login

- [x] 4.1 Reemplazar lectura directa de `process.env` en `loginCommand` por llamada a `resolveCredentials()`
