## Context

`@lucenyo/strava-cli` es un paquete npm scoped publicado manualmente (v0.0.1). El proyecto usa tsx para ejecutar TypeScript directamente — sin paso de compilación. El código fuente vive en `strava-cli/` dentro de un monorepo que también contiene `openspec/` y otros artefactos. La publicación manual actual no tiene validación previa ni firma de procedencia.

## Goals / Non-Goals

**Goals:**
- Publicar automáticamente a npm cuando la versión en `package.json` cambia en un push a `main`
- Firmar el paquete con provenance SLSA (vincula build al commit exacto)
- Controlar explícitamente qué ficheros van al paquete npm
- Eliminar artefactos legacy que ensucian el paquete

**Non-Goals:**
- Versionado automático (se mantiene `npm version` manual)
- Paso de compilación TypeScript → JavaScript (se sigue publicando TS + tsx)
- Tests en el pipeline (no hay framework de tests configurado aún)
- Publicar a registros alternativos (solo npmjs.com)

## Decisions

### D1: Detección de cambio de versión

El workflow compara la versión en `package.json` contra la última publicada en npm usando `npm view @lucenyo/strava-cli version`. Si son iguales, el job de publish se salta.

**Alternativa descartada**: Trigger basado en tags de git (`v*`). Añade un paso manual extra (`git tag`) sin valor — la versión ya está en `package.json` y es la fuente de verdad.

**Alternativa descartada**: Trigger por cambio en `package.json` vía `paths` filter. Detectaría cambios en cualquier campo de `package.json`, no solo en versión. La comparación con npm es más precisa.

### D2: Provenance SLSA

Se usa `--provenance` en `npm publish`, que requiere `id-token: write` en los permisos del workflow. Esto genera un certificado Sigstore que vincula el paquete al commit y workflow exacto. Aparece como badge verificado en npmjs.com.

### D3: Campo `files` en package.json

Se añade:
```json
"files": ["bin/", "src/", "README.md"]
```

Esto incluye `src/templates/` (necesario para `agent install`) y excluye `.env`, `eslint.config.js`, `tsconfig.json`, y otros ficheros de desarrollo.

### D4: Working directory

El workflow usa `working-directory: strava-cli` en todos los steps relevantes, ya que `package.json` no está en la raíz del repo.

### D5: Limpieza de templates legacy

Se eliminan los directorios vacíos `src/templates/agents/{claude-code,github-copilot,gemini-cli}/agents/` y el directorio padre `src/templates/agents/`. Estos quedaron como residuo del cambio a instalación unificada en `.agents/skills/`.

## Risks / Trade-offs

- **[NPM_TOKEN expira]** → El token de automation de npm no expira por defecto, pero si se revoca el publish falla silenciosamente. Mitigation: el workflow falla con error claro si `npm publish` devuelve código de error.
- **[Publish sin tests]** → No hay tests automatizados aún. Mitigation: el pipeline está preparado para añadir un step de test cuando exista vitest. Por ahora, lint no es gate bloqueante (decisión del usuario).
- **[Primera publicación tras 404]** → `npm view` falla si el paquete no existe aún. Ya existe v0.0.1 publicada, así que no aplica. Si se borrara el paquete, el step de comparación necesitaría fallback.
