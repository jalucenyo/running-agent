## 1. Módulo de métricas de streams

- [ ] 1.1 Crear `src/utils/stream-metrics.ts` con tipos para el resultado de métricas (`StreamMetrics`, con campos para heartrate, altitude, cadence, power y pace)
- [ ] 1.2 Implementar función de cálculo de métricas numéricas genéricas (min, max, avg) que ignore nulls
- [ ] 1.3 Implementar cálculo de elevation gain (suma de deltas positivos en altitude stream)
- [ ] 1.4 Implementar cálculo de pace medio (min/km) a partir de distance y time streams
- [ ] 1.5 Implementar función principal `computeStreamMetrics(streams: ParsedStreams): StreamMetrics` que agregue todas las métricas

## 2. Migración de list.ts al logger

- [ ] 2.1 Migrar `list.ts` para usar `createLogger(flags)`: reemplazar `console.log/error` por métodos del logger, añadir spinner para la carga de actividades, intro/outro
- [ ] 2.2 Implementar salida JSON básica (`--json` sin `--detailed`): `logger.json(activities)` con el array de actividades
- [ ] 2.3 Verificar que `--raw` muestra tabla plana sin decoraciones interactivas

## 3. Integración de --detailed en activities list

- [ ] 3.1 Añadir flag `--detailed` al parser de argumentos en `src/commands/activities/list.ts`
- [ ] 3.2 Implementar lógica de fetch secuencial de streams por cada actividad cuando `--detailed` está activo, con spinner de progreso
- [ ] 3.3 Llamar a `computeStreamMetrics` para cada actividad y asociar los resultados
- [ ] 3.4 Manejar actividades sin streams (mostrar `—` en columnas de métricas)

## 4. Tabla ampliada

- [ ] 4.1 Ampliar `formatTable` para aceptar métricas opcionales y añadir columnas: HR avg, HR max, Elev gain, Cadence, Power avg, Pace avg
- [ ] 4.2 Formatear valores de métricas con unidades y decimales apropiados (bpm, m, spm, W, min:ss/km)
- [ ] 4.3 Mostrar `—` en columnas sin datos disponibles

## 5. Soporte de modos de salida con --detailed

- [ ] 5.1 Añadir campo `metrics` al output JSON cuando `--detailed` + `--json`
- [ ] 5.2 Omitir spinner de progreso en modo no interactivo pero mantener fetch de streams y tabla extendida
