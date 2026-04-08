## Context

El CLI de Strava usa OAuth2 para autenticarse. Actualmente las credenciales de aplicación (`client_id`, `client_secret`) se obtienen exclusivamente de variables de entorno. Los tokens de sesión ya se persisten en `~/.config/strava-ai-cli/auth.json` con permisos `0600`.

El directorio de configuración `~/.config/strava-ai-cli/` ya existe como estándar del proyecto.

## Goals / Non-Goals

**Goals:**
- Persistir credenciales de aplicación en disco para que el usuario las introduzca una sola vez.
- Mantener compatibilidad con variables de entorno como mecanismo de override.
- Guiar al usuario en la primera ejecución con prompts interactivos claros.
- Fallar limpiamente en modo machine cuando no hay credenciales disponibles.

**Non-Goals:**
- Refresh automático de tokens (cambio separado).
- Cifrado de credenciales o integración con keychain del sistema.
- Soporte multi-app o multi-cuenta.

## Decisions

### Fichero separado `config.json` vs ampliar `auth.json`

**Decisión**: Fichero separado `~/.config/strava-ai-cli/config.json`.

**Alternativa**: Incluir `client_id`/`client_secret` dentro de `auth.json`.

**Razón**: Separar la configuración de aplicación (persistente, rara vez cambia) de los tokens de sesión (pueden expirar, se pueden borrar con logout). Un `clearTokens()` no debe eliminar las credenciales de app.

### Cascada de resolución

**Decisión**: Orden de precedencia env → config.json → prompt interactivo.

Las variables de entorno (`STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`) tienen máxima prioridad para mantener compatibilidad y permitir uso en CI/CD. Si no existen, se lee `config.json`. Si tampoco existe, se solicitan interactivamente (solo en modo interactive).

### Prompt interactivo restringido a modo interactive

**Decisión**: En modo machine (`--json`/`--raw`), si no hay credenciales, se emite error con código 1.

**Razón**: Un proceso automatizado no puede responder prompts. Mejor fallar explícitamente con un mensaje que indique cómo configurar las credenciales.

### Schema Zod para config

**Decisión**: Nuevo schema `stravaAppConfigSchema` en `strava-auth.ts` validando `client_id` (string) y `client_secret` (string).

**Razón**: Consistente con el patrón existente de validar todo con Zod en boundaries. Si el fichero está corrupto o incompleto, se detecta al leerlo y se puede volver al prompt interactivo.

## Risks / Trade-offs

- **Secret en texto plano en disco** → Mitigado con permisos `0600`. Aceptable para CLI personal (mismo patrón que `auth.json`, `~/.docker/config.json`, `~/.npmrc`).
- **Config corrupto** → Si `loadConfig()` falla validación Zod, se trata como si no existiera y se pide de nuevo por prompt. No se borra el fichero corrupto automáticamente.
