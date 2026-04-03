## ADDED Requirements

### Requirement: Export activity to FIT command
The CLI SHALL provide an `activities export` subcommand that exports a Strava activity to a FIT file.

#### Scenario: Interactive activity selection
- **WHEN** the user runs `strava activities export` without `--id` flag in interactive mode
- **THEN** the system SHALL fetch the most recent activities from the Strava API, present them as a selectable list using `@clack/prompts`, and export the selected activity to a FIT file

#### Scenario: Direct activity selection by ID
- **WHEN** the user runs `strava activities export --id <activity_id>`
- **THEN** the system SHALL export the specified activity to a FIT file without interactive prompts

#### Scenario: Default output filename
- **WHEN** the user runs `strava activities export` without `--output` flag
- **THEN** the system SHALL write the FIT file to `<activity_id>.fit` in the current working directory

#### Scenario: Custom output path
- **WHEN** the user runs `strava activities export --output /path/to/file.fit`
- **THEN** the system SHALL write the FIT file to the specified path

### Requirement: Strava activity streams retrieval
The system SHALL fetch detailed activity data from the Strava API streams endpoint to populate the FIT file.

#### Scenario: Fetch activity streams
- **WHEN** the system exports an activity
- **THEN** it SHALL request `GET /activities/{id}/streams` with keys `time,latlng,heartrate,altitude,distance,cadence,watts` and key_type `time`

#### Scenario: Validate streams response
- **WHEN** the Strava API returns the activity streams
- **THEN** the system SHALL validate the response against a Zod schema before processing

#### Scenario: Partial streams available
- **WHEN** the Strava API returns streams with only a subset of the requested keys (e.g., no heartrate or watts)
- **THEN** the system SHALL proceed with the available data and omit the missing fields from the FIT Record messages

### Requirement: FIT file structure
The exported FIT file SHALL conform to the Garmin FIT protocol specification with Activity file type.

#### Scenario: Valid FIT file header
- **WHEN** a FIT file is generated
- **THEN** it SHALL contain a 14-byte file header with correct protocol version, profile version, data size, ".FIT" data type signature, and header CRC

#### Scenario: Required FIT messages present
- **WHEN** a FIT file is generated
- **THEN** it SHALL contain, in order: File ID message (type=Activity), Event message (timer start), Record messages, Event message (timer stop), Lap message, Session message, and Activity message

#### Scenario: File ID message content
- **WHEN** the File ID message is written
- **THEN** it SHALL set type to Activity (4), manufacturer to Development, and time_created to the activity start time

#### Scenario: Valid FIT file CRC
- **WHEN** a FIT file is generated
- **THEN** it SHALL end with a 2-byte CRC calculated over all data bytes using the FIT CRC-16 algorithm

### Requirement: FIT Record messages from streams
The system SHALL create one FIT Record message per data point in the time stream.

#### Scenario: Record with GPS data
- **WHEN** latlng stream data is available
- **THEN** each Record message SHALL include position_lat and position_long fields converted from degrees to FIT semicircles format (value × (2^31 / 180))

#### Scenario: Record with heart rate
- **WHEN** heartrate stream data is available
- **THEN** each Record message SHALL include a heart_rate field (uint8, bpm)

#### Scenario: Record with altitude
- **WHEN** altitude stream data is available
- **THEN** each Record message SHALL include an altitude field with scale 5 and offset 500

#### Scenario: Record with distance
- **WHEN** distance stream data is available
- **THEN** each Record message SHALL include a distance field with scale 100 (value in meters × 100)

#### Scenario: Record with cadence
- **WHEN** cadence stream data is available
- **THEN** each Record message SHALL include a cadence field (uint8, rpm or spm)

#### Scenario: Record with power
- **WHEN** watts stream data is available
- **THEN** each Record message SHALL include a power field (uint16, watts)

#### Scenario: Record timestamp
- **WHEN** a Record message is written
- **THEN** it SHALL include a timestamp field calculated as the activity start time plus the time stream offset, using FIT epoch (Dec 31, 1989 00:00:00 UTC)

### Requirement: FIT summary messages
The system SHALL generate Lap, Session, and Activity summary messages from the activity data.

#### Scenario: Lap message
- **WHEN** the FIT file is generated
- **THEN** it SHALL contain one Lap message covering the entire activity with start_time, total_elapsed_time, total_timer_time, timestamp, sport, and sub_sport fields

#### Scenario: Session message
- **WHEN** the FIT file is generated
- **THEN** it SHALL contain one Session message with start_time, total_elapsed_time, total_timer_time, total_distance, timestamp, sport, sub_sport, first_lap_index, and num_laps fields

#### Scenario: Activity message
- **WHEN** the FIT file is generated
- **THEN** it SHALL contain one Activity message with timestamp, total_timer_time, num_sessions (1), type (manual), and local_timestamp fields

### Requirement: Sport type mapping
The system SHALL map Strava sport types to FIT sport and sub_sport enum values.

#### Scenario: Running activity
- **WHEN** the Strava activity sport_type is "Run" or "TrailRun"
- **THEN** the FIT sport SHALL be Running (1) with appropriate sub_sport

#### Scenario: Cycling activity
- **WHEN** the Strava activity sport_type is "Ride" or "MountainBikeRide" or "GravelRide"
- **THEN** the FIT sport SHALL be Cycling (2) with appropriate sub_sport

#### Scenario: Walking/Hiking activity
- **WHEN** the Strava activity sport_type is "Walk" or "Hike"
- **THEN** the FIT sport SHALL be Walking (11) or Hiking (17) respectively

#### Scenario: Unknown sport type
- **WHEN** the Strava activity sport_type does not have a known FIT mapping
- **THEN** the FIT sport SHALL be Generic (0)

### Requirement: Auth and error handling for export
The export command SHALL handle authentication and API errors gracefully.

#### Scenario: No stored token
- **WHEN** the user runs `strava activities export` and no access token is stored
- **THEN** the system SHALL display an error message instructing the user to run `strava login` first and exit with code 1

#### Scenario: Expired token
- **WHEN** the Strava API responds with HTTP 401 during export
- **THEN** the system SHALL display an error message indicating the session has expired and exit with code 1

#### Scenario: Activity not found
- **WHEN** the Strava API responds with HTTP 404 for the activity or streams request
- **THEN** the system SHALL display an error indicating the activity was not found and exit with code 1

#### Scenario: Streams unavailable
- **WHEN** the Strava API returns no usable stream data for the activity
- **THEN** the system SHALL display an error indicating no data is available for export and exit with code 1

#### Scenario: Successful export feedback
- **WHEN** the FIT file is written successfully
- **THEN** the system SHALL display the output file path and file size to the user
