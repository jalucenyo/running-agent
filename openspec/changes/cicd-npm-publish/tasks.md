## 1. Preparación del paquete npm

- [ ] 1.1 Añadir campo `"files": ["bin/", "src/", "README.md"]` en `strava-cli/package.json`
- [ ] 1.2 Eliminar directorios vacíos legacy `strava-cli/src/templates/agents/`
- [ ] 1.3 Verificar contenido del paquete con `npm pack --dry-run` en `strava-cli/`

## 2. GitHub Actions workflow

- [ ] 2.1 Crear `.github/workflows/publish.yml` con trigger `push` a `main`
- [ ] 2.2 Configurar step de checkout y setup Node.js 18+
- [ ] 2.3 Implementar detección de cambio de versión comparando `package.json` vs `npm view`
- [ ] 2.4 Implementar step de `npm ci` con `working-directory: strava-cli`
- [ ] 2.5 Implementar step de `npm publish --provenance --access public` condicionado al cambio de versión
- [ ] 2.6 Configurar permisos `id-token: write` y `contents: read` para provenance SLSA

## 3. Validación

- [ ] 3.1 Verificar que el workflow YAML es válido (lint)
- [ ] 3.2 Documentar requisito de secret `NPM_TOKEN` en el repo de GitHub
