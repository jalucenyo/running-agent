## ADDED Requirements

### Requirement: Publicación automática en push a main
El workflow de GitHub Actions SHALL ejecutar `npm publish` automáticamente cuando se detecte un cambio de versión en `strava-cli/package.json` en un push a la rama `main`.

#### Scenario: Versión cambia en push a main
- **WHEN** se hace push a `main` con una versión en `strava-cli/package.json` diferente a la publicada en npm
- **THEN** el workflow ejecuta `npm publish --provenance --access public` desde `strava-cli/`

#### Scenario: Versión no cambia en push a main
- **WHEN** se hace push a `main` sin cambiar la versión en `strava-cli/package.json`
- **THEN** el workflow se salta el step de publish

#### Scenario: Publish falla por token inválido
- **WHEN** el token `NPM_TOKEN` no es válido o no está configurado
- **THEN** el workflow MUST fallar con código de error y mensaje claro en los logs

### Requirement: Detección de cambio de versión
El workflow SHALL comparar la versión local de `strava-cli/package.json` contra la versión publicada en npm usando `npm view`.

#### Scenario: Paquete existe en npm
- **WHEN** `npm view @lucenyo/strava-cli version` devuelve una versión
- **THEN** el workflow compara esa versión con la de `package.json` para decidir si publicar

#### Scenario: Primera publicación (paquete no existe)
- **WHEN** `npm view @lucenyo/strava-cli version` falla porque el paquete no existe
- **THEN** el workflow MUST proceder con la publicación

### Requirement: Provenance SLSA
El paquete publicado SHALL incluir firma de provenance SLSA mediante el flag `--provenance`.

#### Scenario: Paquete publicado con provenance
- **WHEN** el workflow publica exitosamente
- **THEN** el paquete en npmjs.com MUST mostrar la información de provenance vinculada al commit y workflow de GitHub Actions

### Requirement: Control de ficheros en paquete npm
El campo `files` en `strava-cli/package.json` SHALL incluir exactamente `["bin/", "src/", "README.md"]`.

#### Scenario: Paquete contiene solo ficheros declarados
- **WHEN** se ejecuta `npm pack` en `strava-cli/`
- **THEN** el tarball MUST contener únicamente `bin/`, `src/`, `README.md` y `package.json` (incluido automáticamente)

#### Scenario: Templates incluidos en el paquete
- **WHEN** se publica el paquete
- **THEN** `src/templates/skills/sports-analyst/` MUST estar incluido en el paquete (necesario para `agent install`)
