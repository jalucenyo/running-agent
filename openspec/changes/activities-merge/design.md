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
- Merging stream data at the sample level (e.g., interleaving GPS points) — streams are taken as whole channels from one source
- Supporting `--json` / `--raw` output modes for the merge flow (inherently interactive)

## Decisions

### 1. Activity selection via recent list + ID confirmation

The merge flow will first fetch recent activities (reusing the existing list logic) and present them with `@clack/prompts` select. The user picks the two activities to merge from this list.

**Rationale**: Reuses existing `activities list` fetching logic. Showing activities in a selectable list is more ergonomic than requiring the user to know activity IDs upfront.

**Alternative considered**: Accept two activity IDs as CLI arguments. Rejected because it requires users to look up IDs manually and reduces the interactive UX.

### 2. Stream channels are picked per-source, not interleaved

For each stream type (heartrate, altitude, cadence, watts, latlng), the user selects which of the two activities should provide that channel. Streams are not merged at the sample level.

**Rationale**: Sample-level interleaving requires complex time alignment, resampling, and conflict resolution logic. Channel-level selection is straightforward and covers the primary use case (GPS from device A, heart rate from device B).

**Alternative considered**: Point-by-point merging with timestamp alignment. Rejected as over-engineering for v1 — adds significant complexity with limited additional value.

### 3. New activity via Strava API `POST /activities` + `PUT /activities/{id}`

Strava's `POST /activities` creates a manual activity with basic fields (name, sport_type, start_date, elapsed_time, distance, description). Stream data cannot be uploaded via the API — the Strava API does not support attaching streams to manually created activities.

**Decision**: The merged activity will contain the combined metadata fields (name, distance, times, sport_type, etc.) chosen by the user. A description note will indicate which source activities were merged and which data came from each. Stream data will be referenced in the description but cannot be programmatically attached.

**Rationale**: This is a limitation of the Strava API. The `POST /uploads` endpoint accepts FIT/GPX/TCX files but creates a new activity from the file's data, not allowing selective field merging. The merge workflow provides the most value when users can combine metadata (HR stats, elevation, power) from two sources into one clean activity record.

**Alternative considered**: Generate a FIT file with merged streams and upload via `POST /uploads`. This could be a future enhancement leveraging the existing FIT encoder, but adds significant complexity to v1 and doesn't support selective field-level merging.

### 4. Confirmation before destructive operations

Before creating the merged activity and before deleting originals, the user must explicitly confirm. Deletion of originals is opt-in (asked after successful creation).

**Rationale**: Creating and especially deleting activities are irreversible via the API. Matches the project's convention of confirming destructive operations.

### 5. Command structure: `activities merge`

Follows the existing subcommand pattern in `commands/activities/`. New file `merge.ts` registered in `commands/activities/index.ts`.

**Rationale**: Consistent with `activities list` and `activities export`.

### 6. Start date offset to avoid duplicate detection

Strava rejects activities it considers duplicates based on `start_date`, `sport_type`, `elapsed_time`, and `distance`. Since the merged activity shares these values with the originals (which may still exist), the CLI adds a +60 second offset to `start_date_local` before creating.

The provenance description documents the original start time and the applied offset.

**Rationale**: 60 seconds is enough to evade detection but negligible for training analysis. Safer than deleting originals before creation, which risks data loss if the create call fails.

**Alternative considered**: Delete originals before creating the merged activity so the exact timestamp can be reused. Rejected because a failed `POST /activities` after deletion would cause irrecoverable data loss.

## Risks / Trade-offs

- **[Strava API limitation]** Streams cannot be attached to manually created activities → The merged activity will lack stream-level data. **Mitigation**: Document this limitation clearly. Future enhancement could generate a FIT file with merged streams and use `POST /uploads`.
- **[Rate limiting]** Fetching details + streams for two activities = 4 API calls minimum → **Mitigation**: Strava's rate limit is 100 requests per 15 minutes; 4 calls is negligible. Show spinner during fetches.
- **[Data loss risk]** Deleting original activities is irreversible → **Mitigation**: Deletion is opt-in, requires explicit confirmation, and only offered after successful merge creation.
- **[Field conflicts]** Both activities have the same field with different values → **Mitigation**: Show both values side-by-side and let the user pick. For non-selectable computed fields (suffer_score, calories), take from the user's chosen primary activity.
