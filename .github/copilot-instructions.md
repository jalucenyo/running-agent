# Copilot Instructions — running-agent

## Project Overview

CLI tool for analyzing running training data from Strava. Written in TypeScript, targeting Node.js.
Currently in early development — first feature (`activities list`) is complete.

## Tech Stack

- **Runtime**: Node.js 18+ (uses native `fetch`), ESM modules (`"type": "module"`)
- **Language**: TypeScript 5.x, executed via `tsx` — no compile step
- **CLI parsing**: `arg` for flags/arguments
- **Interactive UX**: `@clack/prompts` (spinner, intro/outro)
- **Validation**: `zod` at all API boundaries
- **Browser**: `open` for OAuth redirect

## Project Structure

All source code lives under `strava-cli/`. No build output — `tsx` runs TypeScript directly.

```
strava-cli/
├── bin/strava.ts                  # Executable entry point
├── src/
│   ├── index.ts                   # CLI router (top-level command dispatch)
│   ├── types.ts                   # GlobalFlags, OutputMode, Strava interfaces
│   ├── commands/
│   │   ├── login.ts               # OAuth2 flow + token storage
│   │   ├── test.ts                # Logger test harness
│   │   └── activities/
│   │       ├── index.ts           # Subcommand router
│   │       └── list.ts            # Fetch & display activities
│   ├── schemas/
│   │   ├── strava-activity.ts     # Activity Zod schema
│   │   └── strava-auth.ts         # Auth Zod schemas
│   └── utils/
│       ├── auth.ts                # Token save/load (~/.config/strava-ai-cli/auth.json)
│       └── logger.ts              # Mode-aware logger (interactive vs machine)
├── package.json
├── tsconfig.json
└── eslint.config.js
```

## Build & Run

All commands run from `strava-cli/`:

| Task | Command |
|------|---------|
| Dev (with .env) | `npm run dev` |
| Run once | `npm start` |
| Lint | `npm run lint` |
| Format | `npm run format` |
| Install deps | `npm install` |

Pass arguments after `--`: `npm run dev -- activities list --per-page 10`

## Conventions

- **Language**: Code in English. User-facing text and docs may be in Spanish.
- **Module style**: ESM only — `import`/`export`, never `require()`.
- **Async**: Top-level `await` is fine. Prefer `async`/`await` over `.then()`.
- **Naming**: `camelCase` for variables/functions, `PascalCase` for types/interfaces.
- **No build step**: Never add `tsc` compilation or output directories. Use `tsx`.
- **HTTP**: Use native `fetch` — no external HTTP libraries (axios, got, etc.).
- **Validation**: Always validate Strava API responses with Zod schemas via `safeParse()`.
- **Error handling**: Exit with code 1 + error message. No thrown exceptions at command level.

## Architecture Patterns

### Command routing
- Top-level commands dispatched in `src/index.ts` with signature `(flags: GlobalFlags) => Promise<void>`.
- Subcommands: create a directory with `index.ts` as router + sibling files for implementations (see `commands/activities/`).

### Output modes
- `createLogger(flags)` returns a mode-aware logger: `interactive` (TTY with `@clack/prompts`) or `machine` (JSON via `--json`, plain via `--raw`).
- All user-visible output goes through the logger — never use bare `console.log`.

### Auth
- OAuth tokens stored at `~/.config/strava-ai-cli/auth.json` with `0o600` permissions.
- Env vars: `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET` (loaded via `--env-file=.env`).

## Testing

No test framework configured yet. When adding tests, use **vitest** (ESM-native, TS-first).

## Change Management

This project uses **OpenSpec** for planning changes. Specs and tasks live in `openspec/changes/<change-name>/`. See the `openspec-*` skills for the workflow.
