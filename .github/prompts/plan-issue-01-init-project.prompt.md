# Plan: CLI Foundation, Router & Dual Logging

## TL;DR

Set up the CLI project foundation: TypeScript config, ESLint/Prettier, a `bin/strava.ts` executable entry point, a subcommand router in `src/index.ts`, and a dual-mode logger (`src/utils/logger.ts`) that renders pretty UI via `@clack/prompts` when interactive (TTY) or plain text/JSON when piped or flagged with `--json`/`--raw`.

## Steps

### Phase 1 — Project Config

1. **Create `strava-cli/tsconfig.json`** with strict ESM settings (`"module": "nodenext"`, `"moduleResolution": "nodenext"`, `"strict": true`, `"target": "ES2022"`). No `outDir` — project uses `tsx` directly.
2. **Install & configure ESLint** — add `eslint` + `@eslint/js` + `typescript-eslint` as devDependencies. Create `strava-cli/eslint.config.js` (flat config format). Keep rules minimal: recommended TS rules only.
3. **Install & configure Prettier** — add `prettier` as devDependency. Create `strava-cli/.prettierrc` with `{ "singleQuote": true, "semi": true, "trailingComma": "all" }` (matching current code style).
4. **Add lint/format scripts** to `package.json`: `"lint": "eslint src/"`, `"format": "prettier --write src/"`.

### Phase 2 — Executable Entry Point & Router

5. **Create `strava-cli/bin/strava.ts`** — thin shebang entry point (`#!/usr/bin/env tsx`) that imports and calls the main function from `src/index.ts`. This separates the executable from the logic.
6. **Add `"bin"` field** to `package.json`: `"bin": { "strava": "./bin/strava.ts" }`.
7. **Refactor `src/index.ts`** into a router:
   - Export a `main(argv?: string[])` function (testable).
   - Parse global flags first: `--help`, `--version`, `--json`, `--raw`, `--tui` using `arg` with `stopAtPositional: true`.
   - Extract the subcommand from positional args (`args._[0]`).
   - Route to command handlers via a `commands` map (e.g. `{ test: testCommand }`).
   - Unknown command → show help.
   - Remove the current `@clack/prompts` demo code.
8. **Create `src/commands/test.ts`** — simple `test` command that exercises the logger (info, error, spinner) so we can verify the dual output. Exports an `async function testCommand(flags: GlobalFlags)`.

### Phase 3 — Dual Logger

9. **Create `src/utils/logger.ts`** — the core of this issue:
   - **Mode detection**: Evaluate `process.stdout.isTTY`, `--json`, `--raw`, `--tui` flags, and `@clack/prompts`'s `isCI()` to determine output mode.
   - **Two modes**:
     - `interactive` (default when TTY and no `--json`/`--raw`): uses `@clack/prompts` (`log.info`, `log.warn`, `log.error`, `log.step`, `spinner()`, `intro()`, `outro()`).
     - `machine` (when piped, `--json`, `--raw`, or CI): uses `console.log`/`console.error` for plain text; `--json` flag wraps output in JSON objects.
   - **Exported API**:
     - `createLogger(flags: GlobalFlags)` → returns logger instance.
     - `logger.info(message)` / `logger.warn(message)` / `logger.error(message)` / `logger.success(message)`
     - `logger.spinner()` → returns `{ start(msg), stop(msg), error(msg) }`. In machine mode, `start`/`stop` just print text lines.
     - `logger.json(data)` → always prints JSON (for structured output regardless of mode).
10. **Create `src/types.ts`** — shared types:
    - `GlobalFlags`: `{ json: boolean; raw: boolean; tui: boolean; help: boolean; version: boolean }`.
    - `OutputMode`: `'interactive' | 'machine'`.

### Phase 4 — Wiring & Scripts

11. **Update `package.json` scripts**:
    - `"dev": "tsx watch bin/strava.ts"` (point to new entry).
    - `"start": "tsx bin/strava.ts"`.
12. **Make `bin/strava.ts` executable**: `chmod +x bin/strava.ts`.

## Relevant Files

- `strava-cli/package.json` — add bin field, scripts, devDependencies (eslint, prettier)
- `strava-cli/src/index.ts` — refactor from demo to router with `main()` export
- `strava-cli/bin/strava.ts` — **new** — executable entry point
- `strava-cli/src/utils/logger.ts` — **new** — dual-mode logging module
- `strava-cli/src/commands/test.ts` — **new** — test command to verify logger
- `strava-cli/src/types.ts` — **new** — shared type definitions
- `strava-cli/tsconfig.json` — **new** — TypeScript config
- `strava-cli/eslint.config.js` — **new** — ESLint flat config
- `strava-cli/.prettierrc` — **new** — Prettier config

## Verification

1. `cd strava-cli && npx tsx bin/strava.ts test` → shows colored output with `@clack/prompts` formatting (intro, info, spinner, outro).
2. `npx tsx bin/strava.ts test --json` → outputs JSON lines, no colors/spinners.
3. `npx tsx bin/strava.ts test | cat` → piped output is plain text (no ANSI escape codes), because `isTTY` is false.
4. `npx tsx bin/strava.ts test --raw` → plain text output, no colors.
5. `npx tsx bin/strava.ts --help` → shows usage/help text.
6. `npx tsx bin/strava.ts unknown` → shows "unknown command" + help.
7. `npx eslint src/` → no lint errors.
8. `npx prettier --check src/` → all files formatted.

## Decisions

- **No `tsc` build step** — consistent with project convention; `tsx` runs TS directly, `tsconfig.json` is for editor/IDE type checking only.
- **`arg` with `stopAtPositional: true`** — parse global flags first, then hand remaining args to subcommand handlers. This lets each command define its own flags.
- **Logger is a factory, not a singleton** — `createLogger(flags)` makes it testable and avoids global state. The `bin/strava.ts` entry creates the logger and passes it through.
- **`@clack/prompts` only in interactive mode** — in machine mode, the logger avoids all `@clack/prompts` calls to ensure clean stdout for piping/parsing.
- **`--tui` flag** — forces interactive mode even when piped (opt-in override). Not strictly needed for DoD but aligns with the issue spec.
- **Spinner in machine mode** — `start()` prints a line like `⏳ Loading...`, `stop()` prints `✓ Done`. No animation.
