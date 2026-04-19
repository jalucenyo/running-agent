## Context

El sports-analyst es un agente `.agent.md` que se instala con `strava agent install`, copiando uno de tres templates idénticos al directorio del orquestador. El contenido es puramente instrucciones en Markdown sin estructura estandarizada. No tiene acceso al perfil del atleta — todos los análisis son genéricos.

El ecosistema Agent Skills (agentskills.io) define un formato abierto y portable: una carpeta con `SKILL.md` (frontmatter YAML + instrucciones) que cualquier agente compatible puede descubrir y activar automáticamente. La CLI ya usa `~/.config/strava-ai-cli/` para persistir tokens de auth.

## Goals / Non-Goals

**Goals:**
- Skill `sports-analyst` en formato Agent Skills estándar, portable a cualquier agente compatible
- Comando `strava profile` para gestionar perfil del atleta con persistencia local
- La skill personaliza el análisis usando el perfil (zonas FC, riesgo por edad, calorías ajustadas)
- `strava agent install` evoluciona para copiar la skill al directorio correcto del orquestador
- Una sola fuente de verdad para las instrucciones del analista (eliminar templates duplicados)

**Non-Goals:**
- Publicar la skill en un registro externo (skills.sh) — eso es futuro
- Sincronizar el perfil con la API de Strava (el perfil es local)
- Soporte de múltiples perfiles o perfiles por deporte
- Añadir tests automatizados en este cambio
- Migración automática de instalaciones previas del agente

## Decisions

### D1: Estructura de la skill

La skill vive en `strava-cli/src/templates/skills/sports-analyst/` y contiene:

```
sports-analyst/
├── SKILL.md                    # Instrucciones principales + frontmatter
└── references/
    └── training-zones.md       # Zonas de FC y ritmo por perfil
```

**Alternativa descartada**: Directorio `skills/` en la raíz del repo. La skill es un asset que distribuye la CLI, no un artefacto independiente. Mantenerlo dentro de `src/templates/` es consistente con el patrón actual de templates.

**Alternativa descartada**: Ficheros de referencia separados para cada tipo de análisis. Con el volumen actual de instrucciones (~60 líneas), un solo `SKILL.md` más un fichero de referencia para zonas es suficiente. Se puede descomponer en el futuro si crece.

### D2: Perfil del atleta — almacenamiento

El perfil se guarda en `~/.config/strava-ai-cli/profile.json` con permisos `0o600`, siguiendo el mismo patrón que `auth.json` y `config.json`. Schema Zod para validación.

```json
{
  "age": 35,
  "sex": "male",
  "weight": 72,
  "height": 178
}
```

Campos: `age` (number), `sex` ("male" | "female"), `weight` (kg, number), `height` (cm, number).

**Alternativa descartada**: Guardar en memory del agente. No es portable entre agentes ni sesiones. El perfil es un dato del usuario, no del agente.

### D3: Comando `strava profile`

Subcomandos:
- `strava profile` (sin args) → muestra perfil actual o indica que no existe
- `strava profile set` → flujo interactivo con `@clack/prompts` para configurar todos los campos
- `strava profile set --age 35 --sex male --weight 72 --height 178` → modo máquina
- `strava profile --json` → salida JSON del perfil (para la skill)

Sigue el patrón existente de comandos: `createLogger(flags)`, modo interactivo vs máquina, validación con Zod.

### D4: Cómo la skill accede al perfil

La skill ejecuta `npx @lucenyo/strava-cli profile --json` al inicio de cada análisis. Si no hay perfil configurado, la skill lo indica al usuario y sugiere ejecutar `npx @lucenyo/strava-cli profile set`.

No hay lectura directa de ficheros — toda la interacción es vía CLI. Esto mantiene el contrato limpio y portable.

### D5: Evolución de `strava agent install`

El comando evoluciona para copiar la skill como directorio:

| Orquestador | Destino skill |
|-------------|---------------|
| GitHub Copilot | `.github/skills/sports-analyst/` |
| Claude Code | `.claude/skills/sports-analyst/` |
| Gemini CLI | `.gemini/skills/sports-analyst/` |

Se elimina la copia de `.agent.md` y se reemplaza por la copia del directorio de la skill. Los templates `.agent.md` existentes en `src/templates/agents/` se eliminan.

**Alternativa descartada**: Mantener `.agent.md` y skill en paralelo. Añade complejidad sin valor — la skill contiene toda la información del agente.

### D6: Personalización del análisis con perfil

La skill incorpora el perfil en el prompt de contexto:
- **Zonas de FC**: Calculadas con fórmula Karvonen (220 - edad como FC máx estimada)
- **Calorías**: Ajuste por peso y sexo en estimaciones calóricas
- **Riesgo**: Edad como factor en alertas de incremento de carga
- **Ritmo contextualizado**: Referencias de ritmo ajustadas al perfil demográfico

El fichero `references/training-zones.md` contiene las tablas y fórmulas que la skill usa.

## Risks / Trade-offs

- **[Compatibilidad orquestadores]** → No todos los agentes soportan el formato Agent Skills nativamente. Mitigation: el `SKILL.md` es Markdown estándar, funciona como instrucciones incluso sin soporte nativo de skills.
- **[Ruptura de instalaciones previas]** → Usuarios con `.agent.md` instalado no migran automáticamente. Mitigation: documentar en README que deben re-ejecutar `strava agent install`. No hay migración automática (non-goal).
- **[Perfil incompleto]** → La skill puede ejecutarse sin perfil. Mitigation: la skill funciona en modo genérico (como hoy) y sugiere configurar perfil para análisis personalizados.
- **[Precisión de zonas FC]** → La fórmula 220-edad es una estimación. Mitigation: la skill indica explícitamente que son estimaciones y recomienda test de lactato para zonas precisas.
