# strava-cli

Herramienta de línea de comandos para consultar y analizar tus actividades de entrenamiento desde Strava.

## Requisitos previos

- **Node.js** 18 o superior
- Una aplicación registrada en [Strava Developers](https://www.strava.com/settings/api) para obtener `Client ID` y `Client Secret`

## Instalación

```bash
cd strava-cli
npm install
```

## Configuración

Crea un archivo `.env` en la raíz de `strava-cli/` a partir del ejemplo:

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales de la API de Strava:

```env
STRAVA_CLIENT_ID=tu_client_id
STRAVA_CLIENT_SECRET=tu_client_secret
```

## Autenticación

Antes de usar los comandos, debes autenticarte con Strava mediante OAuth 2.0:

```bash
npm run dev -- login
```

Esto abrirá el navegador para que autorices la aplicación. El token se guardará automáticamente en `~/.config/strava-ai-cli/auth.json`.

## Uso

Todos los comandos se ejecutan desde el directorio `strava-cli/`:

```bash
npm run dev -- <comando> [opciones]
```

### Comandos disponibles

#### `login`

Autentica la CLI con tu cuenta de Strava.

```bash
npm run dev -- login
```

#### `activities list`

Lista tus actividades recientes.

```bash
npm run dev -- activities list
```

**Opciones:**

| Opción | Descripción | Por defecto |
|--------|-------------|-------------|
| `--page <n>` | Número de página | `1` |
| `--per-page <n>` | Actividades por página | `30` |

**Ejemplos:**

```bash
# Listar las últimas 10 actividades
npm run dev -- activities list --per-page 10

# Obtener la segunda página
npm run dev -- activities list --page 2 --per-page 20
```

### Modos de salida

| Flag | Descripción |
|------|-------------|
| *(ninguno)* | Modo interactivo con formato de tabla (requiere TTY) |
| `--json` | Salida en JSON (apto para scripts) |
| `--raw` | Salida en texto plano |
| `--tui` | Forzar modo interactivo aunque la salida esté redirigida |

**Ejemplo con JSON:**

```bash
npm run dev -- activities list --json | jq '.[0].name'
```

### Ayuda

```bash
npm run dev -- --help
npm run dev -- activities --help
```

## Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Ejecuta la CLI cargando variables desde `.env` |
| `npm start` | Ejecuta la CLI sin cargar `.env` |
| `npm run lint` | Comprueba el código con ESLint |
| `npm run format` | Formatea el código con Prettier |

## Estructura del proyecto

```
strava-cli/
├── bin/strava.ts                  # Punto de entrada ejecutable
├── src/
│   ├── index.ts                   # Router principal de comandos
│   ├── types.ts                   # Tipos globales (GlobalFlags, OutputMode…)
│   ├── commands/
│   │   ├── login.ts               # Flujo OAuth2 y almacenamiento de tokens
│   │   └── activities/
│   │       ├── index.ts           # Router del subcomando activities
│   │       └── list.ts            # Listado de actividades
│   ├── schemas/
│   │   ├── strava-activity.ts     # Schema Zod para actividades
│   │   └── strava-auth.ts         # Schemas Zod para autenticación
│   └── utils/
│       ├── auth.ts                # Carga y guardado de tokens
│       └── logger.ts              # Logger adaptado al modo de salida
├── package.json
└── tsconfig.json
```

## Tecnologías

- **TypeScript 5** ejecutado directamente con `tsx` (sin paso de compilación)
- **Node.js fetch** nativo para llamadas HTTP
- **Zod** para validación de respuestas de la API
- **@clack/prompts** para la interfaz interactiva en terminal
- **arg** para el parsing de argumentos CLI
