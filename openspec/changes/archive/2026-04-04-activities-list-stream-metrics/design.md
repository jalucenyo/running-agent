## Context

El comando `activities list` muestra actualmente una tabla con campos básicos de la API de listado de Strava (`GET /athlete/activities`): nombre, fecha, distancia, tiempo y tipo. Sin embargo, el endpoint ya devuelve el modelo `SummaryActivity` que contiene métricas pre-calculadas (heartrate, elevation, cadence, watts, speed) que nuestro schema Zod ignora.

El proyecto ya cuenta con:
- Schema Zod mínimo en `schemas/strava-activity.ts` (solo 6 campos).
- Logger con modos interactive/machine en `utils/logger.ts`.
- `list.ts` es el único comando que usa `console.log` directamente en lugar del logger.

## Goals / Non-Goals

**Goals:**
- Mostrar métricas del SummaryActivity (HR avg/max, elevation gain, cadence, watts, pace) siempre en el listado de actividades, con columnas adaptativas que ocultan columnas sin datos.
- Ampliar el schema Zod para parsear los campos opcionales de métricas que ya devuelve la API.
- Migrar `list.ts` al logger para soportar `--json`, `--raw` y spinners.
- Sin peticiones adicionales a la API — todo viene en la respuesta existente.

**Non-Goals:**
- No se consultarán streams (`GET /activities/{id}/streams`) — las métricas del SummaryActivity son suficientes.
- No se implementará caché de actividades entre ejecuciones.
- No se calcularán métricas que no vienen pre-calculadas (HR min, cadence min/max, distribución por zonas).

## Decisions

### 1. Usar métricas del SummaryActivity en lugar de streams

**Decisión**: Parsear los campos de métricas que ya devuelve `GET /athlete/activities` en lugar de hacer peticiones adicionales a `/activities/{id}/streams`.

**Alternativas consideradas**:
- Obtener streams por cada actividad (N peticiones extra): descartado porque el SummaryActivity ya incluye average_heartrate, max_heartrate, total_elevation_gain, average_cadence, average_watts, max_watts, weighted_average_watts, average_speed y max_speed. Calcular lo mismo desde streams sería redundante y 30x más lento.

**Razón**: 0 peticiones extra, misma información útil, implementación mucho más simple.

### 2. Campos opcionales en el schema Zod

**Decisión**: Los campos de métricas se modelan como opcionales (`.optional()`) en el schema porque no todas las actividades los tienen (actividades manuales, sin sensor HR, sin potenciómetro, etc.).

**Razón**: Actividades manuales no tienen heartrate; actividades de running no tienen watts. El schema debe ser tolerante.

### 3. Columnas adaptativas (sin flag `--detailed`)

**Decisión**: Mostrar siempre todas las columnas de métricas disponibles. Las columnas donde TODAS las actividades de la página tienen valor `—` se ocultan automáticamente.

**Alternativas consideradas**:
- Flag `--detailed` para toggle: descartado porque no hay coste extra (los datos ya vienen en la respuesta) y el flag añade complejidad innecesaria.
- Flag granular `--columns hr,elev`: descartado por exceso de complejidad.

**Razón**: Sin coste de API, máxima información por defecto. Las columnas adaptativas evitan ensuciar la tabla con columnas vacías (ej: Power no aparece si solo hay actividades de running sin potenciómetro).

### 4. Cálculo de pace desde campos existentes

**Decisión**: Calcular pace (min/km) a partir de `distance` y `moving_time` que ya tenemos, y pace máximo invirtiendo `max_speed` (m/s → min/km).

**Razón**: No requiere campos adicionales ni streams. Es aritmética simple.

### 5. Migración de `list.ts` al logger

**Decisión**: Migrar `list.ts` de `console.log/error` directos a `createLogger(flags)` como parte de este cambio.

**Razón**: `list.ts` es el único comando que no usa el logger. Alinearlo ahora habilita `--json` y `--raw` para el listado, spinners de feedback, y consistencia con `export.ts` y `login.ts`. Coste marginal bajo (~15-20 líneas).

## Risks / Trade-offs

- **[Campos ausentes en actividades antiguas o manuales]** → Algunas actividades pueden no tener heartrate, watts u otros campos. Mitigación: modelar como opcionales en Zod y mostrar `—` en columnas sin datos.
- **[Ancho de tabla con todas las métricas]** → La tabla con métricas puede ser ancha. Mitigación: columnas adaptativas (ocultar columnas sin datos), abreviaturas en headers (HR, Elev, Cad, Pwr) y truncar valores a 0-1 decimales.
- **[weighted_average_watts solo en rides con potenciómetro]** → Según la API, este campo es "Rides with power meter data only". Mitigación: campo opcional, mostrar `—` si no está presente.
