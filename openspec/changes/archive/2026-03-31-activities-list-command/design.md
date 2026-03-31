## Context

`strava-cli` is a Node.js CLI tool (TypeScript, ESM, `tsx`) that authenticates with the Strava API via OAuth. Currently it only has `login` and `test` commands. The tool lacks any data-retrieval commands; this design introduces the first one: listing activities.

The OAuth access token is managed by `utils/auth.ts`. The Strava REST API returns paginated JSON arrays for `GET /athlete/activities`.

## Goals / Non-Goals

**Goals:**
- Introduce an `activities` top-level command with a `list` subcommand.
- Fetch activities from Strava API (`GET /athlete/activities`) using the stored OAuth token.
- Display results as a readable table in the terminal (name, date, distance, time, type).
- Support `--page` and `--per-page` flags for pagination.
- Validate the API response with a Zod schema.

**Non-Goals:**
- Filtering or sorting activities beyond what the Strava API natively supports.
- Storing activities locally / caching.
- Detailed activity view (single-activity endpoint is a separate future command).
- CSV or JSON export modes.

## Decisions

### 1. Subcommand routing via index file

**Decision**: Add `strava-cli/src/commands/activities/index.ts` as a router that delegates to `list.ts` based on the second positional argument.

**Why**: Mirrors the existing single-command pattern (`commands/login.ts`, `commands/test.ts`) but keeps future subcommands (e.g., `activities stats`) isolated in their own files. Avoids coupling all activity logic into one large file.

**Alternative considered**: A single flat `activities.ts` handling all subcommands with internal branching — rejected because it doesn't scale and complicates testing.

### 2. HTTP via native `fetch`

**Decision**: Use Node.js built-in `fetch` (available since Node 18) to call the Strava API. No additional HTTP library.

**Why**: The project targets Node 18+ and has no existing HTTP client library. Adding `axios` or `node-fetch` would be an unnecessary dependency for a single endpoint call.

### 3. Zod schema for API response validation

**Decision**: Define a `StravaActivity` Zod schema in `schemas/strava-activity.ts` and parse API responses through it.

**Why**: `zod` is already installed. Validating at the API boundary catches unexpected shape changes and provides typed data to the rest of the command without manual casting.

### 4. Tabular output with manual formatting

**Decision**: Format output as an aligned table using string padding (`padEnd`/`padStart`) rather than adding a table-rendering library.

**Why**: The column set is small and fixed. A library dependency (e.g., `cli-table3`) adds weight for a trivial use case. A helper function keeps it lightweight and auditable.

## Risks / Trade-offs

- **Strava token expiry** → The existing `utils/auth.ts` should detect expired tokens; if not, the command will fail with a 401. Mitigation: surface a clear error message directing the user to run `strava login` again.
- **Large activity lists** → Without `--per-page` the API defaults to 30 results. Users with many activities will need to paginate manually. Mitigation: clearly document the flags in the help text.
- **API rate limits** → Strava enforces 100 req/15min. A single list call is unlikely to hit this, but repeated scripted usage might. No mitigation needed at this stage.
