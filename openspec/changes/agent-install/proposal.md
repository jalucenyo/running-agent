## Why

El CLI de Strava actualmente no ofrece forma de instalar agentes AI ni skills en los distintos orquestadores que un usuario puede usar (Claude Code, GitHub CLI, VS Code GitHub Copilot, Gemini CLI). Para que el proyecto sea extensible mediante agentes inteligentes, se necesita un comando que permita seleccionar un orquestador y copiar los templates de agente y skills en la carpeta específica que cada orquestador utiliza.

## What Changes

- Nuevo comando `agent install` que presenta una lista interactiva de orquestadores soportados.
- El usuario selecciona un orquestador de la lista (Claude Code, GitHub CLI, VS Code GitHub Copilot, Gemini CLI).
- Se copian los templates de agente y skills a la carpeta destino específica del orquestador seleccionado.
- Se incluye un directorio de templates embebidos en el proyecto (`src/templates/agents/`) con la definición del agente y skills para cada orquestador.
- Nuevo subcomando router `agent` con su `index.ts` siguiendo el patrón existente de `activities`.

## Capabilities

### New Capabilities
- `agent-install`: Comando interactivo para instalar agentes y skills en el orquestador AI seleccionado por el usuario.

### Modified Capabilities

## Impact

- **Código nuevo**: `src/commands/agent/index.ts` (router), `src/commands/agent/install.ts` (implementación), `src/templates/agents/` (templates por orquestador).
- **Código modificado**: `src/index.ts` (registrar comando `agent` en el router principal).
- **Dependencias**: No se añaden dependencias nuevas. Se usa `@clack/prompts` (ya existente) para la selección interactiva y `fs/promises` nativo para copiar ficheros.
- **Sistema de ficheros**: El comando escribirá ficheros en carpetas externas al proyecto (ej. `~/.claude/`, `.github/`, `.vscode/`, etc.) según el orquestador elegido.
