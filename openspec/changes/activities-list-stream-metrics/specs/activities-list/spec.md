## MODIFIED Requirements

### Requirement: List activities command
The CLI SHALL provide an `activities list` command that retrieves and displays the authenticated user's Strava activities in the terminal. When the `--detailed` flag is provided, the system SHALL additionally fetch streams for each activity and display aggregated metrics.

#### Scenario: Successful activity listing
- **WHEN** the user runs `strava activities list` with a valid stored OAuth token
- **THEN** the system SHALL fetch activities from `GET /athlete/activities` and print them as a formatted table with columns: name, date, distance (km), moving time (min), and sport type

#### Scenario: Detailed activity listing
- **WHEN** the user runs `strava activities list --detailed` with a valid stored OAuth token
- **THEN** the system SHALL fetch activities from `GET /athlete/activities`, then for each activity fetch streams from `GET /activities/{id}/streams`, compute aggregated metrics, and display an extended table with additional columns: HR avg, HR max, Elev gain, Cadence, Power avg, Pace avg

#### Scenario: Detailed listing with activity missing streams
- **WHEN** the user runs `strava activities list --detailed` and an activity has no streams available
- **THEN** the system SHALL display `—` in all metrics columns for that activity

#### Scenario: Detailed listing progress feedback
- **WHEN** the user runs `strava activities list --detailed` in interactive mode
- **THEN** the system SHALL display a spinner with progress information indicating which activity stream is being fetched (e.g., "Obteniendo streams 3/10…")

#### Scenario: Empty activity list
- **WHEN** the Strava API returns an empty array of activities
- **THEN** the system SHALL display a message indicating no activities were found

## ADDED Requirements

### Requirement: Logger-based output
The `activities list` command SHALL use the project's `createLogger(flags)` system for all output, supporting interactive (TTY with spinners), JSON (`--json`), and raw (`--raw`) output modes consistently with other CLI commands.

#### Scenario: Basic listing with JSON output
- **WHEN** the user runs `strava activities list --json` without `--detailed`
- **THEN** the system SHALL output a JSON array of activity objects with fields: id, name, distance, moving_time, sport_type, start_date_local

#### Scenario: Basic listing with raw output
- **WHEN** the user runs `strava activities list --raw`
- **THEN** the system SHALL output the plain text table without interactive decorations (no spinner, no intro/outro)

#### Scenario: Interactive listing with spinner
- **WHEN** the user runs `strava activities list` in a TTY terminal
- **THEN** the system SHALL display a spinner while fetching activities from the API

### Requirement: Detailed flag
The `activities list` command SHALL accept a `--detailed` boolean flag that triggers fetching of activity streams and display of aggregated metrics.

#### Scenario: Flag not provided
- **WHEN** the user runs `strava activities list` without `--detailed`
- **THEN** the system SHALL NOT make any additional API calls for streams and SHALL display only the basic table

#### Scenario: Flag provided
- **WHEN** the user runs `strava activities list --detailed`
- **THEN** the system SHALL fetch streams for each listed activity and display metrics columns

### Requirement: Non-interactive mode with detailed flag
The `activities list` command SHALL support `--detailed` in non-interactive output modes.

#### Scenario: Detailed with JSON output
- **WHEN** the user runs `strava activities list --detailed --json`
- **THEN** the system SHALL output a JSON array where each activity object includes a `metrics` field with the computed stream metrics

#### Scenario: Detailed without TTY
- **WHEN** the user runs `strava activities list --detailed` in a non-interactive terminal
- **THEN** the system SHALL omit spinner progress but still fetch streams and display the extended table
