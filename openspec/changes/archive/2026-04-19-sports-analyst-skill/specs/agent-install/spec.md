## MODIFIED Requirements

### Requirement: Copia de skill al directorio estandar .agents
El sistema SHALL copiar la skill `sports-analyst` desde `src/templates/skills/sports-analyst/` al directorio `.agents/skills/sports-analyst/` del proyecto actual.

#### Scenario: Instalación exitosa en destino unificado
- **WHEN** el usuario ejecuta `strava agent install`
- **THEN** el sistema copia el directorio `src/templates/skills/sports-analyst/` a `.agents/skills/sports-analyst/` en el cwd
- **AND** el sistema muestra un mensaje de éxito indicando la carpeta destino
- **AND** no requiere seleccionar orquestador

#### Scenario: Sobrescritura de instalación existente (interactivo)
- **WHEN** el directorio destino de la skill ya existe y el usuario está en modo interactivo
- **THEN** el sistema pregunta si desea sobrescribir
- **AND** procede solo si el usuario confirma
