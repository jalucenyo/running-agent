## ADDED Requirements

### Requirement: User can invoke the merge subcommand
The CLI SHALL expose an `activities merge` subcommand accessible via `strava activities merge`.

#### Scenario: Invoke merge command
- **WHEN** the user runs `strava activities merge`
- **THEN** the CLI SHALL start the interactive merge flow

#### Scenario: Show help for merge
- **WHEN** the user runs `strava activities merge --help`
- **THEN** the CLI SHALL display usage information for the merge subcommand and exit

### Requirement: User can select two activities to merge
The CLI SHALL fetch recent activities and present them in an interactive select prompt. The user MUST select exactly two activities to merge. The activity list SHALL display title, date with time, sport type, distance, and sensor indicators (HR, power) to help identify duplicates.

#### Scenario: Select two activities from recent list
- **WHEN** the merge flow starts
- **THEN** the CLI SHALL fetch recent activities from Strava
- **AND** present them in a selectable list using `@clack/prompts`
- **AND** each option SHALL show the activity name as the label
- **AND** each option hint SHALL include date with time (extracted from `start_date_local`), sport type, distance, and sensor indicators: `[HR]` if `has_heartrate` is true, `[PWR]` if `average_watts` is present
- **AND** the user SHALL select the first activity
- **AND** the CLI SHALL present the remaining activities for second selection
- **AND** the user SHALL select the second activity

#### Scenario: Insufficient activities available
- **WHEN** the user has fewer than 2 activities
- **THEN** the CLI SHALL display an error message and exit with code 1

### Requirement: User can compare activity data side-by-side
After selecting two activities, the CLI SHALL fetch detailed data and streams for both and display a comparison.

#### Scenario: Display field comparison
- **WHEN** both activities have been selected
- **THEN** the CLI SHALL fetch activity details and streams for both activities
- **AND** display a side-by-side comparison of fields: name, distance, moving_time, elapsed_time, sport_type, start_date, average_heartrate, max_heartrate, average_cadence, average_watts, max_watts, average_speed, max_speed, total_elevation_gain, calories

#### Scenario: Display stream availability comparison
- **WHEN** both activities have been selected
- **THEN** the CLI SHALL show which stream channels (time, latlng, heartrate, altitude, distance, cadence, watts) are available in each activity

### Requirement: User can select which data to keep from each activity
The CLI SHALL allow the user to choose, for each field and stream channel, which of the two source activities to take the value from.

#### Scenario: Select activity name with custom option
- **WHEN** the field selection for the activity name is presented
- **THEN** the CLI SHALL offer three options: the name from activity A, the name from activity B, and "Escribir un título personalizado"
- **AND** if the user selects the custom option, the CLI SHALL present a text input prompt
- **AND** the user-entered title SHALL be used as the merged activity name

#### Scenario: Select fields per activity
- **WHEN** the comparison is displayed
- **THEN** the CLI SHALL present each field (excluding name) where both activities have a value
- **AND** the user SHALL select which activity's value to use for each field
- **AND** for fields present in only one activity, that value SHALL be used automatically

#### Scenario: Select stream channels per activity
- **WHEN** the comparison is displayed
- **THEN** for each stream channel available in both activities, the user SHALL select which activity to source it from
- **AND** for stream channels present in only one activity, that source SHALL be used automatically

#### Scenario: Select time base when both activities have time streams
- **WHEN** both activities have a `time` stream
- **THEN** the CLI SHALL ask the user which activity's `time` array to use as the temporal base
- **AND** stream channels selected from the non-base activity SHALL be linearly interpolated to align with the base `time` array

### Requirement: User must confirm before creating the merged activity
The CLI SHALL show a summary of the merged activity data and require explicit confirmation before creating it.

#### Scenario: Confirm merge creation
- **WHEN** the user has completed field and stream selection
- **THEN** the CLI SHALL display a summary of the resulting merged activity
- **AND** ask for explicit confirmation to proceed
- **AND** upon confirmation, generate a FIT file and upload it to Strava via `POST /uploads`

#### Scenario: Cancel merge creation
- **WHEN** the user declines confirmation
- **THEN** the CLI SHALL abort without creating any activity and exit cleanly

### Requirement: Merged activity is created in Strava via FIT upload
The CLI SHALL generate a FIT file from the merged streams and upload it to Strava. After upload processing, the activity name and description SHALL be set via `PUT /activities/{id}`.

#### Scenario: Successful FIT upload and activity creation
- **WHEN** the user confirms the merge
- **THEN** the CLI SHALL build `RecordPoint[]` from the merged stream channels aligned to the selected time base
- **AND** generate a FIT buffer using the existing FIT encoder
- **AND** upload the FIT file via `POST /uploads` with `data_type="fit"`
- **AND** poll `GET /uploads/{id}` until processing completes
- **AND** update the created activity via `PUT /activities/{id}` to set name and provenance description
- **AND** display the created activity's ID and name

#### Scenario: Upload processing timeout
- **WHEN** the upload processing does not complete within a reasonable time
- **THEN** the CLI SHALL display the upload ID for manual follow-up
- **AND** exit with code 1

#### Scenario: API error during upload
- **WHEN** the Strava API returns an error during FIT upload or processing
- **THEN** the CLI SHALL display the error message and exit with code 1
- **AND** no original activities SHALL be deleted

### Requirement: User can optionally delete original activities
After a successful merge, the CLI SHALL offer to delete the two original activities.

#### Scenario: User opts to delete originals
- **WHEN** the merged activity has been successfully created
- **THEN** the CLI SHALL ask if the user wants to delete the two original activities
- **AND** if confirmed, delete both originals via `DELETE /activities/{id}`
- **AND** display confirmation of deletion

#### Scenario: User declines deletion
- **WHEN** the user declines to delete originals
- **THEN** the CLI SHALL keep both original activities and exit cleanly

#### Scenario: Partial deletion failure
- **WHEN** one of the two delete requests fails
- **THEN** the CLI SHALL report which activity could not be deleted
- **AND** exit with code 1

### Requirement: Merge description documents provenance
The merged activity description MUST document which source activities contributed data, to maintain traceability.

#### Scenario: Description includes source references
- **WHEN** the merged activity is created
- **THEN** the description SHALL include the IDs and names of both source activities
- **AND** indicate which fields were taken from each source
