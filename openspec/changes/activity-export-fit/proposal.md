## Why

Actualmente el CLI de Strava permite listar actividades pero no ofrece ninguna forma de exportar los datos de una actividad. Los usuarios necesitan poder exportar sus actividades al formato FIT (Flexible and Interoperable Data Transfer) de Garmin, que es el estándar de la industria para el intercambio de datos de actividades deportivas entre plataformas y dispositivos.

## What Changes

- Nuevo subcomando `activities export` que permite seleccionar una actividad interactivamente y exportarla a un archivo FIT
- Obtención de datos detallados de la actividad (streams) desde la API de Strava: GPS (latitud/longitud), frecuencia cardíaca, altitud, distancia, tiempo, cadencia, potencia
- Codificación de los datos en formato binario FIT según la especificación del protocolo FIT de Garmin (Activity File type)
- Generación del archivo `.fit` con la estructura requerida: File Header, File ID message, Device Info, Event (timer start/stop), Record messages, Lap messages, Session message, Activity message, y CRC
- Selección interactiva de la actividad mediante `@clack/prompts` (modo interactive) o por ID directo (modo machine con `--id`)

## Capabilities

### New Capabilities
- `activity-export-fit`: Exportar una actividad de Strava a un archivo en formato FIT. Cubre la selección de actividad, obtención de streams desde la API, codificación al formato binario FIT, y escritura del archivo resultante.

### Modified Capabilities

## Impact

- **Nuevo código**: `src/commands/activities/export.ts` — comando de exportación, `src/fit/` — módulo encoder FIT
- **Schemas**: Nuevo schema Zod para validar la respuesta de streams de la API de Strava (`GET /activities/{id}/streams`)
- **Dependencias**: No se añaden dependencias externas; el encoder FIT se implementará de forma nativa en TypeScript usando `Buffer`/`DataView` para la escritura binaria
- **API de Strava**: Se consume el endpoint `GET /activities/{id}/streams` con los tipos: `latlng`, `heartrate`, `altitude`, `distance`, `time`, `cadence`, `watts`
- **Archivos existentes**: Se modifica `src/commands/activities/index.ts` para registrar el nuevo subcomando `export`
