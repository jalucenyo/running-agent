## Why

Strava users who train with multiple devices (e.g., a GPS watch and a heart rate monitor chest strap) often end up with duplicate activities because each device's companion app publishes the activity independently. These duplicates contain complementary data — one may have GPS/pace data while the other has heart rate or power metrics. Currently there is no way to combine them from the CLI, forcing users to manually edit activities in the Strava web UI or lose valuable training data.

## What Changes

- New `activities merge` subcommand that guides the user through merging two duplicate activities into one.
- Interactive flow to select two activities, compare their data side-by-side, and choose which fields and streams to keep from each.
- Creates a new activity in Strava combining the selected data from both source activities.
- Optionally deletes the original duplicate activities after a successful merge.

## Capabilities

### New Capabilities
- `activity-merge`: Interactive merge of two duplicate Strava activities. Covers activity selection, data comparison, field/stream cherry-picking, creation of the merged activity via Strava API, and optional cleanup of originals.

### Modified Capabilities

_(none — this is a new standalone subcommand that doesn't change existing spec-level behavior)_

## Impact

- **Code**: New `commands/activities/merge.ts` command, updates to `commands/activities/index.ts` router. May need new/extended Strava API schemas for activity creation endpoint.
- **APIs**: Uses Strava `GET /activities/{id}`, `GET /activities/{id}/streams`, `POST /activities`, and optionally `DELETE /activities/{id}`.
- **Dependencies**: No new external dependencies expected — uses existing `@clack/prompts` for interactive selection and `zod` for validation.
- **Systems**: Writes to Strava via API (creates and potentially deletes activities) — destructive operations require user confirmation.
