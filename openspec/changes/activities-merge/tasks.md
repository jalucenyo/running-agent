## 1. Schemas & Types

- [ ] 1.1 Create Zod schema for Strava `POST /activities` request body (name, sport_type, start_date_local, elapsed_time, distance, description)
- [ ] 1.2 Create Zod schema for Strava `POST /activities` response (created activity)
- [ ] 1.3 Extend `strava-activity-detail` schema with the additional fields needed for comparison (average_heartrate, max_heartrate, average_cadence, average_watts, max_watts, average_speed, max_speed, total_elevation_gain, calories)

## 2. API Helpers

- [ ] 2.1 Add `fetchActivityDetail(id)` helper that calls `GET /activities/{id}` and validates with the extended detail schema
- [ ] 2.2 Add `fetchActivityStreams(id)` helper that calls `GET /activities/{id}/streams` and returns parsed streams
- [ ] 2.3 Add `createActivity(data)` helper that calls `POST /activities` with merged fields and validates the response
- [ ] 2.4 Add `deleteActivity(id)` helper that calls `DELETE /activities/{id}`

## 3. Merge Command Core

- [ ] 3.1 Create `commands/activities/merge.ts` with the `mergeActivities` function skeleton and CLI arg parsing (--per-page, --help)
- [ ] 3.2 Implement activity selection flow: fetch recent activities, present two sequential `@clack/prompts` select prompts
- [ ] 3.3 Implement data fetching: retrieve detail + streams for both selected activities with spinner

## 4. Comparison & Selection

- [ ] 4.1 Implement side-by-side field comparison display (table showing both values for each field)
- [ ] 4.2 Implement stream availability comparison display (which channels each activity has)
- [ ] 4.3 Implement field selection prompts: for each conflicting field, let user choose source activity
- [ ] 4.4 Implement stream channel selection prompts: for each shared channel, let user choose source

## 5. Merge Execution

- [ ] 5.1 Build the merged activity payload from user selections
- [ ] 5.2 Generate the merge description with provenance (source activity IDs, names, field origins)
- [ ] 5.3 Implement confirmation prompt showing merge summary
- [ ] 5.4 Call `createActivity()` and display the result (new activity ID and name)

## 6. Cleanup & Registration

- [ ] 6.1 Implement optional deletion flow: prompt to delete originals after successful merge, handle partial failure
- [ ] 6.2 Register `merge` subcommand in `commands/activities/index.ts` router
- [ ] 6.3 Update activities help text to include the merge subcommand
