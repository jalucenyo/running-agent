## Context

El comando `activities list` muestra actualmente una tabla con campos básicos de la API de listado de Strava (`GET /athlete/activities`): nombre, fecha, distancia, tiempo y tipo. Los streams detallados (heartrate, altitude, cadence, watts, latlng) solo se obtienen en el comando `export` para generar archivos FIT.

El proyecto ya cuenta con:
- Esquemas Zod para streams en `schemas/strava-streams.ts` con `parseStreams()`.
- Constante `STREAMS_KEYS` usada en `export.ts` para solicitar streams.
- Logger con modos interactive/machine.

## Goals / Non-Goals

**Goals:**
- Permitir a los usuarios ver métricas agregadas de streams directamente en el listado de actividades mediante un flag `--detailed`.
- Calcular métricas útiles por tipo de stream: min, max, avg para heartrate/watts; ganancia acumulada para altitud; pace para distancia/tiempo; avg para cadencia.
- Reutilizar la infraestructura de streams existente (`schemas/strava-streams.ts`).
- Mantener la experiencia rápida por defecto (sin `--detailed` no hay llamadas extra).

**Non-Goals:**
- No se implementará caché de streams entre ejecuciones.
- No se implementará concurrencia paralela de peticiones de streams (se harán secuencialmente para respetar los rate limits de Strava).
- No se calculará potencia normalizada (NP) en esta iteración — requiere algoritmo de ventana deslizante de 30s que se abordará en un cambio futuro.

## Decisions

### 1. Flag `--detailed` en lugar de mostrar siempre

**Decisión**: Añadir un flag booleano `--detailed` que active la obtención de streams.

**Alternativas consideradas**:
- Mostrar siempre métricas: descartado porque implica N peticiones extra en cada `list`, penalizando la experiencia por defecto.
- Flag `--streams heartrate,altitude`: descartado por complejidad excesiva; en la práctica el usuario quiere ver todo o nada.

**Razón**: Mantiene la experiencia rápida por defecto y da control explícito al usuario.

### 2. Peticiones secuenciales de streams

**Decisión**: Obtener los streams de cada actividad de forma secuencial (una petición tras otra).

**Alternativas consideradas**:
- Peticiones en paralelo con `Promise.all`: descartado porque la API de Strava tiene rate limit de 100 peticiones/15 min y 1000/día. Con `--per-page 30` + 30 peticiones de streams ya estamos en 31 peticiones.

**Razón**: Evitar golpear el rate limit y ser buen ciudadano de la API.

### 3. Módulo separado `stream-metrics.ts`

**Decisión**: Crear un módulo `src/utils/stream-metrics.ts` con funciones puras de cálculo de métricas.

**Razón**: Separar cálculo de métricas de la lógica de comandos permite reutilización futura (por ejemplo, en un posible comando `activities detail`) y facilita testing unitario.

### 4. Métricas por tipo de stream

**Decisión**: Cada tipo de stream genera métricas específicas y relevantes:

| Stream | Métricas |
|--------|----------|
| heartrate | min, max, avg (bpm) |
| altitude | min, max, elevation gain (m) |
| cadence | avg (spm) |
| watts | min, max, avg (W) |
| distance + time | avg pace (min/km) |

**Razón**: Mostrar métricas con significado deportivo en lugar de estadísticas genéricas. El pace se calcula desde distance y time en lugar de tener un stream propio.

### 5. Tabla ampliada con columnas condicionales

**Decisión**: Cuando `--detailed` está activo, añadir columnas adicionales a la tabla existente: `HR avg`, `HR max`, `Elev gain`, `Cadence`, `Power avg`, `Pace avg`.

**Alternativas consideradas**:
- Tabla separada debajo de cada actividad: descartado porque rompe la legibilidad del listado.
- Solo las columnas que tengan datos: considerado pero añade complejidad al formateo. Se mostrarán todas las columnas con `—` cuando no hay datos.

### 6. Migración de `list.ts` al logger

**Decisión**: Migrar `list.ts` de `console.log/error` directos a `createLogger(flags)` como parte de este cambio.

**Alternativas consideradas**:
- Dejarlo para un cambio separado: descartado porque ya estamos abriendo el archivo para una cirugía significativa, y el coste marginal es bajo (~15-20 líneas).
- Mantener `console.log` y añadir `logger` solo para `--detailed`: descartado porque mezclar dos patrones de salida en el mismo comando genera inconsistencias.

**Razón**: `list.ts` es el único comando que no usa el logger. Alinearlo ahora habilita `--json` y `--raw` para el listado básico (no solo `--detailed`), spinners de feedback, y consistencia con `export.ts` y `login.ts`.

## Risks / Trade-offs

- **[Rate limit de Strava]** → Con `--per-page` alto y `--detailed`, se pueden consumir muchas peticiones rápidamente. Mitigación: documentar en la ayuda del comando que se recomienda `--per-page` bajo con `--detailed`. No se limita programáticamente para no sobreproteger al usuario.
- **[Latencia percibida]** → N peticiones secuenciales pueden ser lentas. Mitigación: usar el spinner del logger para dar feedback visual y mostrar progreso ("Obteniendo streams 3/10…").
- **[Actividades sin streams]** → Algunas actividades manuales no tienen streams. Mitigación: mostrar `—` en las columnas de métricas cuando no hay datos disponibles. No tratar como error.
- **[Streams parciales]** → Una actividad puede tener heartrate pero no watts. Mitigación: cada métrica se calcula independientemente; si el stream no existe, la columna muestra `—`.
