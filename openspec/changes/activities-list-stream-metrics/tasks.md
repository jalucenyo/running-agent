## 1. Ampliar schema de actividad

- [x] 1.1 Ampliar `stravaActivitySchema` en `schemas/strava-activity.ts` con campos opcionales: `average_heartrate`, `max_heartrate`, `has_heartrate`, `total_elevation_gain`, `elev_high`, `elev_low`, `average_cadence`, `average_watts`, `max_watts`, `weighted_average_watts`, `average_speed`, `max_speed`, `calories`, `suffer_score`

## 2. Migración de list.ts al logger

- [x] 2.1 Migrar `list.ts` para usar `createLogger(flags)`: reemplazar `console.log/error` por métodos del logger, añadir spinner para la carga de actividades, intro/outro
- [x] 2.2 Implementar salida JSON (`--json`): `logger.json(activities)` con el array completo de actividades incluyendo campos de métricas
- [x] 2.3 Verificar que `--raw` muestra tabla plana sin decoraciones interactivas

## 3. Tabla con columnas adaptativas

- [x] 3.1 Ampliar `formatTable` con columnas de métricas: HR avg, HR max, Elev gain, Cadence, Power avg, Pace avg
- [x] 3.2 Implementar lógica de columnas adaptativas: ocultar columnas donde TODAS las actividades tienen `—`
- [x] 3.3 Calcular pace (min/km) a partir de `distance` y `moving_time`; pace máximo invirtiendo `max_speed`
- [x] 3.4 Formatear valores con unidades y decimales apropiados (bpm, m, spm, W, min:ss/km) y mostrar `—` para campos ausentes
