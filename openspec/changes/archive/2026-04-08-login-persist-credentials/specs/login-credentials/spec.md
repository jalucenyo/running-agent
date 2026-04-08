## ADDED Requirements

### Requirement: Persistencia de credenciales de aplicación
El sistema SHALL persistir las credenciales de aplicación Strava (`client_id`, `client_secret`) en `~/.config/strava-ai-cli/config.json` con permisos `0600`.

#### Scenario: Guardar credenciales tras prompt interactivo
- **WHEN** el usuario introduce `client_id` y `client_secret` por prompt interactivo
- **THEN** el sistema guarda ambos valores en `~/.config/strava-ai-cli/config.json` con permisos `0600`

#### Scenario: Leer credenciales desde config.json
- **WHEN** el usuario ejecuta `strava login` y existe `config.json` con credenciales válidas
- **THEN** el sistema usa las credenciales del fichero sin solicitar entrada al usuario

#### Scenario: Config corrupto o inválido
- **WHEN** `config.json` existe pero no pasa la validación Zod
- **THEN** el sistema lo trata como si no existiera y continúa con la siguiente fuente de la cascada

### Requirement: Cascada de resolución de credenciales
El sistema SHALL resolver `client_id` y `client_secret` siguiendo el orden: variables de entorno → `config.json` → prompt interactivo.

#### Scenario: Variables de entorno presentes
- **WHEN** `STRAVA_CLIENT_ID` y `STRAVA_CLIENT_SECRET` están definidas como variables de entorno
- **THEN** el sistema usa esos valores sin consultar `config.json` ni mostrar prompts

#### Scenario: Variables de entorno parciales
- **WHEN** solo una de las dos variables de entorno está definida
- **THEN** el sistema ignora la parcial y continúa con `config.json` o prompt interactivo

#### Scenario: Sin env vars pero con config.json
- **WHEN** no hay variables de entorno pero `config.json` contiene credenciales válidas
- **THEN** el sistema usa las credenciales de `config.json`

#### Scenario: Sin env vars ni config.json en modo interactive
- **WHEN** no hay variables de entorno, no hay `config.json`, y el modo es interactive (TTY)
- **THEN** el sistema muestra un prompt solicitando `client_id` y `client_secret`
- **AND** guarda las credenciales en `config.json`

#### Scenario: Sin credenciales en modo machine
- **WHEN** no hay variables de entorno, no hay `config.json`, y el modo es machine (`--json`/`--raw`)
- **THEN** el sistema emite un error descriptivo y termina con código de salida 1

### Requirement: Prompt interactivo de credenciales
El sistema SHALL solicitar las credenciales mediante prompts interactivos cuando no haya otra fuente disponible, guiando al usuario sobre cómo obtenerlas.

#### Scenario: Primera ejecución sin credenciales
- **WHEN** el usuario ejecuta `strava login` por primera vez sin env vars ni config
- **THEN** el sistema muestra un mensaje indicando que se necesita crear una app en `https://www.strava.com/settings/api`
- **AND** solicita `Client ID` y `Client Secret` por prompt

#### Scenario: Usuario cancela el prompt
- **WHEN** el usuario cancela la entrada durante el prompt interactivo (Ctrl+C o similar)
- **THEN** el sistema termina sin error de crash, con mensaje de cancelación

### Requirement: Validación de config con Zod
El sistema SHALL validar el contenido de `config.json` con un schema Zod que requiera `client_id` (string) y `client_secret` (string).

#### Scenario: Schema válido
- **WHEN** `config.json` contiene `{"client_id": "12345", "client_secret": "abc..."}`
- **THEN** la validación pasa y se retornan los valores tipados

#### Scenario: Campo faltante
- **WHEN** `config.json` contiene `{"client_id": "12345"}` sin `client_secret`
- **THEN** la validación falla y `loadConfig()` retorna `null`
