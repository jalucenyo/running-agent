## 1. Zod Schema

- [x] 1.1 Create `strava-cli/src/schemas/strava-activity.ts` with a Zod schema for the Strava `SummaryActivity` API response (id, name, distance, moving_time, sport_type, start_date_local)
- [x] 1.2 Export the inferred TypeScript type `StravaActivity` from the schema file

## 2. Activities Command Structure

- [x] 2.1 Create `strava-cli/src/commands/activities/index.ts` as the subcommand router that reads the second positional argument and delegates to the appropriate subcommand handler
- [x] 2.2 Create `strava-cli/src/commands/activities/list.ts` with the `listActivities` async function

## 3. List Subcommand Implementation

- [x] 3.1 Parse `--page` (default: 1) and `--per-page` (default: 30) flags using `arg` inside `list.ts`
- [x] 3.2 Load the stored OAuth access token using `utils/auth.ts`; exit with error if not found
- [x] 3.3 Call `GET https://www.strava.com/api/v3/athlete/activities` with `page` and `per_page` query params and `Authorization: Bearer <token>` header using native `fetch`
- [x] 3.4 Handle HTTP 401 response: display "Session expired, run `strava login`" and exit with code 1
- [x] 3.5 Parse and validate the API response with the `StravaActivity` Zod schema; display validation errors and exit with code 1 on failure
- [x] 3.6 Handle empty activity list: display "No activities found." message

## 4. Terminal Output

- [x] 4.1 Implement a table formatter in `list.ts` that aligns columns: Name, Date, Distance (km), Time (min), Type
- [x] 4.2 Print the formatted table to stdout

## 5. CLI Entry Point Wiring

- [x] 5.1 Register the `activities` command in `strava-cli/src/index.ts` (or `bin/strava.ts`) so that `strava activities <subcommand>` routes to the activities index handler
- [x] 5.2 Verify `strava activities list` runs end-to-end with a real or mocked token
