# Copilot Instructions — running-agent

## Project Overview

CLI tool for analyzing running training data from Strava. Written in TypeScript, targeting Node.js.
Currently in early development (scaffolding phase).

## Tech Stack

- **Runtime**: Node.js (18+), ESM modules (`"type": "module"`)
- **Language**: TypeScript 5.x (executed via `tsx`, no compile step)
- **CLI parsing**: `arg` for flags/arguments
- **Prompts**: `@clack/prompts` for interactive terminal UX
- **Validation**: `zod` (available, not yet wired in)

## Project Structure

```
strava-cli/
  src/
    index.ts       # CLI entry point
  package.json
```

All source code lives under `strava-cli/`. There is no build output — `tsx` runs TypeScript directly.

## Commands

| Task | Command | Run from |
|------|---------|----------|
| Dev (watch) | `npm run dev` | `strava-cli/` |
| Run once | `npx tsx src/index.ts` | `strava-cli/` |
| Install deps | `npm install` | `strava-cli/` |

## Conventions

- **Language**: Code in English, user-facing text and docs may be in Spanish.
- **Module style**: ESM — use `import`/`export`, never `require()`.
- **Async**: Top-level `await` is fine; prefer `async`/`await` over `.then()` chains.
- **Naming**: `camelCase` for variables and functions, `PascalCase` for types/interfaces.
- **No build step**: Do not add `tsc` compilation or output directories. Use `tsx` for execution.

## Testing

No test framework is configured yet. When adding tests, prefer **vitest** (ESM-native, fast, TS-first).

## Important Notes

- The project will integrate with the **Strava API** — expect OAuth tokens and API credentials as future env vars.
- `zod` is already installed for runtime validation — use it for API responses and CLI input validation.
- Keep the CLI minimal and composable; avoid heavy abstractions in this early phase.
