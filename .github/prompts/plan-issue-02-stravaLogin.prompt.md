# Plan: Strava OAuth Login Command

## TL;DR

Implementar `strava login` con un flujo OAuth 2.0 Authorization Code: abrir navegador, capturar callback en servidor HTTP local, intercambiar código por tokens, y persistirlos en disco. En modo máquina/agente, solo emite la URL como JSON sin abrir navegador.

---

## Phase 1 — Dependencies & Configuration

1. **Instalar `open`** — `npm install open` en `strava-cli/`. Única dependencia nueva; `http`, `fs/promises`, `path`, `os`, `url` son built-ins de Node.
2. **Definir tipos de auth en `src/types.ts`** — `StravaTokenResponse` (respuesta de `/oauth/token`) y `StravaAuthConfig` (estructura almacenada: access_token, refresh_token, expires_at, resumen del atleta).
3. **Crear schemas Zod** en nuevo archivo `src/schemas/strava-auth.ts` — validar la respuesta de la API de Strava con `stravaTokenResponseSchema` usando zod (ya instalado).

## Phase 2 — Auth Storage Utility

4. **Crear `src/utils/auth.ts`** — capa de persistencia de tokens:
   - `getConfigDir()` → `~/.config/strava-ai-cli/`
   - `saveTokens(tokens)` — escribe `auth.json` con permisos `0o600` (solo lectura/escritura del owner); crea directorio con `0o700` si no existe
   - `loadTokens()` → lee `auth.json` o retorna `null`
   - `clearTokens()` → elimina `auth.json`

## Phase 3 — Login Command

5. **Crear `src/commands/login.ts`** siguiendo el patrón existente (`loginCommand(flags: GlobalFlags)`):
   - **Credenciales** desde env vars `STRAVA_CLIENT_ID` y `STRAVA_CLIENT_SECRET`; fallo temprano con error claro si faltan
   - **Check existing auth**: si ya hay tokens, informar y preguntar si re-autenticar (en modo interactivo) o re-auth directo (modo máquina)
   - **Build authorization URL**: `https://www.strava.com/oauth/authorize` con `client_id`, `response_type=code`, `redirect_uri=http://localhost:3000/callback`, `scope=read,activity:read_all`
   - **Branch por modo**:
     - **Interactivo**: abrir navegador con `open(url)`, spinner "Esperando autorización de Strava..."
     - **Máquina**: emitir `{ event: "auth_url", url: "..." }` como JSON, **NO** abrir navegador ni servidor. Return early.
   - **Servidor HTTP efímero** en `localhost:3000`:
     - Escuchar `GET /callback?code=...`
     - Responder HTML de éxito, cerrar servidor
     - **Timeout 120s** — si no llega callback, cerrar y mostrar error
   - **Intercambiar code por tokens**: POST a `https://www.strava.com/api/v3/oauth/token` con `fetch()` nativo (Node 18+), validar con Zod
   - **Guardar tokens** con `auth.ts`
   - **Mostrar éxito**: nombre del atleta + confirmación

6. **Registrar comando** en `src/index.ts` — añadir `login: loginCommand` al map de comandos, actualizar texto de ayuda.

## Phase 4 — HTML Callback

7. **Respuestas HTML inline** en `login.ts` — páginas mínimas de éxito/error para el callback del navegador (no archivos separados).

---

## Relevant Files

| File | Action |
|------|--------|
| `strava-cli/package.json` | Añadir dependencia `open` |
| `strava-cli/src/types.ts` | Añadir `StravaTokenResponse`, `StravaAuthConfig` |
| `strava-cli/src/schemas/strava-auth.ts` | **Nuevo** — Zod schemas |
| `strava-cli/src/utils/auth.ts` | **Nuevo** — persistencia de tokens |
| `strava-cli/src/commands/login.ts` | **Nuevo** — comando login |
| `strava-cli/src/index.ts` | Registrar login + actualizar HELP |

## Verification

1. `STRAVA_CLIENT_ID=xxx STRAVA_CLIENT_SECRET=yyy npx tsx bin/strava.ts login` — verificar que abre navegador, captura callback, guarda tokens en `~/.config/strava-ai-cli/auth.json` con permisos `0o600`
2. Mismo comando con `--json` — verificar que emite URL como JSON y NO abre navegador
3. `cat ~/.config/strava-ai-cli/auth.json` + `ls -la` — verificar estructura y permisos
4. Re-ejecutar `login` ya autenticado — verificar detección de tokens existentes
5. Ejecutar `login` sin completar auth — verificar timeout a 120s con mensaje claro
6. Ejecutar sin env vars — verificar error temprano y descriptivo
7. `npm run lint` sin errores nuevos

## Decisions

- **Credenciales por env vars** (`STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`) — práctica estándar para CLIs, evita hardcodear secretos
- **Modo máquina no abre navegador ni servidor** — emite la URL como JSON para que el agente/CI complete el flujo externamente (evita el problema del "contenedor congelado")
- **Puerto 3000 fijo** — debe coincidir con la redirect URI registrada en la app de Strava
- **Scope `read,activity:read_all`** — mínimo necesario para leer datos de entrenamiento
- **Token path `~/.config/strava-ai-cli/auth.json`** — convención XDG en Linux, compatible cross-platform
- **No auto-refresh de tokens** en este ticket — solo almacenar refresh_token. Rotación en un futuro comando/middleware
- **`fetch()` nativo** — Node 18+ lo incluye, sin dependencias adicionales
