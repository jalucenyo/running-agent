## 1. Schemas & Types

- [x] 1.1 Create Zod schema for Strava `POST /activities` request body (name, sport_type, start_date_local, elapsed_time, distance, description)
- [x] 1.2 Create Zod schema for Strava `POST /activities` response (created activity)
- [x] 1.3 Extend `strava-activity-detail` schema with the additional fields needed for comparison (average_heartrate, max_heartrate, average_cadence, average_watts, max_watts, average_speed, max_speed, total_elevation_gain, calories)

## 2. API Helpers

- [x] 2.1 Add `fetchActivityDetail(id)` helper that calls `GET /activities/{id}` and validates with the extended detail schema
- [x] 2.2 Add `fetchActivityStreams(id)` helper that calls `GET /activities/{id}/streams` and returns parsed streams
- [x] 2.3 Add `createActivity(data)` helper that calls `POST /activities` with merged fields and validates the response
- [x] 2.4 Add `deleteActivity(id)` helper that calls `DELETE /activities/{id}`

## 3. Merge Command Core

- [x] 3.1 Create `commands/activities/merge.ts` with the `mergeActivities` function skeleton and CLI arg parsing (--per-page, --help)
- [x] 3.2 Implement activity selection flow: fetch recent activities, present two sequential `@clack/prompts` select prompts
- [x] 3.3 Implement data fetching: retrieve detail + streams for both selected activities with spinner

## 4. Comparison & Selection

- [x] 4.1 Implement side-by-side field comparison display (table showing both values for each field)
- [x] 4.2 Implement stream availability comparison display (which channels each activity has)
- [x] 4.3 Implement field selection prompts: for each conflicting field, let user choose source activity
- [x] 4.4 Implement stream channel selection prompts: for each shared channel, let user choose source

## 5. Merge Execution

- [x] 5.1 Build the merged activity payload from user selections
- [x] 5.2 Generate the merge description with provenance (source activity IDs, names, field origins)
- [x] 5.3 Implement confirmation prompt showing merge summary
- [x] 5.4 Call `createActivity()` and display the result (new activity ID and name)

## 6. Cleanup & Registration

- [x] 6.1 Implement optional deletion flow: prompt to delete originals after successful merge, handle partial failure
- [x] 6.2 Register `merge` subcommand in `commands/activities/index.ts` router
- [x] 6.3 Update activities help text to include the merge subcommand

## 7. UX Improvements

- [x] 7.1 Enhance activity select labels: show date with time (HH:MM), distance, and sensor indicators ([HR], [PWR]) in the hint to help identify duplicates
- [x] 7.2 Add custom title option: when selecting the name field, offer a third "Escribir un título personalizado" option that opens a text input prompt

## 8. ~~Duplicate Detection Avoidance~~ (superseded by FIT upload)

- [x] ~~8.1 Offset start_date_local by +60 seconds~~ (no longer needed — FIT upload uses native timestamps)

## 9. FIT Upload Integration

- [ ] 9.1 Add `uploadFitFile(buffer, name, description, accessToken)` helper that calls `POST /uploads` with multipart form data (file, data_type="fit")
- [ ] 9.2 Add Zod schemas for upload response and upload status polling (`GET /uploads/{id}`)
- [ ] 9.3 Add `pollUploadStatus(uploadId, accessToken)` helper that polls until processing completes or timeout
- [ ] 9.4 Add `updateActivity(id, { name, description }, accessToken)` helper that calls `PUT /activities/{id}`

## 10. Stream Merging & Interpolation

- [ ] 10.1 Add time-base selection prompt: when both activities have `time` streams, ask user which to use as base
- [ ] 10.2 Implement `interpolateStream(sourceTime, sourceValues, targetTime)` utility for linear interpolation of numeric stream channels
- [ ] 10.3 Implement `interpolateLatLng(sourceTime, sourceValues, targetTime)` utility for linear interpolation of GPS coordinates
- [ ] 10.4 Build merged `RecordPoint[]` from selected stream channels, interpolating ones from the non-base activity

## 11. Replace POST /activities with FIT Upload

- [ ] 11.1 Replace `createActivity()` call in merge.ts with: build FIT buffer → upload → poll → update name/description
- [ ] 11.2 Remove the +60s start_date_local offset (no longer needed)
- [ ] 11.3 Update confirmation summary to reflect FIT upload flow
