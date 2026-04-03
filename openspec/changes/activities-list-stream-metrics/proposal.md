## Why

El comando `activities list` actualmente muestra solo información básica de cada actividad (nombre, fecha, distancia, tiempo, tipo). Los usuarios necesitan ver métricas derivadas de los streams de Strava (frecuencia cardíaca, altitud, cadencia, potencia) directamente en el listado para evaluar rápidamente la calidad e intensidad de sus entrenamientos sin tener que exportar o consultar cada actividad individualmente.

## What Changes

- Añadir un flag `--detailed` al comando `activities list` que, cuando se active, obtenga los streams de cada actividad listada y muestre métricas agregadas (min, max, avg) junto a la información básica.
- Crear un módulo de cálculo de métricas que procese los streams numéricos y genere estadísticas resumen por tipo de stream:
  - **heartrate**: min, max, avg (bpm)
  - **altitude**: min, max, ganancia acumulada (m)
  - **cadence**: avg (spm)
  - **watts**: min, max, avg, normalized power (W)
  - **distance/time**: pace medio, pace máximo (min/km)
- Ampliar la tabla de salida para incluir columnas adicionales cuando `--detailed` está activo.
- Migrar `list.ts` al sistema de logger (`createLogger`) para alinear con el resto del CLI (`export.ts`, `login.ts`), habilitando soporte de `--json`, `--raw` y spinners.
- Reutilizar los esquemas de streams ya existentes en `schemas/strava-streams.ts`.

## Capabilities

### New Capabilities
- `stream-metrics`: Cálculo de métricas agregadas (min, max, avg, ganancia, pace, potencia normalizada) a partir de los streams de una actividad de Strava.

### Modified Capabilities
- `activities-list`: Se añade el flag `--detailed` que enriquece la tabla de actividades con métricas derivadas de los streams.

## Impact

- **Código afectado**: `src/commands/activities/list.ts` (migración a logger, flag nuevo, lógica de fetch de streams, tabla ampliada), nuevo módulo `src/utils/stream-metrics.ts`.
- **APIs**: Se consumirá el endpoint `GET /activities/{id}/streams` por cada actividad cuando `--detailed` esté activo. Esto implica N llamadas adicionales a la API (una por actividad listada).
- **Dependencias**: Sin nuevas dependencias externas. Se reutilizan `schemas/strava-streams.ts` y `utils/` existentes.
- **Rendimiento**: El modo `--detailed` será más lento proporcionalmente al número de actividades (N peticiones extra). Se recomienda combinarlo con `--per-page` bajo.
