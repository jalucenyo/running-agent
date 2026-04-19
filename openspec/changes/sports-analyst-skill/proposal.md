## Why

El agente sports-analyst existe como tres copias idénticas de un `.agent.md` por orquestador (Copilot, Claude Code, Gemini). Se instala con `strava agent install`, que simplemente copia templates. Este modelo tiene problemas: no es portable al ecosistema abierto de Agent Skills, no aprovecha progressive disclosure, y no tiene contexto del usuario (edad, sexo, peso, altura) para personalizar el análisis deportivo.

Convertirlo a una **Agent Skill** estándar permite distribución universal (`npx skills add`), descubrimiento automático por cualquier agente compatible, y abre la puerta a análisis personalizados con el perfil del atleta.

## What Changes

- Crear una skill `sports-analyst` en formato Agent Skills estándar (`SKILL.md` + references)
- Añadir comando CLI `strava profile` para gestionar el perfil del atleta (edad, sexo, peso, altura)
- Almacenar el perfil en `~/.config/strava-ai-cli/profile.json` junto a los tokens de auth existentes
- La skill lee el perfil vía `npx @lucenyo/strava-cli profile --json` e incorpora datos al análisis
- Evolucionar `strava agent install` para copiar la skill al directorio apropiado del orquestador
- Eliminar los tres ficheros `.agent.md` duplicados de templates y reemplazarlos con la skill unificada

## Capabilities

### New Capabilities
- `athlete-profile`: Gestión del perfil del atleta (edad, sexo, peso, altura) con persistencia en disco y exposición vía CLI
- `sports-analyst-skill`: Skill de análisis deportivo en formato Agent Skills estándar, con análisis personalizado basado en el perfil del atleta

### Modified Capabilities
- `agent-install`: El comando evoluciona para copiar la skill unificada al directorio del orquestador en vez de copiar templates `.agent.md` duplicados

## Impact

- **Código nuevo**: `src/commands/profile.ts` (comando CLI), actualización de `src/utils/auth.ts` para leer/escribir perfil
- **Skill nueva**: `skills/sports-analyst/SKILL.md` + ficheros de referencia
- **Templates eliminados**: `src/templates/agents/*/agents/sports-analyst.agent.md` (3 ficheros)
- **Templates nuevos**: La skill se copia como directorio en vez de fichero suelto
- **Dependencias**: Sin nuevas dependencias npm
- **APIs**: Ningún cambio en la API de Strava. El perfil es local, no se sincroniza con Strava
