## 1. Preparación del paquete npm

- [x] 1.1 Añadir campo `"files": ["bin/", "src/", "README.md"]` en `strava-cli/package.json`
- [x] 1.2 Eliminar directorios vacíos legacy `strava-cli/src/templates/agents/`
- [x] 1.3 Verificar contenido del paquete con `npm pack --dry-run` en `strava-cli/`

## 2. GitHub Actions workflow

- [x] 2.1 Crear `.github/workflows/publish.yml` con trigger `push` a `main`
- [x] 2.2 Configurar step de checkout y setup Node.js 18+
- [x] 2.3 Implementar detección de cambio de versión comparando `package.json` vs `npm view`
- [x] 2.4 Implementar step de `npm ci` con `working-directory: strava-cli`
- [x] 2.5 Implementar step de `npm publish --provenance --access public` condicionado al cambio de versión
- [x] 2.6 Configurar permisos `id-token: write` y `contents: read` para provenance SLSA

## 3. Validación

- [x] 3.1 Verificar que el workflow YAML es válido (lint)
- [x] 3.2 Documentar requisito de secret `NPM_TOKEN` en el repo de GitHub
