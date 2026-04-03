## Context

El CLI de Strava (`strava-cli/`) es una herramienta de línea de comandos escrita en TypeScript que se ejecuta con `tsx`. Actualmente tiene comandos para `login`, `activities` y `test`. Los comandos se registran en `src/index.ts` y los subcomandos siguen el patrón de directorio con `index.ts` como router (ver `commands/activities/`).

El proyecto necesita soportar la instalación de agentes AI con skills en distintos orquestadores. Cada orquestador almacena su configuración de agentes en una ubicación diferente del sistema de ficheros.

## Goals / Non-Goals

**Goals:**
- Permitir al usuario instalar un agente con skills desde el CLI seleccionando un orquestador de forma interactiva.
- Soportar al menos estos orquestadores: Claude Code, GitHub Copilot (VS Code), Gemini CLI.
- Copiar templates de agente y skills específicos para cada orquestador a su carpeta destino.
- Seguir las convenciones existentes del proyecto (ESM, `@clack/prompts`, logger, `arg`).

**Non-Goals:**
- No se implementará actualización ni desinstalación de agentes (solo instalación).
- No se gestionarán configuraciones de API keys ni credenciales de los orquestadores.
- No se validará si el orquestador está instalado en el sistema.
- No se soportará la personalización de templates por el usuario.

## Decisions

### 1. Estructura de comandos: `agent install` como subcommand

Se crea `src/commands/agent/index.ts` como router y `src/commands/agent/install.ts` como implementación, siguiendo el mismo patrón que `activities/`.

**Alternativa descartada**: Comando plano `install-agent` — rompe la consistencia con el patrón de subcomandos existente.

### 2. Templates embebidos en el proyecto

Los templates se almacenan en `src/templates/agents/<orchestrator>/` dentro del proyecto. Cada directorio de orquestador contiene los ficheros que se copiarán.

**Alternativa descartada**: Descargar templates de un repositorio remoto — añade complejidad de red y dependencia externa innecesaria para esta fase.

### 3. Mapa de orquestadores con rutas destino

Se define un mapa estático con la configuración de cada orquestador:

| Orquestador | Carpeta destino |
|---|---|
| Claude Code | `.claude/` en el directorio de trabajo actual |
| GitHub Copilot (VS Code) | `.github/` en el directorio de trabajo actual |
| Gemini CLI | `.gemini/` en el directorio de trabajo actual |

**Rationale**: Cada orquestador tiene una convención propia para la ubicación de ficheros de agente. Se usan rutas relativas al directorio de trabajo actual (cwd) ya que el usuario típicamente ejecuta el CLI desde la raíz de su proyecto.

### 4. Selección interactiva con `@clack/prompts`

Se usa `select` de `@clack/prompts` para mostrar la lista de orquestadores disponibles. En modo `--json`/`--raw`, se acepta el orquestador como argumento posicional.

### 5. Copia de ficheros con `fs/promises`

Se usa `cp` recursivo de `fs/promises` (Node.js 18+) para copiar el directorio de templates al destino. No se necesitan dependencias adicionales.

## Risks / Trade-offs

- **[Sobrescritura de ficheros existentes]** → Se mostrará confirmación antes de sobrescribir si el directorio destino ya existe.
- **[Rutas destino pueden cambiar]** → El mapa de orquestadores es fácilmente modificable al estar centralizado en un solo lugar.
- **[Templates desactualizados]** → Al estar embebidos en el proyecto, se actualizan con cada release del CLI.
