## MODIFIED Requirements

### Requirement: Copia de templates al directorio destino
El sistema SHALL copiar la skill `sports-analyst` desde `src/templates/skills/sports-analyst/` al directorio destino correspondiente del orquestador seleccionado, como un directorio completo en vez de ficheros `.agent.md` individuales.

#### Scenario: Instalación exitosa de skill para Claude Code
- **WHEN** el usuario selecciona "Claude Code" como orquestador
- **THEN** el sistema copia el directorio `src/templates/skills/sports-analyst/` a `.claude/skills/sports-analyst/` en el cwd
- **AND** el sistema muestra un mensaje de éxito indicando la carpeta destino

#### Scenario: Instalación exitosa de skill para GitHub Copilot
- **WHEN** el usuario selecciona "GitHub Copilot (VS Code)" como orquestador
- **THEN** el sistema copia el directorio `src/templates/skills/sports-analyst/` a `.github/skills/sports-analyst/` en el cwd
- **AND** el sistema muestra un mensaje de éxito indicando la carpeta destino

#### Scenario: Instalación exitosa de skill para Gemini CLI
- **WHEN** el usuario selecciona "Gemini CLI" como orquestador
- **THEN** el sistema copia el directorio `src/templates/skills/sports-analyst/` a `.gemini/skills/sports-analyst/` en el cwd
- **AND** el sistema muestra un mensaje de éxito indicando la carpeta destino

#### Scenario: Sobrescritura de instalación existente (interactivo)
- **WHEN** el directorio destino de la skill ya existe y el usuario está en modo interactivo
- **THEN** el sistema pregunta si desea sobrescribir
- **AND** procede solo si el usuario confirma

#### Scenario: Selección de orquestador en modo interactivo
- **WHEN** el usuario ejecuta `strava agent install` en una terminal interactiva
- **THEN** el sistema muestra un selector con las opciones: Claude Code, GitHub Copilot (VS Code), Gemini CLI
- **AND** el usuario puede seleccionar exactamente un orquestador

#### Scenario: Selección de orquestador en modo máquina
- **WHEN** el usuario ejecuta `strava agent install <orchestrator>` con `--json` o `--raw`
- **THEN** el sistema usa el argumento posicional como selección de orquestador sin mostrar el selector interactivo
