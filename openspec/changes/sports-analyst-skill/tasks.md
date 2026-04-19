## 1. Perfil del atleta — Schema y persistencia

- [ ] 1.1 Crear schema Zod del perfil en `src/schemas/strava-profile.ts` (age, sex, weight, height con validaciones de rango)
- [ ] 1.2 Añadir funciones `saveProfile()` y `loadProfile()` en `src/utils/auth.ts` usando `~/.config/strava-ai-cli/profile.json` con permisos `0o600`

## 2. Comando `strava profile`

- [ ] 2.1 Crear `src/commands/profile.ts` con subcomandos: show (default), set
- [ ] 2.2 Implementar `profile show` — muestra perfil actual o indica que no existe; soporta `--json`
- [ ] 2.3 Implementar `profile set` interactivo — flujo con `@clack/prompts` (age, sex, weight, height)
- [ ] 2.4 Implementar `profile set` modo máquina — flags `--age`, `--sex`, `--weight`, `--height`
- [ ] 2.5 Registrar comando `profile` en el router principal `src/index.ts`

## 3. Skill sports-analyst

- [ ] 3.1 Crear directorio `src/templates/skills/sports-analyst/` con `SKILL.md` (frontmatter Agent Skills + instrucciones del analista)
- [ ] 3.2 Crear `src/templates/skills/sports-analyst/references/training-zones.md` con tablas de zonas FC y fórmulas
- [ ] 3.3 Integrar lectura de perfil en las instrucciones de la skill (ejecutar `profile --json` al inicio del análisis)

## 4. Evolución de `strava agent install`

- [ ] 4.1 Actualizar `orchestrators.ts` — cambiar `templateDir` y `destDir` para apuntar a `src/templates/skills/sports-analyst/` y destinos `<orch>/skills/sports-analyst/`
- [ ] 4.2 Actualizar `install.ts` — copiar directorio de skill en vez de directorio de agente
- [ ] 4.3 Eliminar templates obsoletos: `src/templates/agents/*/agents/sports-analyst.agent.md` (3 ficheros)

## 5. Limpieza y verificación

- [ ] 5.1 Actualizar help text del comando `agent` para reflejar que instala skills
- [ ] 5.2 Verificar que `npm run lint` pasa sin errores
- [ ] 5.3 Verificar que `strava profile set` + `strava profile --json` funciona end-to-end
- [ ] 5.4 Verificar que `strava agent install` copia la skill correctamente para cada orquestador
