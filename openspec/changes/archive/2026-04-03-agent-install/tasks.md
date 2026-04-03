## 1. Estructura de templates

- [x] 1.1 Crear directorio `src/templates/agents/claude-code/` con ficheros de agente y skills para Claude Code
- [x] 1.2 Crear directorio `src/templates/agents/github-copilot/` con ficheros de agente y skills para GitHub Copilot (VS Code)
- [x] 1.3 Crear directorio `src/templates/agents/gemini-cli/` con ficheros de agente y skills para Gemini CLI

## 2. Mapa de orquestadores

- [x] 2.1 Crear módulo `src/commands/agent/orchestrators.ts` con el mapa de orquestadores (nombre, label, carpeta de templates, carpeta destino)

## 3. Comando agent install

- [x] 3.1 Crear `src/commands/agent/install.ts` con la lógica de selección interactiva de orquestador usando `@clack/prompts` select
- [x] 3.2 Implementar aceptación de orquestador como argumento posicional para modo máquina (`--json`/`--raw`)
- [x] 3.3 Implementar copia recursiva de templates al directorio destino con `fs/promises` cp
- [x] 3.4 Implementar confirmación de sobrescritura cuando el directorio destino ya existe
- [x] 3.5 Implementar salida a través del logger (spinner interactivo, JSON en modo máquina)

## 4. Router y registro

- [x] 4.1 Crear `src/commands/agent/index.ts` como router de subcomandos de agent (patrón idéntico a `activities/index.ts`)
- [x] 4.2 Registrar comando `agent` en `src/index.ts` (router principal)
