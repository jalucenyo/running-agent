## Why

The strava-cli currently has no way to fetch or display running data from Strava. Adding an `activities list` command is the first step to make the tool useful — it gives users a quick way to see their recent activities directly from the terminal.

## What Changes

- New top-level command `activities` with a `list` subcommand added to the CLI.
- The `activities list` command calls the Strava API to retrieve the authenticated user's activity list and prints it to the terminal.
- Pagination support via `--page` and `--per-page` flags to control how many results are returned.
- Output formatted as a readable table (name, date, distance, moving time, type).

## Capabilities

### New Capabilities

- `activities-list`: Fetches and displays the list of Strava activities for the authenticated user, with pagination support and tabular terminal output.

### Modified Capabilities

_(none)_

## Impact

- New file: `strava-cli/src/commands/activities/list.ts`
- New file: `strava-cli/src/commands/activities/index.ts` (subcommand router)
- New Zod schema for Strava `Activity` API response objects.
- Requires a valid OAuth access token (already handled by the existing auth utilities in `utils/auth.ts`).
- Calls Strava API endpoint `GET /athlete/activities`.
- No breaking changes to existing commands (`login`, `test`).
