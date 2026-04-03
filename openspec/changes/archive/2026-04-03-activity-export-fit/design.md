## Context

El CLI de Strava (`strava-cli`) actualmente soporta listar actividades mediante `activities list`. Se necesita añadir la capacidad de exportar una actividad individual al formato FIT de Garmin, que es el estándar binario de la industria para intercambio de datos deportivos entre dispositivos y plataformas.

El flujo requiere: (1) seleccionar una actividad, (2) obtener los datos detallados (streams) desde la API de Strava, (3) codificar los datos en formato binario FIT, y (4) escribir el archivo `.fit` resultante.

La API de Strava expone el endpoint `GET /activities/{id}/streams` que devuelve series temporales de datos (GPS, frecuencia cardíaca, altitud, distancia, tiempo, cadencia, potencia). Estos datos se mapearán a los mensajes FIT correspondientes.

## Goals / Non-Goals

**Goals:**
- Permitir exportar cualquier actividad de Strava a un archivo FIT válido
- Implementar un encoder FIT nativo en TypeScript sin dependencias externas
- Soportar los datos más comunes: GPS, frecuencia cardíaca, altitud, distancia, cadencia, potencia
- Modo interactivo (selección con `@clack/prompts`) y modo directo (`--id`)
- Generar archivos FIT compatibles con Garmin Connect y otras plataformas

**Non-Goals:**
- No se implementa decodificación de archivos FIT (solo encoding)
- No se soportan Developer Data Fields ni campos custom
- No se implementa exportación batch de múltiples actividades
- No se soportan actividades de natación en piscina (Length messages)
- No se implementa un encoder FIT genérico reutilizable — se optimiza para el caso de uso de actividades de running/cycling

## Decisions

### 1. Encoder FIT nativo en TypeScript vs librería externa

**Decisión**: Implementar un encoder FIT nativo usando `Buffer` de Node.js.

**Alternativas consideradas**:
- **FIT SDK de Garmin (JavaScript)**: Existe un SDK oficial, pero añadiría una dependencia significativa y el SDK está orientado a decode más que encode. Además no está publicado en npm como paquete estándar.
- **Librería npm de terceros**: Las opciones disponibles (`fit-file-writer`, etc.) son pocas, poco mantenidas, y añadirían dependencia externa contra las convenciones del proyecto.

**Rationale**: El formato FIT para encoding de actividades es relativamente directo — se necesita escribir headers, definition messages y data messages en formato binario little-endian. Con `Buffer` de Node.js esto es manejable y mantiene el proyecto sin dependencias externas de HTTP/binario, coherente con la convención del proyecto de usar `fetch` nativo.

### 2. Estructura del módulo FIT encoder

**Decisión**: Crear un módulo `src/fit/` con la siguiente estructura:

```
src/fit/
├── encoder.ts       # Clase FitEncoder: open(), write(), close()
├── messages.ts      # Funciones para crear mensajes FIT (fileId, record, lap, session, activity)
├── types.ts         # Constantes FIT: mesg_num, field_def, base types
└── crc.ts           # Cálculo CRC-16 del protocolo FIT
```

**Rationale**: Separar la lógica de encoding binario (encoder), la construcción de mensajes específicos (messages), las constantes del protocolo (types) y el CRC permite mantener cada archivo enfocado y testeable.

### 3. Obtención de datos: Activity detail + Streams

**Decisión**: Usar dos llamadas a la API de Strava:
1. `GET /activities/{id}` — datos de resumen (nombre, sport type, timestamps, distancia total, etc.)
2. `GET /activities/{id}/streams?keys=time,latlng,heartrate,altitude,distance,cadence,watts&key_type=time` — series temporales

**Rationale**: Los datos de resumen se necesitan para los mensajes Session, Lap y Activity. Los streams proporcionan los datos punto a punto para los Record messages. No todos los streams estarán disponibles para todas las actividades (ej: watts solo para ciclismo con potenciómetro), por lo que el encoder debe ser tolerante a campos ausentes.

### 4. Estructura del archivo FIT generado

**Decisión**: Usar el patrón "summary last" con la siguiente secuencia de mensajes:

1. **File Header** (14 bytes)
2. **File ID message** (type=Activity, manufacturer=Development)
3. **Event message** (timer start)
4. **Record messages** (uno por cada punto de datos del stream)
5. **Event message** (timer stop)
6. **Lap message** (una sola lap cubriendo toda la actividad)
7. **Session message** (resumen de la actividad completa)
8. **Activity message** (con session count=1)
9. **CRC** (2 bytes)

**Rationale**: El patrón "summary last" es el más natural para generar archivos a partir de datos ya existentes y es el patrón recomendado en la documentación de Garmin. Una sola lap simplifica la implementación inicial — el usuario puede tener laps en Strava, pero mapearlas requeriría datos adicionales de la API (endpoint de laps).

### 5. Selección de actividad

**Decisión**: Dos modos de selección:
- **Interactivo**: Listar las últimas N actividades con `@clack/prompts` select y permitir al usuario elegir
- **Directo**: Flag `--id <activity_id>` para uso no interactivo / scripting

**Rationale**: Consistente con el patrón del proyecto de soportar modo interactivo y machine. El modo directo permite automatización y piping.

### 6. Nombre del archivo de salida

**Decisión**: Por defecto `<activity_id>.fit` en el directorio actual. Opcionalmente `--output <path>` para especificar ruta.

**Rationale**: Simple y predecible. El ID es único y evita colisiones. El flag `--output` da control al usuario.

## Risks / Trade-offs

- **[Compatibilidad FIT]** El encoder manual puede generar archivos que no pasen la validación de alguna plataforma específica → Se testeará con FitCSVTool de Garmin y se seguirá estrictamente la especificación del protocolo
- **[Streams incompletos]** No todas las actividades tienen todos los tipos de stream (GPS, HR, etc.) → El encoder maneja campos opcionales y solo escribe los field definitions para los datos disponibles
- **[Precisión de coordenadas]** El formato FIT usa semicircles para coordenadas GPS (sint32, factor 2^31/180) → Se implementará la conversión correcta de grados decimales a semicircles
- **[Tamaño de archivo]** Actividades largas con recording rate alto pueden generar muchos Record messages → No se implementa compresión de timestamp en v1, se usa normal header
- **[Mapeo de sport types]** Strava y FIT usan enumeraciones diferentes para tipos de deporte → Se creará un mapeo básico para los tipos más comunes (Run, Ride, Walk, Hike, Swim)
