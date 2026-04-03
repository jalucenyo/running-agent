## ADDED Requirements

### Requirement: Comando agent install disponible en el CLI
El sistema SHALL registrar el comando `agent` en el router principal y el subcomando `install` dentro de `agent`, siguiendo el patrón de subcomandos existente.

#### Scenario: Usuario ejecuta strava agent install
- **WHEN** el usuario ejecuta `strava agent install`
- **THEN** el sistema muestra una lista interactiva de orquestadores disponibles para seleccionar

#### Scenario: Usuario ejecuta strava agent sin subcomando
- **WHEN** el usuario ejecuta `strava agent` sin subcomando
- **THEN** el sistema muestra la ayuda del comando agent con los subcomandos disponibles

### Requirement: Selección interactiva de orquestador
El sistema SHALL presentar una lista de orquestadores soportados usando `@clack/prompts` select. Los orquestadores disponibles MUST ser: Claude Code, GitHub Copilot (VS Code) y Gemini CLI.

#### Scenario: Selección de orquestador en modo interactivo
- **WHEN** el usuario ejecuta `strava agent install` en una terminal interactiva
- **THEN** el sistema muestra un selector con las opciones: Claude Code, GitHub Copilot (VS Code), Gemini CLI
- **AND** el usuario puede seleccionar exactamente un orquestador

#### Scenario: Selección de orquestador en modo máquina
- **WHEN** el usuario ejecuta `strava agent install <orchestrator>` con `--json` o `--raw`
- **THEN** el sistema usa el argumento posicional como selección de orquestador sin mostrar el selector interactivo

#### Scenario: Cancelación de selección
- **WHEN** el usuario cancela la selección interactiva (Ctrl+C o ESC)
- **THEN** el sistema termina con código de salida 0 sin realizar cambios

### Requirement: Copia de templates al directorio destino
El sistema SHALL copiar los ficheros de template del orquestador seleccionado desde `src/templates/agents/<orchestrator>/` al directorio destino correspondiente en el directorio de trabajo actual.

#### Scenario: Instalación exitosa de agente para Claude Code
- **WHEN** el usuario selecciona "Claude Code" como orquestador
- **THEN** el sistema copia los templates desde `src/templates/agents/claude-code/` al directorio `.claude/` en el cwd
- **AND** el sistema muestra un mensaje de éxito indicando la carpeta destino

#### Scenario: Instalación exitosa de agente para GitHub Copilot
- **WHEN** el usuario selecciona "GitHub Copilot (VS Code)" como orquestador
- **THEN** el sistema copia los templates desde `src/templates/agents/github-copilot/` al directorio `.github/` en el cwd
- **AND** el sistema muestra un mensaje de éxito indicando la carpeta destino

#### Scenario: Instalación exitosa de agente para Gemini CLI
- **WHEN** el usuario selecciona "Gemini CLI" como orquestador
- **THEN** el sistema copia los templates desde `src/templates/agents/gemini-cli/` al directorio `.gemini/` en el cwd
- **AND** el sistema muestra un mensaje de éxito indicando la carpeta destino

### Requirement: Confirmación antes de sobrescribir
El sistema SHALL solicitar confirmación al usuario si el directorio destino ya contiene ficheros de agente antes de sobrescribir.

#### Scenario: Directorio destino ya existe con contenido
- **WHEN** el usuario selecciona un orquestador cuyo directorio destino ya existe y contiene ficheros
- **THEN** el sistema muestra una confirmación preguntando si desea sobrescribir
- **AND** si el usuario confirma, se sobrescriben los ficheros
- **AND** si el usuario cancela, el sistema termina sin realizar cambios

#### Scenario: Directorio destino no existe
- **WHEN** el usuario selecciona un orquestador cuyo directorio destino no existe
- **THEN** el sistema crea el directorio y copia los templates sin solicitar confirmación

### Requirement: Templates embebidos por orquestador
El proyecto MUST incluir un directorio `src/templates/agents/` con subdirectorios para cada orquestador soportado, conteniendo los ficheros de agente y skills que se copiarán.

#### Scenario: Estructura de templates presente
- **WHEN** se comprueba el directorio `src/templates/agents/`
- **THEN** MUST existir subdirectorios: `claude-code/`, `github-copilot/`, `gemini-cli/`
- **AND** cada subdirectorio MUST contener al menos un fichero de definición de agente

### Requirement: Salida a través del logger
Toda la salida al usuario MUST pasar por el logger del proyecto (`createLogger`), respetando los modos interactivo, JSON y raw.

#### Scenario: Salida en modo JSON
- **WHEN** el usuario ejecuta `strava agent install --json` y selecciona un orquestador
- **THEN** el sistema emite un objeto JSON con el resultado de la instalación incluyendo `orchestrator` y `destination`

#### Scenario: Salida en modo interactivo
- **WHEN** el usuario ejecuta `strava agent install` en modo interactivo
- **THEN** el sistema usa spinner y mensajes de `@clack/prompts` para mostrar progreso y resultado
