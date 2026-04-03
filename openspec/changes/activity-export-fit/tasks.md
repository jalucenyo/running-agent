## 1. FIT Protocol Foundation

- [x] 1.1 Create `src/fit/types.ts` with FIT protocol constants: base types, mesg_num values (file_id=0, record=20, event=21, lap=19, session=18, activity=34), field definition numbers, sport/sub_sport enums, and FIT epoch constant (Dec 31, 1989)
- [x] 1.2 Create `src/fit/crc.ts` implementing the FIT CRC-16 algorithm using the lookup table from the FIT protocol specification
- [x] 1.3 Create `src/fit/encoder.ts` with `FitEncoder` class: `open()` writes the 14-byte file header, `writeDefinition()` writes definition messages, `writeData()` writes data messages, `close()` updates data size in header and appends CRC

## 2. FIT Message Builders

- [x] 2.1 Create `src/fit/messages.ts` with function `createFileIdMessage()` that builds a File ID definition + data message (type=Activity, manufacturer=Development, time_created)
- [x] 2.2 Add `createEventMessage()` for timer start/stop events (event=timer, event_type=start/stop)
- [x] 2.3 Add `createRecordMessage()` that builds Record definition + data messages with dynamic fields based on available data (timestamp, position_lat, position_long, heart_rate, altitude, distance, cadence, power)
- [x] 2.4 Add `createLapMessage()` for lap summary (start_time, total_elapsed_time, total_timer_time, sport, sub_sport)
- [x] 2.5 Add `createSessionMessage()` for session summary (start_time, total_elapsed_time, total_timer_time, total_distance, sport, sub_sport, first_lap_index, num_laps)
- [x] 2.6 Add `createActivityMessage()` for activity summary (timestamp, total_timer_time, num_sessions, type, local_timestamp)

## 3. Strava API Integration

- [x] 3.1 Create `src/schemas/strava-streams.ts` with Zod schema for the Strava streams API response (`GET /activities/{id}/streams`)
- [x] 3.2 Create `src/schemas/strava-activity-detail.ts` with Zod schema for the detailed activity response (`GET /activities/{id}`) adding fields needed for export (elapsed_time, start_date, timezone, etc.)
- [x] 3.3 Add sport type mapping utility: Strava sport_type → FIT sport + sub_sport enum values (Run, TrailRun, Ride, MountainBikeRide, GravelRide, Walk, Hike, Generic fallback)

## 4. Export Command

- [x] 4.1 Create `src/commands/activities/export.ts` with `exportActivity()` function skeleton: parse args (`--id`, `--output`, `--per-page`), load tokens, validate auth
- [x] 4.2 Implement interactive activity selection: fetch recent activities, present selectable list with `@clack/prompts`, return selected activity ID
- [x] 4.3 Implement activity data fetching: call `GET /activities/{id}` and `GET /activities/{id}/streams`, validate responses with Zod schemas, handle 401/404 errors
- [x] 4.4 Implement FIT file generation: map Strava data to FIT messages (File ID → Events → Records → Lap → Session → Activity), write to file using FitEncoder
- [x] 4.5 Add output feedback: display output file path and file size on success

## 5. Command Registration

- [x] 5.1 Register `export` subcommand in `src/commands/activities/index.ts` router
- [x] 5.2 Verify end-to-end flow: `strava activities export --id <id>` produces a valid FIT file
