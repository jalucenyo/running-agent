## Why

El paquete `@lucenyo/strava-cli` se publica manualmente en npm. Esto es propenso a errores (olvidar publicar, publicar sin lint, versión inconsistente). Configurar un pipeline de GitHub Actions que publique automáticamente cuando la versión cambia en `main` garantiza releases consistentes y firmados con provenance SLSA.

## What Changes

- Crear workflow de GitHub Actions que detecta cambios de versión en `strava-cli/package.json` al hacer push a `main` y ejecuta `npm publish --provenance --access public`
- Añadir campo `"files"` en `package.json` para controlar explícitamente qué se incluye en el paquete npm (`bin/`, `src/`, `README.md`)
- Eliminar directorios legacy vacíos `src/templates/agents/` que no aportan valor al paquete publicado

## Capabilities

### New Capabilities
- `npm-publish-pipeline`: Workflow de GitHub Actions para publicación automática de `@lucenyo/strava-cli` en npm con provenance, disparado por cambio de versión en push a main

### Modified Capabilities

## Impact

- **Código nuevo**: `.github/workflows/publish.yml`
- **Modificado**: `strava-cli/package.json` (campo `files`)
- **Eliminado**: `strava-cli/src/templates/agents/` (directorios vacíos legacy)
- **Dependencias**: Ninguna nueva. Requiere secret `NPM_TOKEN` en GitHub repo settings
- **APIs**: Sin cambios
