## ADDED Requirements

### Requirement: Comando agent install disponible en el CLI
El sistema SHALL registrar el comando `agent` en el router principal y el subcomando `install` dentro de `agent`, siguiendo el patrón de subcomandos existente.

#### Scenario: Usuario ejecuta strava agent install
- **WHEN** el usuario ejecuta `strava agent install`
- **THEN** el sistema instala la skill `sports-analyst` en el directorio estándar `.agents/skills/sports-analyst` del proyecto actual
- **AND** muestra un mensaje de éxito indicando la carpeta destino

#### Scenario: Usuario ejecuta strava agent sin subcomando
- **WHEN** el usuario ejecuta `strava agent` sin subcomando
- **THEN** el sistema muestra la ayuda del comando agent con los subcomandos disponibles

### Requirement: Copia de skill al directorio estandar de proyecto
El sistema SHALL copiar la skill `sports-analyst` desde `src/templates/skills/sports-analyst/` al directorio `.agents/skills/sports-analyst` en el directorio de trabajo actual.

#### Scenario: Instalación exitosa en destino unificado
- **WHEN** el usuario ejecuta `strava agent install`
- **THEN** el sistema copia el directorio `src/templates/skills/sports-analyst/` a `.agents/skills/sports-analyst` en el cwd
- **AND** el sistema no requiere selección de orquestador

### Requirement: Confirmación antes de sobrescribir
El sistema SHALL solicitar confirmación al usuario si el directorio destino de la skill ya existe antes de sobrescribir.

#### Scenario: Directorio destino ya existe con contenido
- **WHEN** el directorio `.agents/skills/sports-analyst` ya existe y contiene ficheros
- **THEN** el sistema muestra una confirmación preguntando si desea sobrescribir
- **AND** si el usuario confirma, se sobrescriben los ficheros
- **AND** si el usuario cancela, el sistema termina sin realizar cambios

#### Scenario: Directorio destino no existe
- **WHEN** el directorio `.agents/skills/sports-analyst` no existe
- **THEN** el sistema crea el directorio y copia los templates sin solicitar confirmación

### Requirement: Skill canonica unica en templates
El proyecto MUST mantener una fuente unica de verdad de la skill en `src/templates/skills/sports-analyst/`, sin requerir directorios de templates por cliente.

#### Scenario: Estructura de templates presente
- **WHEN** se comprueba la estructura de templates
- **THEN** existe el directorio `src/templates/skills/sports-analyst/` con `SKILL.md`
- **AND** no es obligatorio mantener `src/templates/agents/<cliente>/`

### Requirement: Compatibilidad multicliente via ruta estandar
El sistema SHALL usar `.agents/skills/` como ruta de instalacion por defecto para maximizar compatibilidad entre clientes que soportan Agent Skills.

#### Scenario: Cliente compatible con alias .agents
- **WHEN** un cliente soporta descubrimiento de skills en `.agents/skills/`
- **THEN** la skill instalada por `strava agent install` es descubrible sin pasos adicionales

### Requirement: Salida a través del logger
Toda la salida al usuario MUST pasar por el logger del proyecto (`createLogger`), respetando los modos interactivo, JSON y raw.

#### Scenario: Salida en modo JSON
- **WHEN** el usuario ejecuta `strava agent install --json`
- **THEN** el sistema emite un objeto JSON con el resultado de la instalación incluyendo `destination`

#### Scenario: Salida en modo interactivo
- **WHEN** el usuario ejecuta `strava agent install` en modo interactivo
- **THEN** el sistema usa spinner y mensajes de `@clack/prompts` para mostrar progreso y resultado
