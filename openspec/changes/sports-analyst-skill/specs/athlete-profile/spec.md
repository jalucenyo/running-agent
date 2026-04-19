## ADDED Requirements

### Requirement: Comando profile disponible en el CLI
El sistema SHALL registrar el comando `profile` en el router principal de `src/index.ts`, siguiendo el patrón de comandos existente.

#### Scenario: Usuario ejecuta strava profile sin perfil configurado
- **WHEN** el usuario ejecuta `strava profile` y no existe `~/.config/strava-ai-cli/profile.json`
- **THEN** el sistema muestra un mensaje indicando que no hay perfil configurado
- **AND** sugiere ejecutar `strava profile set` para configurarlo

#### Scenario: Usuario ejecuta strava profile con perfil existente
- **WHEN** el usuario ejecuta `strava profile` y existe un perfil válido
- **THEN** el sistema muestra los datos del perfil en formato legible (edad, sexo, peso, altura)

#### Scenario: Usuario ejecuta strava profile --json
- **WHEN** el usuario ejecuta `strava profile --json` y existe un perfil válido
- **THEN** el sistema imprime el perfil como JSON a stdout

#### Scenario: Usuario ejecuta strava profile --json sin perfil
- **WHEN** el usuario ejecuta `strava profile --json` y no existe perfil
- **THEN** el sistema imprime un JSON vacío `{}` a stdout y termina con código 0

### Requirement: Flujo interactivo de configuración de perfil
El sistema SHALL permitir configurar el perfil del atleta con `strava profile set` usando `@clack/prompts` en modo interactivo.

#### Scenario: Configuración interactiva completa
- **WHEN** el usuario ejecuta `strava profile set` en una terminal interactiva
- **THEN** el sistema pregunta secuencialmente: edad, sexo, peso (kg) y altura (cm)
- **AND** guarda el perfil en `~/.config/strava-ai-cli/profile.json`
- **AND** muestra un resumen del perfil configurado

#### Scenario: Cancelación durante configuración
- **WHEN** el usuario cancela (Ctrl+C) durante cualquier pregunta del flujo interactivo
- **THEN** el sistema termina con código 0 sin guardar cambios

### Requirement: Configuración de perfil en modo máquina
El sistema SHALL permitir configurar el perfil con flags en modo no interactivo.

#### Scenario: Configuración completa con flags
- **WHEN** el usuario ejecuta `strava profile set --age 35 --sex male --weight 72 --height 178`
- **THEN** el sistema guarda el perfil sin mostrar prompts interactivos
- **AND** muestra confirmación del perfil guardado

#### Scenario: Flags parciales en modo máquina
- **WHEN** el usuario ejecuta `strava profile set` con flags incompletas (ej: solo `--age 35`)
- **THEN** el sistema muestra error indicando que todos los campos son obligatorios en modo máquina
- **AND** termina con código 1

### Requirement: Validación del perfil con Zod
El sistema SHALL validar todos los campos del perfil con un schema Zod antes de guardarlos.

#### Scenario: Edad fuera de rango
- **WHEN** el usuario introduce una edad menor a 10 o mayor a 100
- **THEN** el sistema muestra error de validación y no guarda el perfil

#### Scenario: Sexo con valor inválido
- **WHEN** el usuario introduce un valor de sexo distinto de "male" o "female"
- **THEN** el sistema muestra error de validación y no guarda el perfil

#### Scenario: Peso fuera de rango
- **WHEN** el usuario introduce un peso menor a 30 o mayor a 200 (kg)
- **THEN** el sistema muestra error de validación y no guarda el perfil

#### Scenario: Altura fuera de rango
- **WHEN** el usuario introduce una altura menor a 100 o mayor a 250 (cm)
- **THEN** el sistema muestra error de validación y no guarda el perfil

### Requirement: Persistencia del perfil en disco
El sistema SHALL almacenar el perfil en `~/.config/strava-ai-cli/profile.json` con permisos `0o600`.

#### Scenario: Guardado de perfil nuevo
- **WHEN** el usuario completa la configuración del perfil
- **THEN** el sistema escribe el fichero `profile.json` en el directorio de configuración
- **AND** el fichero tiene permisos `0o600`

#### Scenario: Sobrescritura de perfil existente
- **WHEN** el usuario ejecuta `strava profile set` y ya existe un perfil
- **THEN** el sistema sobrescribe el perfil anterior con los nuevos datos sin pedir confirmación

#### Scenario: Lectura de perfil por la CLI
- **WHEN** cualquier comando necesita leer el perfil
- **THEN** el sistema valida el contenido con el schema Zod al leer
- **AND** devuelve `null` si el fichero no existe o no es válido
