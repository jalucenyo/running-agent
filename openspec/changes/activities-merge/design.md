## Context

The strava-cli already supports `activities list` and `activities export`. The Strava REST API provides endpoints for fetching activity details (`GET /activities/{id}`), activity streams (`GET /activities/{id}/streams`), creating activities (`POST /activities`), updating activities (`PUT /activities/{id}`), and deleting activities (`DELETE /activities/{id}`).

Users who train with multiple devices (e.g., Garmin watch + Wahoo HR strap) get duplicate activities because each companion app publishes independently. One activity may have GPS/pace data while the other has heart rate. The merge command combines these into a single, richer activity.

The CLI uses `@clack/prompts` for interactive flows and `zod` for all API response validation. Auth tokens are already managed in `utils/auth.ts`.

## Goals / Non-Goals

**Goals:**
- Allow users to interactively select two activities to merge
- Display a side-by-side comparison of activity data and streams
- Let users choose which fields and stream channels to keep from each source
- Create a new activity in Strava with the combined data
- Optionally delete the original activities after successful merge

**Non-Goals:**
- Automatic duplicate detection (user manually selects the two activities)
- Merging more than two activities at once
- Supporting `--json` / `--raw` output modes for the merge flow (inherently interactive)
- Changing sport_type of the merged activity (it comes from the FIT file metadata)

## Decisions

### 1. Activity selection via recent list + ID confirmation

The merge flow will first fetch recent activities (reusing the existing list logic) and present them with `@clack/prompts` select. The user picks the two activities to merge from this list.

**Rationale**: Reuses existing `activities list` fetching logic. Showing activities in a selectable list is more ergonomic than requiring the user to know activity IDs upfront.

**Alternative considered**: Accept two activity IDs as CLI arguments. Rejected because it requires users to look up IDs manually and reduces the interactive UX.

### 2. Stream channels are picked per-source, with time-base interpolation

For each stream type (heartrate, altitude, cadence, watts, latlng), the user selects which of the two activities should provide that channel. The user also selects which activity provides the `time` array as the temporal base.

When a selected stream channel comes from the non-base activity and its `time` array differs in length, the channel values are linearly interpolated to align with the base `time` array.

**Rationale**: Channel-level selection covers the primary use case (GPS from device A, heart rate from device B). Linear interpolation handles sampling rate differences between devices (e.g., 1s vs 5s) without requiring complex time alignment.

**Alternative considered**: Only allow streams from the same time base. Rejected because it would prevent combining streams from devices with different sampling rates, which is the whole point of the merge.

### 3. Merged activity via FIT file upload (`POST /uploads`)

The merged activity is created by generating a FIT file containing the combined stream data and uploading it via `POST /uploads`. The existing FIT encoder (`fit/encoder.ts`, `fit/messages.ts`) is reused to build the file.

The flow:
1. Build `RecordPoint[]` from the merged streams (selected channels aligned to the chosen time base)
2. Generate a FIT buffer using `FitEncoder` + `writeFitActivity()`
3. Upload via `POST /uploads` (multipart form: file, data_type="fit", name, description)
4. Poll `GET /uploads/{id}` until processing completes
5. Use `PUT /activities/{id}` to set the final name and provenance description

**Rationale**: `POST /activities` only creates a manual activity without stream data. FIT upload creates a full activity with all sensor streams, which is the core value of merging. The FIT encoder already exists and handles all stream types.

**Alternative considered**: Keep `POST /activities` for metadata only. Rejected because losing stream data defeats the purpose of merging activities from multiple devices.

### 4. Confirmation before destructive operations

Before creating the merged activity and before deleting originals, the user must explicitly confirm. Deletion of originals is opt-in (asked after successful creation).

**Rationale**: Creating and especially deleting activities are irreversible via the API. Matches the project's convention of confirming destructive operations.

### 5. Command structure: `activities merge`

Follows the existing subcommand pattern in `commands/activities/`. New file `merge.ts` registered in `commands/activities/index.ts`.

**Rationale**: Consistent with `activities list` and `activities export`.

## Risks / Trade-offs

- **[Upload processing delay]** `POST /uploads` is asynchronous — Strava processes the FIT file and creates the activity in the background (typically 5–30 seconds). **Mitigation**: Poll `GET /uploads/{id}` with a spinner. Timeout after a reasonable period and show the upload ID for manual follow-up.
- **[Stream interpolation accuracy]** Linear interpolation of HR/cadence/power across different sampling rates may lose peaks or smooth data. **Mitigation**: This is acceptable for training analysis; the alternative of losing the data entirely is worse.
- **[Rate limiting]** Fetching details + streams for two activities + upload + polling = ~6-8 API calls. **Mitigation**: Well within Strava's 100 requests/15 min limit.
- **[Data loss risk]** Deleting original activities is irreversible → **Mitigation**: Deletion is opt-in, requires explicit confirmation, and only offered after successful upload processing.
- **[Field conflicts]** Both activities have the same field with different values → **Mitigation**: Show both values side-by-side and let the user pick. For non-selectable computed fields (suffer_score, calories), take from the user's chosen primary activity.
