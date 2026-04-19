## ADDED Requirements

### Requirement: Skill en formato Agent Skills estándar
La skill SHALL seguir la especificación de Agent Skills (agentskills.io): directorio con `SKILL.md` que contiene frontmatter YAML (`name`, `description`) e instrucciones Markdown.

#### Scenario: Estructura de directorio válida
- **WHEN** se inspecciona el directorio de la skill
- **THEN** existe `sports-analyst/SKILL.md` con frontmatter válido
- **AND** existe `sports-analyst/references/training-zones.md` con tablas de zonas

#### Scenario: Frontmatter válido
- **WHEN** se lee el `SKILL.md`
- **THEN** contiene `name: sports-analyst` (lowercase, hyphens)
- **AND** contiene `description` que describe qué hace y cuándo usarla (max 1024 chars)

### Requirement: Lectura del perfil del atleta al inicio del análisis
La skill SHALL ejecutar `npx @lucenyo/strava-cli profile --json` al inicio de cada análisis para obtener el perfil del atleta.

#### Scenario: Perfil disponible
- **WHEN** la skill ejecuta `npx @lucenyo/strava-cli profile --json` y el perfil existe
- **THEN** la skill incorpora edad, sexo, peso y altura al contexto del análisis
- **AND** utiliza estos datos para personalizar zonas de FC, estimaciones calóricas y alertas de riesgo

#### Scenario: Perfil no disponible
- **WHEN** la skill ejecuta `npx @lucenyo/strava-cli profile --json` y devuelve JSON vacío
- **THEN** la skill funciona en modo genérico (sin personalización)
- **AND** indica al usuario que puede configurar su perfil con `npx @lucenyo/strava-cli profile set` para análisis personalizados

### Requirement: Obtención de datos exclusivamente vía CLI
La skill SHALL obtener todos los datos de actividades ejecutando comandos de la CLI de Strava, nunca accediendo a APIs HTTP directamente.

#### Scenario: Listado de actividades
- **WHEN** la skill necesita datos de actividades
- **THEN** ejecuta `npx @lucenyo/strava-cli activities list --json [--per-page N]`

#### Scenario: Exportación de actividad
- **WHEN** la skill necesita datos detallados de una actividad
- **THEN** ejecuta `npx @lucenyo/strava-cli activities export --id <id>`

### Requirement: Análisis personalizado con zonas de frecuencia cardíaca
La skill SHALL calcular zonas de FC basadas en la edad del atleta cuando el perfil está disponible.

#### Scenario: Cálculo de zonas con perfil
- **WHEN** la skill tiene acceso al perfil del atleta con edad
- **THEN** calcula FC máxima estimada (220 - edad)
- **AND** distribuye las 5 zonas de FC estándar sobre la FC máxima
- **AND** usa estas zonas al analizar datos de frecuencia cardíaca

#### Scenario: Análisis de FC sin perfil
- **WHEN** la skill no tiene perfil del atleta
- **THEN** no calcula zonas personalizadas
- **AND** muestra datos de FC absolutos sin clasificación por zonas

### Requirement: Alertas de riesgo ajustadas al perfil
La skill SHALL ajustar las alertas de sobreentrenamiento y riesgo de lesión considerando la edad del atleta.

#### Scenario: Incremento de carga en atleta senior
- **WHEN** el atleta tiene más de 45 años y el incremento semanal de volumen supera el 8%
- **THEN** la skill genera una alerta de riesgo indicando el factor edad

#### Scenario: Incremento de carga en atleta joven
- **WHEN** el atleta tiene menos de 35 años y el incremento semanal de volumen supera el 10%
- **THEN** la skill genera una alerta de riesgo con el umbral estándar

### Requirement: Restricciones de la skill
La skill SHALL respetar restricciones específicas para análisis deportivo responsable.

#### Scenario: Semanas de lunes a domingo
- **WHEN** la skill agrupa actividades por semana
- **THEN** usa lunes como primer día de la semana

#### Scenario: Sin invención de datos
- **WHEN** la skill presenta datos al usuario
- **THEN** todos los valores provienen de la respuesta de la CLI, nunca inventados

#### Scenario: Sin diagnóstico médico
- **WHEN** la skill detecta señales de alarma (dolor, fatiga excesiva)
- **THEN** recomienda consultar a un profesional de salud en vez de diagnosticar

#### Scenario: Idioma español por defecto
- **WHEN** la skill responde al usuario
- **THEN** responde en español salvo que el usuario pida otro idioma
