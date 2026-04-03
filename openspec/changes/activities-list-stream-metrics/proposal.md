## Why

El comando `activities list` actualmente muestra solo información básica de cada actividad (nombre, fecha, distancia, tiempo, tipo). Sin embargo, el endpoint `GET /athlete/activities` de Strava ya devuelve métricas pre-calculadas en el `SummaryActivity` (heartrate avg/max, elevation gain, cadence avg, watts avg/max, speed avg/max, etc.) que nuestro schema Zod simplemente ignora. Los usuarios necesitan ver estas métricas directamente en el listado para evaluar rápidamente la intensidad de sus entrenamientos sin peticiones adicionales.

## What Changes

- Ampliar `stravaActivitySchema` en `schemas/strava-activity.ts` para parsear los campos opcionales de métricas que ya devuelve el endpoint de listado: `average_heartrate`, `max_heartrate`, `total_elevation_gain`, `elev_high`, `elev_low`, `average_cadence`, `average_watts`, `max_watts`, `weighted_average_watts`, `average_speed`, `max_speed`, `has_heartrate`, `calories`, `suffer_score`.
- Mostrar siempre las columnas de métricas en la tabla de actividades, usando **columnas adaptativas**: se ocultan automáticamente las columnas donde TODAS las actividades de la página tienen valor `—` (sin datos).
- Ampliar la tabla de salida con columnas de métricas (HR, Elev, Cadence, Power, Pace).
- Migrar `list.ts` al sistema de logger (`createLogger`) para alinear con el resto del CLI (`export.ts`, `login.ts`), habilitando soporte de `--json`, `--raw` y spinners.

## Capabilities

### New Capabilities

_(ninguna — las métricas ya vienen en la respuesta de la API, solo hay que parsearlas y mostrarlas)_

### Modified Capabilities
- `activities-list`: Se amplía el schema Zod para parsear métricas del SummaryActivity y se muestran siempre con columnas adaptativas (se ocultan columnas sin datos). Se migra al logger.

## Impact

- **Código afectado**: `src/schemas/strava-activity.ts` (ampliar schema), `src/commands/activities/list.ts` (migración a logger, flag `--detailed`, tabla ampliada).
- **APIs**: Sin peticiones adicionales. Se sigue usando únicamente `GET /athlete/activities` (la misma petición de hoy). Solo se parsean más campos de la respuesta.
- **Dependencias**: Sin nuevas dependencias externas.
- **Rendimiento**: Sin impacto. Las columnas adaptativas solo controlan qué se muestra, no generan llamadas extra.
